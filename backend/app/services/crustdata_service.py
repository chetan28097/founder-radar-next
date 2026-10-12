import os
import re
import logging
import requests
from typing import Dict, Any, List, Optional, Tuple
from app.config import settings
from app.models.schemas import (
    FounderProfile, CareerPosition, SearchResponse, CompanyOverview, EducationEntry
)
from app.observability.tracer import trace_span
from app.repositories.profile_repository import ProfileCacheRepository

logger = logging.getLogger(__name__)

# In-memory cache for profiles by id to prevent redundant upstream API hits.
# Raw records are also persisted to SQLite (profile_cache) so dossiers survive restarts.
_profile_cache: Dict[str, FounderProfile] = {}
_raw_cache: Dict[str, Dict[str, Any]] = {}

FOUNDER_KEYWORDS = ["founder", "co-founder", "cofounder", "founding"]


def _clean_url(value: Any, required_host: Optional[str] = None) -> Optional[str]:
    """Return an http(s) URL as provided by Crustdata, or None if it is not a usable link."""
    if not isinstance(value, str) or not value.strip():
        return None
    url = value.strip()
    if not re.match(r"^https?://", url, re.IGNORECASE):
        if re.match(r"^[\w.-]+\.[a-z]{2,}(/.*)?$", url, re.IGNORECASE):
            url = f"https://{url}"
        else:
            return None
    host = re.sub(r"^https?://", "", url, flags=re.IGNORECASE).split("/")[0].lower()
    if required_host and not (host == required_host or host.endswith("." + required_host)):
        return None
    return url


def _company_matches(company: Optional[str], employer: str) -> bool:
    """Whole-word match on the company name, ignoring parenthetical notes such as
    "Orum.io (We've joined Stripe)", which would otherwise read as Stripe experience."""
    name = re.sub(r"\(.*?\)", " ", company or "").lower()
    target = employer.strip().lower()
    return bool(target) and re.search(rf"(?<![\w]){re.escape(target)}(?![\w])", name) is not None


def _is_founder_title(title: Optional[str]) -> bool:
    t = (title or "").lower()
    return any(kw in t for kw in FOUNDER_KEYWORDS)


