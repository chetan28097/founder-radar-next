from unittest.mock import patch, MagicMock
from app.services.ai_service import AIService
from app.models.schemas import FounderProfile, CareerPosition


def test_parse_json_response_with_markdown_fences():
    content = """```json
{
  "research_summary": "Strong background in fintech.",
  "transition_status": "verified",
  "supporting_evidence": ["Worked at Stripe"],
  "uncertainties": [],
  "suggested_questions": ["What is your stack?"],
  "outreach_draft": "Hello!"
}
```"""
    parsed = AIService._parse_json_response(content)
    assert parsed.get("transition_status") == "verified"
    assert parsed.get("research_summary") == "Strong background in fintech."


@patch("app.services.ai_service.completion")
def test_generate_dossier_research_mocked(mock_completion):
    mock_resp = MagicMock()
    mock_resp.choices = [
        MagicMock(message=MagicMock(content="""{
            "research_summary": "Extensive experience building distributed infrastructure.",
            "transition_status": "verified",
            "supporting_evidence": ["Former Tech Lead at Stripe"],
            "uncertainties": ["Seed funding unconfirmed"],
            "suggested_questions": ["What market wedge are you pursuing?"],
            "outreach_draft": "Hi Alex, great to connect!"
        }"""))
    ]
    mock_completion.return_value = mock_resp

    profile = FounderProfile(
        id="test-1",
        name="Alex River",
        current_title="Founder",
        current_company="Aether Labs",
        location="San Francisco",
        founder_status=True,
        transition_status="verified",
        past_jobs=[CareerPosition(company="Stripe", title="Tech Lead")],
    )

    res = AIService.generate_dossier_research(profile)
    assert res.profile_id == "test-1"
    assert "Extensive experience" in res.research_summary
    assert res.transition_status == "verified"
    assert len(res.suggested_questions) == 1
