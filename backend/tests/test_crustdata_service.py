from app.services.crustdata_service import CrustdataService
from app.models.schemas import CareerPosition


def test_parse_natural_query():
    # ex-Stripe founder in San Francisco
    parsed = CrustdataService.parse_natural_query("Find founders who previously worked at Stripe in San Francisco")
    assert parsed.get("employer") == "Stripe"
    assert parsed.get("location") == "San Francisco"
    assert parsed.get("role") == "Founder"

    # Co-founder from Google
    parsed2 = CrustdataService.parse_natural_query("Co-founder from Google in London")
    assert parsed2.get("employer") == "Google"
    assert parsed2.get("location") == "London"
    assert parsed2.get("role") == "Co-Founder"


def test_build_crustdata_payload():
    payload, filters = CrustdataService.build_crustdata_payload(
        employer="Stripe",
        role="Founder",
        location="San Francisco",
        limit=5,
    )
    assert payload["limit"] == 5
    conditions = payload["filters"]["conditions"]
    assert len(conditions) == 3
    assert any(c["value"] == "Stripe" for c in conditions)
    assert any(c["value"] == "Founder" for c in conditions)
    assert any(c["value"] == "San Francisco" for c in conditions)


def test_transition_evaluation_verified():
    current_jobs = [
        CareerPosition(
            company="Nexis AI",
            title="Founder & CEO",
            start_date="2023-01-01T00:00:00",
            is_current=True,
        )
    ]
    past_jobs = [
        CareerPosition(
            company="Stripe",
            title="Senior Engineering Lead",
            start_date="2018-05-01T00:00:00",
            end_date="2022-12-01T00:00:00",
            is_current=False,
        )
    ]

    status, summary, reasons, matched = CrustdataService._evaluate_transition(
        current_jobs=current_jobs,
        past_jobs=past_jobs,
        target_employer="Stripe",
        is_founder=True,
        current_title="Founder & CEO",
    )

    assert status == "verified"
    assert matched == "Stripe"
    assert "Verified career transition" in summary


def test_transition_evaluation_insufficient_evidence():
    current_jobs = []
    past_jobs = []

    status, summary, reasons, matched = CrustdataService._evaluate_transition(
        current_jobs=current_jobs,
        past_jobs=past_jobs,
        target_employer=None,
        is_founder=False,
        current_title="Unknown",
    )

    assert status == "insufficient_evidence"
