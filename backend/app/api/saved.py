from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    SavedFounder, SavedFounderCreate, Watchlist, WatchlistCreate, NoteUpdateRequest
)
from app.repositories.saved_repository import SavedRepository
from app.repositories.profile_repository import ResearchRepository
from app.services.crustdata_service import CrustdataService

router = APIRouter(prefix="/api", tags=["Watchlists & Saved Founders"])


@router.get("/saved", response_model=List[SavedFounder])
def list_saved_founders():
    """List all saved founders stored in the local database, with research status."""
    founders = SavedRepository.get_saved_founders()
    researched = ResearchRepository.researched_at_map([f.profile_id for f in founders])
    for f in founders:
        f.researched_at = researched.get(f.profile_id)
    return founders


@router.post("/saved", response_model=SavedFounder)
def save_founder(data: SavedFounderCreate):
    """Save a founder to the local watchlist storage."""
    # If raw profile wasn't provided, try to obtain from cache
    if not data.raw_profile:
        raw = CrustdataService.get_raw_profile(data.profile_id)
        if raw:
            data.raw_profile = raw

    return SavedRepository.save_founder(data)


@router.delete("/saved/{profile_id}")
def remove_saved_founder(profile_id: str):
    """Remove a founder from the saved watchlist."""
    success = SavedRepository.remove_saved_founder(profile_id)
    return {"success": success, "profile_id": profile_id}


@router.put("/saved/{profile_id}/notes")
def update_founder_notes(profile_id: str, request: NoteUpdateRequest):
    """Update editable research notes for a saved founder."""
    success = SavedRepository.update_notes(profile_id, request.notes)
    return {"success": success, "profile_id": profile_id, "notes": request.notes}


@router.get("/watchlists", response_model=List[Watchlist])
def list_watchlists():
    """List user-created watchlists."""
    return SavedRepository.get_watchlists()


@router.post("/watchlists", response_model=Watchlist)
def create_watchlist(data: WatchlistCreate):
    """Create a new custom founder watchlist."""
    return SavedRepository.create_watchlist(data)


@router.post("/watchlists/{watchlist_id}/members/{profile_id}")
def add_to_watchlist(watchlist_id: str, profile_id: str):
    """Add a saved founder to a specific watchlist."""
    success = SavedRepository.add_to_watchlist(watchlist_id, profile_id)
    return {"success": success, "watchlist_id": watchlist_id, "profile_id": profile_id}


@router.delete("/watchlists/{watchlist_id}/members/{profile_id}")
def remove_from_watchlist(watchlist_id: str, profile_id: str):
    """Remove a founder from a specific watchlist."""
    success = SavedRepository.remove_from_watchlist(watchlist_id, profile_id)
    return {"success": success, "watchlist_id": watchlist_id, "profile_id": profile_id}


@router.get("/recent-searches", response_model=List[Dict[str, Any]])
def get_recent_searches():
    """Retrieve search history for the dashboard overview."""
    return SavedRepository.get_recent_searches(limit=8)
