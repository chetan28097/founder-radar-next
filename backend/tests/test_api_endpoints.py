from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@patch("app.services.crustdata_service.requests.post")
def test_search_endpoint_mocked(mock_post):
    mock_post.return_value.ok = True
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {
        "total_count": 1,
        "profiles": [
            {
                "crustdata_person_id": 999,
                "basic_profile": {
                    "name": "Jane Doe",
                    "current_title": "Founder",
                    "headline": "Founder & CEO, Quantum",
                    "location": {"full_location": "San Francisco, CA"},
                },
                "experience": {
                    "employment_details": {
                        "current": [{"name": "Quantum", "title": "Founder"}],
                        "past": [{"name": "Stripe", "title": "Staff Engineer"}],
                    }
                },
            }
        ],
    }

    res = client.post("/api/search", json={"employer": "Stripe", "limit": 5})
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 1
    assert data["profiles"][0]["name"] == "Jane Doe"


def test_saved_founders_lifecycle():
    # 1. Save founder
    save_payload = {
        "profile_id": "test_prof_101",
        "name": "Samuel Reed",
        "headline": "Building next-gen storage",
        "current_company": "DiskFlow",
        "current_title": "Founder",
        "location": "Austin, TX",
        "notes": "Initial diligence look looks promising.",
        "tags": ["Infrastructure", "Seed"],
    }
    res = client.post("/api/saved", json=save_payload)
    assert res.status_code == 200
    assert res.json()["profile_id"] == "test_prof_101"

    # 2. List saved
    list_res = client.get("/api/saved")
    assert list_res.status_code == 200
    saved_ids = [item["profile_id"] for item in list_res.json()]
    assert "test_prof_101" in saved_ids

    # 3. Update notes
    note_res = client.put("/api/saved/test_prof_101/notes", json={"notes": "Updated diligence note."})
    assert note_res.status_code == 200
    assert note_res.json()["notes"] == "Updated diligence note."

    # 4. Remove founder
    del_res = client.delete("/api/saved/test_prof_101")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True


def test_watchlists_lifecycle():
    # Create watchlist
    wl_payload = {
        "name": "Fintech Stealth 2026",
        "description": "Founders operating in stealth mode in fintech",
        "color": "emerald",
    }
    res = client.post("/api/watchlists", json=wl_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Fintech Stealth 2026"
    assert "id" in data

    # List watchlists
    list_res = client.get("/api/watchlists")
    assert list_res.status_code == 200
    names = [w["name"] for w in list_res.json()]
    assert "Fintech Stealth 2026" in names
