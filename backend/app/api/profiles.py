from fastapi import APIRouter, HTTPException
from app.models.schemas import ProfileDossier, FounderProfile
from app.services.crustdata_service import CrustdataService
from app.services.ai_service import AIService
from app.repositories.saved_repository import SavedRepository
from app.observability.tracer import trace_span

router = APIRouter(prefix="/api/profiles", tags=["Founder Intelligence Dossiers"])


@router.get("/{profile_id}", response_model=ProfileDossier)
def get_profile_dossier(profile_id: str):
    """
    Retrieve full intelligence dossier for a founder, including
    career timeline, verified transition evidence, AI research summary,
    relevance explanation, and personal research notes.
    """
    with trace_span("profile_dossier_retrieval", profile_id=profile_id):
        # Check cache or saved database
        profile = CrustdataService.get_cached_profile(profile_id)

        if not profile:
            # Check local saved database
            saved = SavedRepository.get_saved_founder(profile_id)
            if saved and saved.raw_profile:
                profile = CrustdataService.normalize_profile(saved.raw_profile)
            elif saved:
                profile = FounderProfile(
                    id=saved.profile_id,
                    name=saved.name,
                    headline=saved.headline,
                    current_title=saved.current_title,
                    current_company=saved.current_company,
                    location=saved.location,
                    founder_status=True,
                    transition_status="unverified",
                    transition_summary=f"Saved profile for {saved.name}",
                )
            else:
                raise HTTPException(
                    status_code=404,
                    detail=f"Profile with ID '{profile_id}' not found in active cache or watchlist."
                )

        # Retrieve saved notes & watchlists if exists
        saved_entry = SavedRepository.get_saved_founder(profile_id)
        notes = saved_entry.notes if saved_entry else None
        watchlists = saved_entry.watchlist_ids if saved_entry else []

        # Generate grounded AI research summary
        try:
            research = AIService.generate_dossier_research(profile)
        except Exception:
            research = None

        # Build career timeline combining current and past
        career_timeline = profile.current_jobs + profile.past_jobs

        return ProfileDossier(
            profile=profile,
            career_timeline=career_timeline,
            transition_status=profile.transition_status,
            transition_evidence=profile.match_reasons,
            ai_research_summary=research.research_summary if research else profile.transition_summary,
            relevance_explanation=(
                f"{profile.name} was identified with founder title '{profile.current_title}' "
                f"at {profile.current_company or 'venture'}. Match reasons: {', '.join(profile.match_reasons)}."
            ),
            information_gaps=research.uncertainties if research else [
                "Detailed startup metrics and funding status require verification.",
                "Primary domain/website not verified in public profile."
            ],
            recommended_verification=[
                "Confirm recent corporate filings and entity registration.",
                "Review GitHub, patent, or technical paper authorship.",
                "Cross-reference angel or pre-seed investor network."
            ],
            outreach_draft=research.outreach_draft if research else "",
            notes=notes,
            watchlists=watchlists,
        )
