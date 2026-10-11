import os
import json
import logging
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
        profile_dict = profile.model_dump()

        system_prompt = (
            "You are the senior research analyst for Founder Radar, a global founder intelligence platform. "
            "Your output must be grounded strictly in the provided profile data. "
            "Never invent companies, dates, patents, funding rounds, or personal relationships. "
            "Explicitly separate verified facts from hypotheses. "
            "If information is missing, explicitly state what is missing. "
            "Return ONLY a valid JSON object matching the requested schema."
        )

        prompt = f"""
Candidate Profile Data:
{json.dumps(profile_dict, indent=2, ensure_ascii=False)}

User Inquiry: {custom_question or "Perform standard founder transition and background diligence analysis."}
Preferred Outreach Tone: {tone}

Instructions:
1. Provide a concise, fact-grounded 'research_summary' synthesizing their career journey and founder indicators.
2. Evaluate transition credibility ('verified', 'unverified', or 'insufficient_evidence') using documented evidence.
3. List 'supporting_evidence' (quotes or facts explicitly grounded in their positions/dates).
4. List 'uncertainties' and data gaps (e.g. unknown funding status, stealth mode ambiguity, missing dates).
5. Suggest 3-4 specific 'suggested_questions' for a first exploratory conversation.
6. Draft an 'outreach_draft' for human review, referencing only true facts from their profile.

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
                parsed = cls._parse_json_response(raw_response)
            except Exception as exc:
                logger.error(f"AI synthesis failed: {exc}")
                parsed = {}

        # Fallback to grounded defaults if LLM call is interrupted or returns invalid JSON
        summary = parsed.get("research_summary") or (
            f"{profile.name} is currently {profile.current_title} at {profile.current_company or 'their venture'} in {profile.location}. "
            f"Career history records {len(profile.past_jobs)} prior positions, including {profile.past_jobs[0].company if profile.past_jobs else 'past industry roles'}."
        )

        transition_status = parsed.get("transition_status") or profile.transition_status
        evidence = parsed.get("supporting_evidence") or profile.match_reasons
        uncertainties = parsed.get("uncertainties") or [
            "Current company incorporation status not verified in public register.",
            "Stealth domain or product url not directly cited in profile headline."
        ]
        questions = parsed.get("suggested_questions") or [
            f"What prompted the transition from {profile.past_jobs[0].company if profile.past_jobs else 'your previous role'} to founding your current venture?",
            "What core technical or market problem is your current team focused on?",
            "What milestones are prioritized over the upcoming quarter?"
        ]
        outreach = parsed.get("outreach_draft") or (
            f"Hi {profile.name.split()[0] if profile.name else 'there'},\n\n"
            f"I came across your profile and noticed your journey from {profile.past_jobs[0].company if profile.past_jobs else 'your previous leadership roles'} "
            f"into building {profile.current_company or 'your new company'}. "
            f"I would welcome the opportunity to connect and learn more about what you're working on.\n\n"
            f"Best regards,"
        )

        return ResearchResponse(
            profile_id=profile.id,
            research_summary=summary,
            transition_status=transition_status,
            supporting_evidence=evidence,
            uncertainties=uncertainties,
            suggested_questions=questions,
            outreach_draft=outreach,
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
                parsed = cls._parse_json_response(raw_response)
            except Exception as exc:
                logger.error(f"Outreach generation error: {exc}")
                parsed = {}

        subject = parsed.get("subject") or f"Connecting with {profile.current_company or 'your new venture'} / ex-{recent_company}"
        body = parsed.get("body") or (
            f"Hi {first_name},\n\n"
            f"I've been following career transitions of leaders emerging from {recent_company}, and your current work at "
            f"{profile.current_company or 'your current startup'} immediately caught my attention.\n\n"
            f"Given your background in {profile.current_title}, I would love to connect briefly to hear about your vision.\n\n"
            f"Would you be open to a 15-minute introductory conversation next week?\n\n"
            f"Best,\n[Your Name]"
        )
        grounded_points = parsed.get("grounded_points") or [
            f"Referenced prior experience at {recent_company}",
            f"Acknowledged current role as {profile.current_title}",
            f"Based in {profile.location}"
        ]

        return OutreachDraftResponse(
            profile_id=profile.id,
            subject=subject,
            body=body,
            tone=tone,
            grounded_points=grounded_points,
        )
