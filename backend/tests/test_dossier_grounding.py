from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.services import crustdata_service
from app.services.crustdata_service import CrustdataService

client = TestClient(app)


def _raw(person_id=4242, title="Co-Founder", current_start="2024-02-01", past_end="2024-01-01", website="halden.io"):
    return {
        "crustdata_person_id": person_id,
        "basic_profile": {
            "name": "Ines Okafor",
            "current_title": title,
            "headline": "Building payments tooling",
            "location": {"full_location": "Lagos, Nigeria", "country": "Nigeria"},
            "profile_picture_permalink": "https://media.example.com/p/4242.jpg",
        },
        "social_handles": {
            "professional_network_identifier": {"profile_url": "https://www.linkedin.com/in/ines-okafor-test"},
        },
        "education": {"schools": [{"school": "University of Lagos", "degree": "BSc", "start_year": 2010, "end_year": 2014}]},
        "experience": {
            "employment_details": {
                "current": [{
                    "name": "Halden",
                    "title": title,
                    "start_date": current_start,
                    "company_website": website,
                    "company_professional_network_profile_url": "https://www.linkedin.com/company/halden-test",
                    "company_headcount_latest": 14,
                    "company_industries": ["Financial Services"],
                    "company_hq_location": "Lagos, Nigeria",
                }],
                "past": [{"name": "Paystack", "title": "Product Lead", "start_date": "2019-03-01", "end_date": past_end}],
            }
        },
    }


def test_normalize_keeps_sourced_links_and_company_facts():
    profile = CrustdataService.normalize_profile(_raw())
    assert profile.linkedin_url == "https://www.linkedin.com/in/ines-okafor-test"
    assert profile.avatar_url == "https://media.example.com/p/4242.jpg"
    assert profile.company.name == "Halden"
    assert profile.company.website == "https://halden.io"
    assert profile.company.headcount == 14
    assert profile.company.industries == ["Financial Services"]
    assert profile.education[0].school == "University of Lagos"
    assert profile.founder_status is True
    assert profile.transition_status == "verified"


def test_ceo_title_alone_is_not_founder_evidence():
    profile = CrustdataService.normalize_profile(_raw(title="Chief Executive Officer"))
    assert profile.founder_status is False
    assert "Founder" not in profile.tags
    assert any("founding is not established" in g for g in CrustdataService.compute_data_gaps(profile))


def test_rejects_non_linkedin_profile_urls():
    raw = _raw()
    raw["social_handles"]["professional_network_identifier"]["profile_url"] = "https://evil.example.com/in/x"
    assert CrustdataService.normalize_profile(raw).linkedin_url is None


def test_employer_match_ignores_parenthetical_mentions():
    raw = _raw()
    raw["experience"]["employment_details"]["past"] = [
        {"name": "Orum.io (We've joined Stripe)", "title": "Advisor", "start_date": "2022-01-01", "end_date": "2024-06-01"}
    ]
    profile = CrustdataService.normalize_profile(raw, target_employer="Stripe")
    assert profile.target_company_match is None
    assert "Ex-Stripe" not in profile.tags

    raw["experience"]["employment_details"]["past"][0]["name"] = "Stripe"
    assert CrustdataService.normalize_profile(raw, target_employer="Stripe").target_company_match == "Stripe"


def test_missing_company_website_is_reported_not_guessed():
    profile = CrustdataService.normalize_profile(_raw(website=None))
    assert profile.company.website is None
    assert "No website recorded for Halden." in CrustdataService.compute_data_gaps(profile)


@patch("app.services.crustdata_service.requests.post")
def test_search_dedupes_and_profile_survives_memory_reset(mock_post):
    mock_post.return_value.ok = True
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {"total_count": 2, "profiles": [_raw(), _raw()]}

    res = client.post("/api/search", json={"query": "founders in Lagos", "limit": 5})
    assert res.status_code == 200
    assert res.json()["count"] == 1

    # Simulate a backend restart: in-memory caches are empty, SQLite cache remains
    crustdata_service._profile_cache.clear()
    crustdata_service._raw_cache.clear()

    with patch("app.services.ai_service.completion") as mock_completion:
        dossier = client.get("/api/profiles/4242")
        mock_completion.assert_not_called()
    assert dossier.status_code == 200
    body = dossier.json()
    assert body["profile"]["linkedin_url"].startswith("https://www.linkedin.com/")
    assert body["latest_research"] is None


@patch("app.services.ai_service.completion", side_effect=TimeoutError("gateway timeout"))
def test_research_failure_returns_error_instead_of_generic_text(_mock):
    crustdata_service._profile_cache["5151"] = CrustdataService.normalize_profile(_raw(person_id=5151))
    res = client.post("/api/research", json={"profile_id": "5151"})
    assert res.status_code == 502
    assert "could not be generated" in res.json()["detail"]
    assert client.get("/api/research/5151").status_code == 404
