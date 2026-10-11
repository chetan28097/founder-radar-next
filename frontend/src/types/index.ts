/**
 * ============================================================================
 * FOUNDER RADAR — CRUSTDATA CANDIDATE & INTELLIGENCE SCHEMA
 * ============================================================================
 *
 * This module defines the core data contracts for candidate discovery, career
 * timeline reconstruction, and AI research dossiers in Founder Radar.
 *
 * UPSTREAM CRUSTDATA PEOPLE SEARCH API (v2025-11-01):
 * - Basic Profile: Full name, professional headline, current title, avatar, and
 *   structured geographic location (city, state, country).
 * - Employment History: Granular employment records partitioned into:
 *     * Current roles: Active venture/company, title, start dates.
 *     * Past roles: Previous employers (e.g. Stripe, Google), titles, start/end dates.
 * - Identity: Stable integer/string person identifiers (crustdata_person_id).
 *
 * NORMALIZED FOUNDER RADAR CANDIDATE SCHEMA:
 * - Deterministic Transition Engine: Enforces 3-tier factual verification:
 *     * 'verified': Confirmed tenure at previous employer with documented dates,
 *       followed sequentially by an active founder role with start date.
 *     * 'unverified': Plausible founder trajectory with partial/unverified timestamps.
 *     * 'insufficient_evidence': Missing chronology or insufficient evidence.
 * - Grounded Matching: Tracks target company affiliations, specific match reasons,
 *   profile tags, and a data completeness score (0.0 – 1.0).
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
  current_jobs: CareerPosition[];
  past_jobs: CareerPosition[];
  founder_status: boolean;
  transition_status: TransitionStatus;
  transition_summary: string;
  target_company_match?: string;
  match_reasons: string[];
  tags: string[];
  data_completeness: number;
}

export interface SearchResponse {
  count: number;
  total_count?: number;
  profiles: FounderProfile[];
  next_cursor?: string;
  applied_filters: Record<string, any>;
  query_interpretation?: string;
  remarks?: string;
}

export interface ProfileDossier {
  profile: FounderProfile;
  career_timeline: CareerPosition[];
  transition_status: TransitionStatus;
  transition_evidence: string[];
  ai_research_summary: string;
  relevance_explanation: string;
  information_gaps: string[];
  recommended_verification: string[];
  outreach_draft: string;
  notes?: string;
  watchlists: string[];
}

export interface ResearchResponse {
  profile_id: string;
  research_summary: string;
  transition_status: TransitionStatus;
  supporting_evidence: string[];
  uncertainties: string[];
  suggested_questions: string[];
  outreach_draft: string;
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
  raw_profile?: any;
  created_at: string;
  updated_at: string;
}

export interface HealthResponse {
  status: string;
  crustdata_connected: boolean;
  litellm_connected: boolean;
  neatlogs_connected: boolean;
  model_id: string;
  database_connected: boolean;
  timestamp: string;
}

export interface RecentSearch {
  id: string;
  query: string;
  filters: Record<string, any>;
  result_count: number;
  created_at: string;
}

export type NavigationTab = 
  | 'landing'
  | 'overview'
  | 'discover'
  | 'profile'
  | 'watchlists'
  | 'research'
  | 'settings';
