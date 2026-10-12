/**
 * ============================================================================
 * FOUNDER RADAR — CORE DATA SCHEMA CONTRACTS
 * ============================================================================
 *
 * This module defines and exports the core TypeScript type contracts for the
 * Founder Radar intelligence platform, spanning:
 *
 * 1. UPSTREAM INGESTION (Crustdata People Search API v2025-11-01):
 *    - Basic Profile (identity, titles, locations, photos)
 *    - Employment Details (partitioned current and past employment chronologies)
 *
 * 2. DETERMINISTIC TRANSITION SIGNALS:
 *    - 3-Tier Transition Status:
 *        * 'verified': Documented departure date from prior target employer +
 *          documented start date at new venture.
 *        * 'unverified': Plausible founder progression with partial/missing timestamps.
 *        * 'insufficient_evidence': Missing sequential evidence. Never infers startup
 *          creation solely from leaving an employer.
 *
 * 3. AI RESEARCH & INTELLIGENCE DOSSIER (Claude Sonnet 4.6 via LiteLLM):
 *    - Career Timeline Reconstruction
 *    - Fact-Grounded Synthesis vs. Uncertainties / Data Gaps separation
 *    - Recommended Diligence Questions
 *    - Human-in-the-Loop Editable Outreach Generation
 *
 * 4. PERSISTENCE & WORKSPACE (SQLite):
 *    - Saved Founders & Custom Watchlists
 *    - Editable Research Notes
 *    - Recent Discovery Queries & Search History
 *
 * 5. SYSTEM HEALTH & TELEMETRY:
 *    - Real-time diagnostics for Crustdata, LiteLLM, Neatlogs OTLP, Entire CLI, and SQLite
 * ============================================================================
 */

export interface CareerPosition {
  company: string;
  title: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  duration_months?: number;
  company_website?: string;
  company_linkedin_url?: string;
  company_logo_url?: string;
  company_industries: string[];
  company_headcount?: number;
  company_headcount_range?: string;
  company_hq?: string;
  company_type?: string;
  location?: string;
}

export interface EducationEntry {
  school: string;
  degree?: string;
  start_year?: number;
  end_year?: number;
}

export interface CompanyOverview {
  name: string;
  title?: string;
  start_date?: string;
  website?: string;
  linkedin_url?: string;
  logo_url?: string;
  industries: string[];
  headcount?: number;
  headcount_range?: string;
  hq?: string;
  company_type?: string;
}

export type TransitionStatus = 'verified' | 'unverified' | 'insufficient_evidence';

export interface FounderProfile {
  id: string;
  crustdata_id?: string;
  name: string;
  headline?: string;
  current_title?: string;
  current_company?: string;
  location?: string;
  country?: string;
  avatar_url?: string;
  linkedin_url?: string;
  company?: CompanyOverview;
  education: EducationEntry[];
  current_jobs: CareerPosition[];
  past_jobs: CareerPosition[];
  founder_status: boolean;
  transition_status: TransitionStatus;
  transition_summary: string;
  target_company_match?: string;
  match_reasons: string[];
  tags: string[];
  data_completeness: number;
  data_updated_at?: string;
}

export type CandidateResult = FounderProfile;

export interface SearchRequest {
  query?: string;
  employer?: string;
  role?: string;
  location?: string;
  country?: string;
  limit?: number;
  cursor?: string;
}

export interface SearchResponse {
  count: number;
  total_count?: number;
  profiles: FounderProfile[];
  next_cursor?: string;
  applied_filters: Record<string, unknown>;
  query_interpretation?: string;
  remarks?: string;
}

export interface ResearchResponse {
  profile_id: string;
  research_summary: string;
  transition_status: TransitionStatus;
  supporting_evidence: string[];
  uncertainties: string[];
  suggested_questions: string[];
  outreach_draft: string;
  model?: string;
  custom_question?: string;
  generated_at?: string;
}

export interface ProfileDossier {
  profile: FounderProfile;
  career_timeline: CareerPosition[];
  transition_status: TransitionStatus;
  transition_evidence: string[];
  data_gaps: string[];
  latest_research?: ResearchResponse | null;
  notes?: string;
  watchlists: string[];
  is_saved: boolean;
}

export interface OutreachDraftResponse {
  profile_id: string;
  subject: string;
  body: string;
  tone: string;
  grounded_points: string[];
}

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  color: string;
  member_count: number;
  created_at: string;
}

export interface SavedFounder {
  id: string;
  profile_id: string;
  name: string;
  headline?: string;
  current_company?: string;
  current_title?: string;
  location?: string;
  watchlist_ids: string[];
  notes?: string;
  tags: string[];
  raw_profile?: unknown;
  researched_at?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthResponse {
  status: string;
  /** true when the API key is configured; no live provider call is made */
  crustdata_connected: boolean;
  litellm_connected: boolean;
  neatlogs_connected: boolean;
  neatlogs_tracer_active: boolean;
  model_id: string;
  database_connected: boolean;
  timestamp: string;
}

export interface RecentSearch {
  id: string;
  query: string;
  filters: Record<string, string | undefined>;
  result_count: number;
  created_at: string;
}
