from fastapi import APIRouter, HTTPException
from app.models.schemas import ProfileDossier, FounderProfile
from app.services.crustdata_service import CrustdataService
from app.repositories.saved_repository import SavedRepository
from app.repositories.profile_repository import ResearchRepository
from app.observability.tracer import trace_span

router = APIRouter(prefix="/api/profiles", tags=["Founder Intelligence Dossiers"])


@router.get("/{profile_id}", response_model=ProfileDossier)
def get_profile_dossier(profile_id: str):
    """
    Retrieve the sourced dossier for a founder: career timeline, current company,
    transition evidence, deterministic data gaps, notes and the latest saved research.
    No model call is made here; AI research runs only on explicit request.
    """
    with trace_span("profile_dossier_retrieval", profile_id=profile_id):
        profile = CrustdataService.get_cached_profile(profile_id)
        saved = SavedRepository.get_saved_founder(profile_id)

        if not profile:
            if saved and saved.raw_profile:
                profile = CrustdataService.normalize_profile(saved.raw_profile)
            elif saved:
                # Saved without a raw record: show only what was stored, claim nothing else
                profile = FounderProfile(
                    id=saved.profile_id,
                    name=saved.name,
                    headline=saved.headline,
                    current_title=saved.current_title,
                    current_company=saved.current_company,
                    location=saved.location,
                    transition_status="insufficient_evidence",
                    transition_summary="Only the saved summary is available; the full Crustdata record was not stored.",
                )
            else:
                raise HTTPException(
                    status_code=404,
                    detail=f"Profile '{profile_id}' is not in the local cache or your watchlists. Run a search to load it.",
                )

        return ProfileDossier(
            profile=profile,
            career_timeline=profile.current_jobs + profile.past_jobs,
            transition_status=profile.transition_status,
            transition_evidence=profile.match_reasons,
            data_gaps=CrustdataService.compute_data_gaps(profile),
            latest_research=ResearchRepository.get_latest(profile_id),
            notes=saved.notes if saved else None,
            watchlists=saved.watchlist_ids if saved else [],
            is_saved=bool(saved),
        )
