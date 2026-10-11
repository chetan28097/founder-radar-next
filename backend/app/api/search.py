from fastapi import APIRouter, HTTPException
from app.models.schemas import SearchRequest, SearchResponse
from app.services.crustdata_service import CrustdataService
from app.repositories.saved_repository import SavedRepository
from app.observability.tracer import trace_span

router = APIRouter(prefix="/api", tags=["Founder Discovery"])


@router.post("/search", response_model=SearchResponse)
def search_founders(request: SearchRequest):
    """
    Search professional profiles via Crustdata People Search API,
    supporting natural-language and explicit filters (employer, role, location, country, pagination).
    """
    with trace_span("incoming_search_request", query=request.query, limit=request.limit):
        try:
            response = CrustdataService.search_founders(
                query=request.query,
                employer=request.employer,
                role=request.role,
                location=request.location,
                country=request.country,
                limit=request.limit,
                cursor=request.cursor,
            )

            # Record in recent searches for dashboard overview
            effective_query = request.query or request.employer or request.role or "Founders"
            SavedRepository.record_search(
                query=effective_query,
                filters=response.applied_filters,
                count=response.count,
            )

            return response

        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Founder search failed: {str(exc)}"
            )