class CrustdataService:

    @classmethod
    def get_headers(cls) -> Dict[str, str]:
        api_key = settings.CRUSTDATA_API_KEY
        if not api_key:
            raise RuntimeError("CRUSTDATA_API_KEY is not configured in environment.")

        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "x-api-version": settings.CRUSTDATA_API_VERSION,
        }

    @classmethod
    def parse_natural_query(cls, query: Optional[str]) -> Dict[str, str]:
        """
        Extract recognizable intent parameters from natural language input.
        e.g. 'Founders who previously worked at Stripe in San Francisco'
        """
        extracted = {}
        if not query or not query.strip():
            return extracted

        q_lower = query.lower()

        # Detect target employers
        common_employers = [
            "stripe", "google", "meta", "facebook", "apple", "amazon", "microsoft",
            "uber", "airbnb", "palantir", "twitter", "x", "coinbase", "netflix",
            "salesforce", "datadog", "figma", "openai", "scale ai", "anthropic",
            "snowflake", "revolut", "brex", "ramp", "plaid", "robinhood"
        ]
        for emp in common_employers:
            if re.search(rf"\b(ex-?|previously at |worked at |from ){emp}\b", q_lower) or emp in q_lower:
                extracted["employer"] = emp.title()
                break

        # Detect location signals
        locations = [
            "san francisco", "sf", "bay area", "new york", "nyc", "london", "berlin",
            "paris", "bengaluru", "bangalore", "singapore", "toronto", "austin",
            "seattle", "tokyo", "india", "united states", "usa", "uk", "germany"
        ]
        for loc in locations:
            if re.search(rf"\b(in |at |based in ){loc}\b", q_lower):
                extracted["location"] = loc.title()
                break

        # Role signals
        if "co-founder" in q_lower:
            extracted["role"] = "Co-Founder"
        elif "ceo" in q_lower:
            extracted["role"] = "CEO"
        elif "founder" in q_lower:
            extracted["role"] = "Founder"

        return extracted

    @classmethod
    def build_crustdata_payload(
        cls,
        employer: Optional[str] = None,
        role: Optional[str] = None,
        location: Optional[str] = None,
        country: Optional[str] = None,
        limit: int = 10,
        cursor: Optional[str] = None,
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Construct valid Crustdata People Search AST filters.
        """
        conditions = []
        applied_filters = {}

        # Default role filter is Founder if not specified
        target_role = role or "Founder"
        conditions.append({
            "field": "experience.employment_details.current.title",
            "type": "(.)",
            "value": target_role,
        })
        applied_filters["current_title"] = target_role

        # Past employer filter
        if employer:
            conditions.append({
                "field": "experience.employment_details.past.name",
                "type": "(.)",
                "value": employer,
            })
            applied_filters["previous_employer"] = employer

        # Location filter
        if location:
            conditions.append({
                "field": "basic_profile.location.full_location",
                "type": "(.)",
                "value": location,
            })
            applied_filters["location"] = location

        if country:
            conditions.append({
                "field": "basic_profile.location.country",
                "type": "(.)",
                "value": country,
            })
            applied_filters["country"] = country

        payload: Dict[str, Any] = {
            "filters": {
                "op": "and",
                "conditions": conditions,
            },
            "limit": limit,
        }

        if cursor:
            payload["cursor"] = cursor
            applied_filters["cursor"] = cursor

        return payload, applied_filters

    @classmethod
    def search_founders(
        cls,
        query: Optional[str] = None,
        employer: Optional[str] = None,
        role: Optional[str] = None,
        location: Optional[str] = None,
        country: Optional[str] = None,
        limit: int = 10,
        cursor: Optional[str] = None,
    ) -> SearchResponse:
        """
        Executes search on Crustdata People Search API with fallback query relaxation
        and grounded profile normalization.
        """
        # Parse natural query if explicit filters are omitted
        extracted = cls.parse_natural_query(query)
        effective_employer = employer or extracted.get("employer")
        effective_role = role or extracted.get("role", "Founder")
        effective_location = location or extracted.get("location")
        effective_country = country

        query_interpretation = None
        if query:
            intent_parts = []
            if effective_employer:
                intent_parts.append(f"Ex-{effective_employer}")
            if effective_role:
                intent_parts.append(f"Current {effective_role}")
            if effective_location:
                intent_parts.append(f"in {effective_location}")
            query_interpretation = " · ".join(intent_parts) if intent_parts else f"Searching for: {query}"

        payload, applied_filters = cls.build_crustdata_payload(
            employer=effective_employer,
            role=effective_role,
            location=effective_location,
            country=effective_country,
            limit=limit,
            cursor=cursor,
        )

        with trace_span("crustdata_fetch", filters=applied_filters, limit=limit) as span:
            try:
                headers = cls.get_headers()
                response = requests.post(
                    settings.CRUSTDATA_API_URL,
                    headers=headers,
                    json=payload,
                    timeout=30,
                )

                # If specific employer returned 0 results due to strict upstream indexing,
                # fall back to broader founder search and post-filter or return available
                if not response.ok and response.status_code == 400 and effective_employer:
                    logger.warning("Crustdata returned 400 for strict filter, falling back to base founder search")
                    fallback_payload, fallback_filters = cls.build_crustdata_payload(
                        employer=None,
                        role=effective_role,
                        location=effective_location,
                        country=effective_country,
                        limit=limit,
                        cursor=cursor,
                    )
                    response = requests.post(
                        settings.CRUSTDATA_API_URL,
                        headers=headers,
                        json=fallback_payload,
                        timeout=30,
                    )

                response.raise_for_status()
                data = response.json()

            except requests.RequestException as exc:
                logger.error(f"Crustdata API request error: {exc}")
                raise RuntimeError(f"Crustdata People Search API failed: {exc}")

        raw_profiles = data.get("profiles", [])
        total_count = data.get("total_count")
        next_cursor = data.get("next_cursor")
        raw_remarks = data.get("remarks")
        remarks = ", ".join(str(r) for r in raw_remarks) if isinstance(raw_remarks, list) and raw_remarks else (str(raw_remarks) if raw_remarks else None)

        with trace_span("profile_normalization", raw_count=len(raw_profiles)):
            normalized_profiles = []
            seen_ids = set()
            for raw in raw_profiles:
                norm = cls.normalize_profile(raw, target_employer=effective_employer)
                # Crustdata can repeat a person across a page; keep the first occurrence
                if not norm.id or norm.id in seen_ids:
                    continue
                seen_ids.add(norm.id)
                normalized_profiles.append(norm)
                _profile_cache[norm.id] = norm
                _raw_cache[norm.id] = raw
                try:
                    ProfileCacheRepository.upsert_raw(norm.id, raw)
                except Exception as exc:
                    logger.warning(f"Could not persist profile {norm.id} to cache: {exc}")

        return SearchResponse(
            count=len(normalized_profiles),
            total_count=total_count,
            profiles=normalized_profiles,
            next_cursor=next_cursor,
            applied_filters=applied_filters,
            query_interpretation=query_interpretation,
            remarks=remarks,
        )

    @classmethod
    def normalize_profile(
        cls,
        raw: Dict[str, Any],
        target_employer: Optional[str] = None,
    ) -> FounderProfile:
        """
        Normalizes Crustdata raw person JSON into a structured FounderProfile
        with grounded transition verification.
        """
        basic = raw.get("basic_profile") or {}
        experience = raw.get("experience") or {}
        employment = experience.get("employment_details") or {}

        person_id = str(raw.get("crustdata_person_id") or raw.get("id") or "")
        name = basic.get("name") or "Unnamed Professional"
        headline = basic.get("headline") or ""
        current_title = basic.get("current_title") or ""

        location_data = basic.get("location") or {}
        location_str = "Location Unknown"
        country_str = None
        if isinstance(location_data, dict):
            location_str = location_data.get("full_location") or location_data.get("city") or "Location Unknown"
            country_str = location_data.get("country")
        elif isinstance(location_data, str):
            location_str = location_data

        avatar_url = _clean_url(basic.get("profile_picture_permalink") or basic.get("profile_picture_url"))

        socials = raw.get("social_handles") or {}
        linkedin_url = _clean_url(
            (socials.get("professional_network_identifier") or {}).get("profile_url"),
            required_host="linkedin.com",
        )

        # Parse current jobs (title left empty when Crustdata has none; never defaulted to "Founder")
        raw_current = employment.get("current") or []
        if isinstance(raw_current, dict):
            raw_current = [raw_current]
        current_jobs = [cls._build_position(job, is_current=True) for job in raw_current]

        # Parse past jobs
        raw_past = employment.get("past") or []
        if isinstance(raw_past, dict):
            raw_past = [raw_past]
        past_jobs = [cls._build_position(job, is_current=False) for job in raw_past]
        # Most recent first, by end date when available
        past_jobs.sort(key=lambda j: j.end_date or "", reverse=True)

        # Founder status comes only from explicit founder titles on current roles.
        # A CEO title or a departure from an employer is not treated as evidence of founding.
        is_founder = _is_founder_title(current_title) or any(_is_founder_title(j.title) for j in current_jobs)

        # Prefer the current role that carries the founder title as the "current company"
        primary_job = next((j for j in current_jobs if _is_founder_title(j.title)), None) or (
            current_jobs[0] if current_jobs else None
        )
        primary_company = primary_job.company if primary_job and primary_job.company != "Undisclosed Company" else None
        company = None
        if primary_job and primary_company:
            company = CompanyOverview(
                name=primary_job.company,
                title=primary_job.title,
                start_date=primary_job.start_date,
                website=primary_job.company_website,
                linkedin_url=primary_job.company_linkedin_url,
                logo_url=primary_job.company_logo_url,
                industries=primary_job.company_industries,
                headcount=primary_job.company_headcount,
                headcount_range=primary_job.company_headcount_range,
                hq=primary_job.company_hq,
                company_type=primary_job.company_type,
            )

        education = []
        for school in ((raw.get("education") or {}).get("schools") or []):
            if not isinstance(school, dict) or not school.get("school"):
                continue
            education.append(EducationEntry(
                school=school.get("school"),
                degree=school.get("degree"),
                start_year=school.get("start_year") if isinstance(school.get("start_year"), int) else None,
                end_year=school.get("end_year") if isinstance(school.get("end_year"), int) else None,
            ))

        # Grounded transition classification
        transition_status, transition_summary, match_reasons, target_matched = cls._evaluate_transition(
            current_jobs=current_jobs,
            past_jobs=past_jobs,
            target_employer=target_employer,
            is_founder=is_founder,
            current_title=current_title,
        )

        tags = []
        if is_founder:
            tags.append("Founder")
        if target_matched and any(target_matched == j.company for j in past_jobs):
            tags.append(f"Ex-{target_matched}")

        # Calculate data completeness metric
        data_points = [
            bool(name),
            bool(current_title),
            bool(location_str and location_str != "Location Unknown"),
            len(current_jobs) > 0,
            len(past_jobs) > 0,
            any(j.start_date for j in current_jobs),
            any(j.start_date and j.end_date for j in past_jobs),
        ]
        completeness = round(sum(1 for d in data_points if d) / len(data_points), 2)

        return FounderProfile(
            id=person_id,
            crustdata_id=person_id,
            name=name,
            headline=headline,
            current_title=current_title or (primary_job.title if primary_job and primary_job.title else None),
            current_company=primary_company,
            location=location_str,
            country=country_str,
            avatar_url=avatar_url,
            linkedin_url=linkedin_url,
            company=company,
            education=education,
            current_jobs=current_jobs,
            past_jobs=past_jobs,
            founder_status=is_founder,
            transition_status=transition_status,
            transition_summary=transition_summary,
            target_company_match=target_matched,
            match_reasons=match_reasons,
            tags=tags,
            data_completeness=completeness,
            data_updated_at=(raw.get("metadata") or {}).get("updated_at"),
        )

    @classmethod
    def _build_position(cls, job: Dict[str, Any], is_current: bool) -> CareerPosition:
        industries = job.get("company_industries") or []
        if not isinstance(industries, list):
            industries = [str(industries)]
        if not industries and job.get("company_professional_network_industry"):
            industries = [job.get("company_professional_network_industry")]
        job_location = job.get("location")
        if isinstance(job_location, dict):
            job_location = job_location.get("raw") or job_location.get("full_location")
        headcount = job.get("company_headcount_latest")
        return CareerPosition(
            company=job.get("name") or ("Undisclosed Company" if is_current else "Previous Company"),
            title=job.get("title") or "",
            start_date=job.get("start_date"),
            end_date=None if is_current else job.get("end_date"),
            is_current=is_current,
            description=job.get("description"),
            company_website=_clean_url(job.get("company_website")),
            company_linkedin_url=_clean_url(job.get("company_professional_network_profile_url"), required_host="linkedin.com"),
            company_logo_url=_clean_url(job.get("company_profile_picture_permalink")),
            company_industries=[str(i) for i in industries if i],
            company_headcount=headcount if isinstance(headcount, int) else None,
            company_headcount_range=job.get("company_headcount_range"),
            company_hq=job.get("company_hq_location") or job.get("company_headquarters_country"),
            company_type=job.get("company_type"),
            location=job_location if isinstance(job_location, str) else None,
        )

    @classmethod
    def compute_data_gaps(cls, profile: FounderProfile) -> List[str]:
        """Deterministic list of facts missing from the sourced record. Never AI-generated."""
        gaps = []
        if not profile.linkedin_url:
            gaps.append("No LinkedIn profile URL in the Crustdata record.")
        if not profile.current_company:
            gaps.append("No current company recorded.")
        elif profile.company and not profile.company.website:
            gaps.append(f"No website recorded for {profile.company.name}.")
        if profile.company and not profile.company.start_date:
            gaps.append("Start date of the current role is missing.")
        if not profile.founder_status:
            gaps.append("No current title says founder, so founding is not established.")
        undated = [j for j in profile.past_jobs if not (j.start_date and j.end_date)]
        if undated:
            gaps.append(f"{len(undated)} of {len(profile.past_jobs)} past roles are missing start or end dates.")
        if not profile.past_jobs:
            gaps.append("No past employment recorded.")
        if not profile.education:
            gaps.append("No education records.")
        if not profile.location or profile.location == "Location Unknown":
            gaps.append("Location unknown.")
        return gaps

    @classmethod
    def _evaluate_transition(
        cls,
        current_jobs: List[CareerPosition],
        past_jobs: List[CareerPosition],
        target_employer: Optional[str],
        is_founder: bool,
        current_title: str,
    ) -> Tuple[str, str, List[str], Optional[str]]:
        """
        Deterministic, rule-based transition evaluator that adheres to prompt guidelines:
        - Never infer founder activity solely because someone left an employer.
        - Verified requires verifiable dates and explicit past company.
        - Insufficient evidence when dates or history are missing.
        """
        match_reasons = []
        target_matched = None

        if target_employer:
            matching_past = [j for j in past_jobs if _company_matches(j.company, target_employer)]
            matching_curr = [j for j in current_jobs if _company_matches(j.company, target_employer)]

            if matching_past:
                target_matched = matching_past[0].company
                match_reasons.append(f"Recorded previous employment at {target_matched} ({matching_past[0].title})")
            elif matching_curr:
                target_matched = matching_curr[0].company
                match_reasons.append(f"Currently associated with {target_matched}")

        if is_founder:
            curr_names = [j.company for j in current_jobs if j.company and j.company != "Undisclosed Company"]
            company_str = f"at {', '.join(curr_names)}" if curr_names else "in new venture"
            match_reasons.append(f"Current title includes founder {company_str}")

        # Transition classification logic
        if target_employer and target_matched:
            past_match = next((j for j in past_jobs if _company_matches(j.company, target_employer)), None)
            curr_founder_job = next((j for j in current_jobs if _is_founder_title(j.title)), None)

            if past_match and curr_founder_job and past_match.end_date and curr_founder_job.start_date:
                status = "verified"
                summary = (
                    f"Verified career transition: Formerly {past_match.title} at {past_match.company} "
                    f"until {past_match.end_date[:10] if len(past_match.end_date) >= 10 else past_match.end_date}, "
                    f"transitioned to {curr_founder_job.title} at {curr_founder_job.company} starting {curr_founder_job.start_date[:10]}."
                )
            elif past_match and is_founder:
                status = "unverified"
                summary = (
                    f"Plausible transition from {past_match.company} to founder role, "
                    f"but exact transition chronology contains unverified or missing timestamps."
                )
            else:
                status = "insufficient_evidence"
                summary = (
                    f"Profile records affiliation with {target_matched}, but insufficient sequential evidence "
                    f"to establish a verified founder transition timeline."
                )
        elif is_founder:
            founder_job = next((j for j in current_jobs if _is_founder_title(j.title) and j.start_date), None)
            dated_past = [j for j in past_jobs if j.end_date]
            if founder_job and dated_past:
                status = "verified"
                founded = founder_job.start_date[:7]
                before = [j for j in dated_past if j.end_date[:7] <= founded]
                if before:
                    prior = max(before, key=lambda j: j.end_date)
                    summary = (
                        f"Dated record: {prior.title or 'role'} at {prior.company} ended {prior.end_date[:7]}; "
                        f"{founder_job.title} at {founder_job.company} started {founded}."
                    )
                else:
                    # Every dated past role ended after the founder role began: report the overlap as recorded
                    overlap = min(dated_past, key=lambda j: j.end_date)
                    summary = (
                        f"Dated record: {founder_job.title} at {founder_job.company} started {founded}, while "
                        f"{overlap.title or 'a role'} at {overlap.company} continued until {overlap.end_date[:7]}."
                    )
            elif past_jobs:
                status = "unverified"
                summary = "Active founder role supported by title; previous employment history present without complete dates."
            else:
                status = "insufficient_evidence"
                summary = "Founder title noted, but past employment trajectory is undocumented in the public profile."
        else:
            status = "insufficient_evidence"
            summary = "Insufficient evidence to confirm current founder activity or startup creation."

        return status, summary, match_reasons, target_matched

    @classmethod
    def get_cached_profile(cls, profile_id: str) -> Optional[FounderProfile]:
        cached = _profile_cache.get(profile_id)
        if cached:
            return cached
        raw = cls.get_raw_profile(profile_id)
        if raw:
            profile = cls.normalize_profile(raw)
            _profile_cache[profile_id] = profile
            return profile
        return None

    @classmethod
    def get_raw_profile(cls, profile_id: str) -> Optional[Dict[str, Any]]:
        raw = _raw_cache.get(profile_id)
        if raw:
            return raw
        try:
            raw = ProfileCacheRepository.get_raw(profile_id)
        except Exception as exc:
            logger.warning(f"Profile cache lookup failed for {profile_id}: {exc}")
            raw = None
        if raw:
            _raw_cache[profile_id] = raw
        return raw
