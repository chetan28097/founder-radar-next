import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from litellm import completion
from app.config import settings
from app.models.schemas import FounderProfile, ResearchResponse, OutreachDraftResponse
from app.observability.tracer import trace_span

logger = logging.getLogger(__name__)


class AIService:

    @classmethod
    def _call_model(cls, prompt: str, system_prompt: str, timeout: int = 40) -> str:
        """
        Dispatches completion call to Claude via the configured LiteLLM gateway.
        """
        model = settings.LITELLM_MODEL
        base_url = settings.LITELLM_BASE_URL
        api_key = settings.LITELLM_API_KEY

        if not model or not base_url or not api_key:
            raise RuntimeError("LiteLLM configuration (LITELLM_MODEL, LITELLM_BASE_URL, LITELLM_API_KEY) is incomplete.")

        response = completion(
            model=model,
            api_base=base_url,
            api_key=api_key,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            timeout=timeout,
        )

        content = response.choices[0].message.content or ""
        return content.strip()

    @classmethod
    def _parse_json_response(cls, content: str) -> Dict[str, Any]:
        """
        Safely strips markdown fences and parses JSON.
        """
        cleaned = content.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()

        try:
            return json.loads(cleaned)
        except Exception as exc:
            logger.warning(f"Failed to parse LLM JSON response: {exc}. Content preview: {cleaned[:300]}")
            return {}

    @classmethod
    def generate_dossier_research(
        cls,
        profile: FounderProfile,
        custom_question: Optional[str] = None,
        tone: str = "professional",
    ) -> ResearchResponse:
        """
        Generates an evidence-grounded research synthesis, gap analysis,
        suggested diligence questions, and personalized outreach draft.
        """
        from app.services.crustdata_service import CrustdataService

        profile_dict = profile.model_dump(exclude={"avatar_url", "tags", "data_completeness"})
        data_gaps = CrustdataService.compute_data_gaps(profile)

        system_prompt = (
            "You are the senior research analyst for Founder Radar, a global founder intelligence platform. "
            "Your output must be grounded strictly in the provided profile data, which comes from Crustdata. "
            "Never invent companies, dates, patents, funding rounds, products, or personal relationships. "
            "Never conclude that someone founded a company because they left an employer; founding requires an explicit founder title. "
            "Explicitly separate recorded facts from interpretation. "
            "If information is missing, say it is missing instead of guessing. "
            "Return ONLY a valid JSON object matching the requested schema."
        )

        prompt = f"""
Candidate Profile Data (Crustdata record, normalized):
{json.dumps(profile_dict, indent=2, ensure_ascii=False)}

Gaps already detected in the record:
{json.dumps(data_gaps, ensure_ascii=False)}

User Inquiry: {custom_question or "Perform standard founder transition and background diligence analysis."}
Preferred Outreach Tone: {tone}

Instructions:
1. Provide a concise 'research_summary' (3-5 sentences) of their career journey and current company, using only the record.
2. Keep 'transition_status' as given unless the record clearly contradicts it.
3. List 'supporting_evidence': each item must restate a specific recorded fact (role, company, date, company detail).
4. List 'uncertainties': what cannot be concluded from the record (funding, traction, product, role scope, missing dates).
5. Suggest 3-4 specific 'suggested_questions' for diligence that would resolve those uncertainties.
6. Draft a short 'outreach_draft' for human review, referencing only recorded facts.

Return a JSON object in this exact structure:
{{
  "research_summary": "string",
  "transition_status": "{profile.transition_status}",
  "supporting_evidence": ["fact 1", "fact 2"],
  "uncertainties": ["gap 1", "gap 2"],
  "suggested_questions": ["question 1", "question 2", "question 3"],
  "outreach_draft": "string"
}}
"""

        with trace_span("ai_synthesis", profile_id=profile.id, model=settings.LITELLM_MODEL):
            try:
                raw_response = cls._call_model(prompt, system_prompt)
            except Exception as exc:
                logger.error(f"AI synthesis failed: {exc}")
                raise RuntimeError(f"The model call failed: {exc}") from exc
            parsed = cls._parse_json_response(raw_response)

        # No silent fallback: generic text must never be presented as model output.
        summary = parsed.get("research_summary")
        if not summary:
            raise RuntimeError("The model returned no usable research summary.")

        def _str_list(value: Any) -> List[str]:
            return [str(v) for v in value if v] if isinstance(value, list) else []

        return ResearchResponse(
            profile_id=profile.id,
            research_summary=summary,
            transition_status=parsed.get("transition_status") or profile.transition_status,
            supporting_evidence=_str_list(parsed.get("supporting_evidence")),
            uncertainties=_str_list(parsed.get("uncertainties")),
            suggested_questions=_str_list(parsed.get("suggested_questions")),
            outreach_draft=parsed.get("outreach_draft") or "",
            model=settings.LITELLM_MODEL,
            custom_question=custom_question,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

    @classmethod
    def generate_outreach_draft(
        cls,
        profile: FounderProfile,
        tone: str = "professional",
        sender_context: Optional[str] = None,
    ) -> OutreachDraftResponse:
        """
        Generates an editable, personalized outreach message grounded in the candidate's career.
        """
        system_prompt = (
            "You are a professional communications assistant for Founder Radar. "
            "Generate personalized, high-conversion email outreach drafts for startup founders. "
            "Rely strictly on provided facts. Do not invent personal details. "
            "Return ONLY a valid JSON object."
        )

        first_name = profile.name.split()[0] if profile.name else "there"
        recent_company = profile.past_jobs[0].company if profile.past_jobs else "your previous work"

        prompt = f"""
Candidate: {profile.name}
Current Role: {profile.current_title} at {profile.current_company or 'New Venture'}
Past Role: {profile.past_jobs[0].title if profile.past_jobs else 'Senior Leader'} at {recent_company}
Location: {profile.location}
Requested Tone: {tone}
Sender Background/Context: {sender_context or "General industry peer / research scout"}

Draft a concise, compelling message. Output JSON:
{{
  "subject": "string",
  "body": "string",
  "grounded_points": ["point 1", "point 2"]
}}
"""

        with trace_span("outreach_generation", profile_id=profile.id, tone=tone):
            try:
                raw_response = cls._call_model(prompt, system_prompt)
            except Exception as exc:
                logger.error(f"Outreach generation error: {exc}")
                raise RuntimeError(f"The model call failed: {exc}") from exc
            parsed = cls._parse_json_response(raw_response)

        if not parsed.get("body"):
            raise RuntimeError("The model returned no usable draft.")

        return OutreachDraftResponse(
            profile_id=profile.id,
            subject=parsed.get("subject") or f"Hello from a Founder Radar user, {first_name}",
            body=parsed["body"],
            tone=tone,
            grounded_points=[str(p) for p in parsed.get("grounded_points") or [] if p],
        )
