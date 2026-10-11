from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CareerPosition(BaseModel):
    company: str = "Unknown"
    title: str = "Unknown"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    description: Optional[str] = None
    duration_months: Optional[int] = None


class FounderProfile(BaseModel):
    id: str
    crustdata_id: Optional[str] = None
    name: str
    headline: Optional[str] = None
    current_title: Optional[str] = None
    current_company: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    avatar_url: Optional[str] = None
    current_jobs: List[CareerPosition] = []
    past_jobs: List[CareerPosition] = []
    founder_status: bool = False
    transition_status: str = "insufficient_evidence"  # verified, unverified, insufficient_evidence
    transition_summary: str = ""
    target_company_match: Optional[str] = None
    match_reasons: List[str] = []
    tags: List[str] = []
    data_completeness: float = 0.5


class SearchRequest(BaseModel):
    query: Optional[str] = None
    employer: Optional[str] = None
    role: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    limit: int = Field(default=10, ge=1, le=50)
    cursor: Optional[str] = None


class SearchResponse(BaseModel):
    count: int
    total_count: Optional[int] = None
    profiles: List[FounderProfile] = []
    next_cursor: Optional[str] = None
    applied_filters: Dict[str, Any] = {}
    query_interpretation: Optional[str] = None
    remarks: Optional[Any] = None


class ProfileDossier(BaseModel):
    profile: FounderProfile
    career_timeline: List[CareerPosition]
    transition_status: str
    transition_evidence: List[str]
    ai_research_summary: str
    relevance_explanation: str
    information_gaps: List[str]
    recommended_verification: List[str]
    outreach_draft: str
    notes: Optional[str] = None
    watchlists: List[str] = []


class ResearchRequest(BaseModel):
    profile_id: str
    custom_question: Optional[str] = None
    tone: str = "professional"  # professional, casual, investor, warm


class ResearchResponse(BaseModel):
    profile_id: str
    research_summary: str
    transition_status: str
    supporting_evidence: List[str] = []
    uncertainties: List[str] = []
    suggested_questions: List[str] = []
    outreach_draft: str = ""


class OutreachDraftRequest(BaseModel):
    profile_id: str
    tone: str = "professional"  # professional, casual, investor, warm
    sender_context: Optional[str] = None


class OutreachDraftResponse(BaseModel):
    profile_id: str
    subject: str
    body: str
    tone: str
    grounded_points: List[str] = []


class WatchlistCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "blue"


class Watchlist(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    color: str = "blue"
    member_count: int = 0
    created_at: str


class SavedFounderCreate(BaseModel):
    profile_id: str
    name: str
    headline: Optional[str] = None
    current_company: Optional[str] = None
    current_title: Optional[str] = None
    location: Optional[str] = None
    watchlist_id: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    raw_profile: Optional[Dict[str, Any]] = None


class SavedFounder(BaseModel):
    id: str
    profile_id: str
    name: str
    headline: Optional[str] = None
    current_company: Optional[str] = None
    current_title: Optional[str] = None
    location: Optional[str] = None
    watchlist_ids: List[str] = []
    notes: Optional[str] = None
    tags: List[str] = []
    raw_profile: Optional[Dict[str, Any]] = None
    created_at: str
    updated_at: str


class NoteUpdateRequest(BaseModel):
    notes: str


class HealthResponse(BaseModel):
    status: str
    crustdata_connected: bool
    litellm_connected: bool
    neatlogs_connected: bool
    model_id: str
    database_connected: bool
    timestamp: str
