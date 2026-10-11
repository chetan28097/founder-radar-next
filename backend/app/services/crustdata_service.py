import os
import re
import logging
import requests
from typing import Dict, Any, List, Optional, Tuple
from app.config import settings
from app.models.schemas import FounderProfile, CareerPosition, SearchResponse
from app.observability.tracer import trace_span

logger = logging.getLogger(__name__)

# In-memory cache for profiles by id to prevent redundant upstream API hits
_profile_cache: Dict[str, FounderProfile] = {}
_raw_cache: Dict[str, Dict[str, Any]] = {}


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
        remarks = data.get("remarks")

        with trace_span("profile_normalization", raw_count=len(raw_profiles)):
            normalized_profiles = []
            for raw in raw_profiles:
                norm = cls.normalize_profile(raw, target_employer=effective_employer)
                normalized_profiles.append(norm)
                # Store in memory cache
                _profile_cache[norm.id] = norm
                _raw_cache[norm.id] = raw

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

        avatar_url = basic.get("profile_picture_url")

        # Parse current jobs
        raw_current = employment.get("current") or []
        if isinstance(raw_current, dict):
            raw_current = [raw_current]
        current_jobs = []
        primary_company = None
        for job in raw_current:
            pos = CareerPosition(
                company=job.get("name") or "Undisclosed Company",
                title=job.get("title") or current_title or "Founder",
                start_date=job.get("start_date"),
                end_date=None,
                is_current=True,
                description=job.get("description"),
            )
            current_jobs.append(pos)
            if not primary_company and job.get("name"):
                primary_company = job.get("name")

        # Parse past jobs
        raw_past = employment.get("past") or []
        if isinstance(raw_past, dict):
            raw_past = [raw_past]
        past_jobs = []
        for job in raw_past:
            pos = CareerPosition(
                company=job.get("name") or "Previous Company",
                title=job.get("title") or "Role",
                start_date=job.get("start_date"),
                end_date=job.get("end_date"),
                is_current=False,
                description=job.get("description"),
            )
            past_jobs.append(pos)

        # Detect founder status
        is_founder = False
        founder_keywords = ["founder", "co-founder", "founding", "chief executive officer", "ceo"]
        all_titles = [current_title.lower(), headline.lower()] + [j.title.lower() for j in current_jobs]
        if any(any(kw in t for kw in founder_keywords) for t in all_titles):
            is_founder = True

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
        if target_matched:
            tags.append(f"Ex-{target_matched}")
        if transition_status == "verified":
            tags.append("Verified Transition")
        elif transition_status == "unverified":
            tags.append("Pending Timeline Review")

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
            current_title=current_title or (current_jobs[0].title if current_jobs else "Founder"),
            current_company=primary_company or (current_jobs[0].company if current_jobs else None),
            location=location_str,
            country=country_str,
            avatar_url=avatar_url,
            current_jobs=current_jobs,
            past_jobs=past_jobs,
            founder_status=is_founder,
            transition_status=transition_status,
            transition_summary=transition_summary,
            target_company_match=target_matched,
            match_reasons=match_reasons,
            tags=tags,
            data_completeness=completeness,
        )

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
            target_norm = target_employer.strip().lower()
            matching_past = [
                j for j in past_jobs
                if target_norm in j.company.lower()
            ]
            matching_curr = [
                j for j in current_jobs
                if target_norm in j.company.lower()
            ]

            if matching_past:
                target_matched = matching_past[0].company
                match_reasons.append(f"Recorded previous employment at {target_matched} ({matching_past[0].title})")
            elif matching_curr:
                target_matched = matching_curr[0].company
                match_reasons.append(f"Currently associated with {target_matched}")

        if is_founder:
            curr_names = [j.company for j in current_jobs if j.company and j.company != "Undisclosed Company"]
            company_str = f"at {', '.join(curr_names)}" if curr_names else "in new venture"
            match_reasons.append(f"Identified as Founder / Executive {company_str}")

        # Transition classification logic
        if target_employer and target_matched:
            past_match = next((j for j in past_jobs if target_employer.lower() in j.company.lower()), None)
            curr_founder_job = next((j for j in current_jobs if any(k in j.title.lower() for k in ["founder", "ceo"])), None)

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
            if past_jobs and any(j.end_date for j in past_jobs) and any(j.start_date for j in current_jobs):
                status = "verified"
                most_recent_past = past_jobs[0]
                summary = f"Recorded transition from {most_recent_past.title} at {most_recent_past.company} into current founder venture."
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
        return _profile_cache.get(profile_id)

    @classmethod
    def get_raw_profile(cls, profile_id: str) -> Optional[Dict[str, Any]]:
        return _raw_cache.get(profile_id)
