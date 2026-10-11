from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    ResearchRequest, ResearchResponse,
    OutreachDraftRequest, OutreachDraftResponse
)
from app.services.crustdata_service import CrustdataService
from app.services.ai_service import AIService
from app.repositories.saved_repository import SavedRepository
from app.observability.tracer import trace_span

router = APIRouter(prefix="/api/research", tags=["AI Research & Outreach"])


@router.post("", response_model=ResearchResponse)
def analyze_founder_research(request: ResearchRequest):
    """
    Generate grounded AI research synthesis, uncertainty/gap analysis,
    and recommended diligence questions for a candidate.
    """
    with trace_span("founder_research_analysis", profile_id=request.profile_id):
        profile = CrustdataService.get_cached_profile(request.profile_id)
        if not profile:
            saved = SavedRepository.get_saved_founder(request.profile_id)
            if saved and saved.raw_profile:
                profile = CrustdataService.normalize_profile(saved.raw_profile)
            else:
                raise HTTPException(
                    status_code=404,
                    detail=f"Candidate profile '{request.profile_id}' not found."
                )

        try:
            return AIService.generate_dossier_research(
                profile=profile,
                custom_question=request.custom_question,
                tone=request.tone,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"AI research synthesis failed: {str(exc)}"
            )


@router.post("/outreach", response_model=OutreachDraftResponse)
def draft_personalized_outreach(request: OutreachDraftRequest):
    """
    Draft an editable, grounded outreach email referencing verified facts
    from the candidate's career progression.
    """
    with trace_span("generate_outreach_draft", profile_id=request.profile_id, tone=request.tone):
        profile = CrustdataService.get_cached_profile(request.profile_id)
        if not profile:
            saved = SavedRepository.get_saved_founder(request.profile_id)
            if saved and saved.raw_profile:
                profile = CrustdataService.normalize_profile(saved.raw_profile)
            else:
                raise HTTPException(
                    status_code=404,
                    detail=f"Candidate profile '{request.profile_id}' not found."
                )

        try:
            return AIService.generate_outreach_draft(
                profile=profile,
                tone=request.tone,
                sender_context=request.sender_context,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Outreach generation failed: {str(exc)}"
            )
