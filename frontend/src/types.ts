/**
 * ============================================================================
 * FOUNDER RADAR — DISCOVERY & CANDIDATE SCHEMA CONTRACTS
 * ============================================================================
 *
 * @fileoverview Core data contracts for founder discovery and intelligence.
 *
 * ### SearchRequest Schema
 * Represents structured query parameters sent to `/api/search` to discover
 * prospective founders across global ecosystems via Crustdata People Search:
 * - `query` (optional string): Freeform natural language query (e.g. "ex-Stripe founders in SF").
 * - `employer` (optional string): Target prior or current company (e.g. "Stripe", "Google", "Meta").
 * - `role` (optional string): Target executive/founder role (defaults to "Founder").
 * - `location` (optional string): Target geographic city or region (e.g. "San Francisco", "London").
 * - `country` (optional string): Target ISO or country string (e.g. "United States", "United Kingdom").
 * - `limit` (number): Number of candidate profiles per page (1 to 50, default 10).
 * - `cursor` (optional string): Upstream pagination cursor for deterministic result streaming.
 *
 * ### CandidateResult Schema (FounderProfile)
 * Represents a normalized, evidence-grounded candidate profile returned from
 * the search engine and enriched by the deterministic transition evaluator:
 * - `id` (string): Unique identifier for candidate (matches Crustdata person id).
 * - `name` (string): Full name of the professional.
 * - `headline` (optional string): Professional headline or LinkedIn summary.
 * - `current_title` (optional string): Active leadership or founder title.
 * - `current_company` (optional string): Name of active startup venture or organization.
 * - `location` (optional string): Documented geographic location.
 * - `country` (optional string): Primary country of residence/operation.
 * - `avatar_url` (optional string): Public profile photo URI where available.
 * - `current_jobs` (CareerPosition[]): Array of active positions with verifiable start dates.
 * - `past_jobs` (CareerPosition[]): Array of past employment history with start/end dates.
 * - `founder_status` (boolean): Flag indicating detected founder / co-founder status.
 * - `transition_status` ('verified' | 'unverified' | 'insufficient_evidence'):
 *     Deterministic 3-tier factual verification based on verifiable employment dates.
 * - `transition_summary` (string): Fact-grounded narrative summarizing career chronology.
 * - `target_company_match` (optional string): Matched former employer (e.g., "Stripe").
 * - `match_reasons` (string[]): Concrete evidentiary citations linking profile to query.
 * - `tags` (string[]): Domain and category tags (e.g. "Founder", "Ex-Stripe", "Verified Transition").
 * - `data_completeness` (number): Metric score (0.0 to 1.0) of profile field richness.
 * ============================================================================
 */

import { FounderProfile, CareerPosition, TransitionStatus } from './types/index';

/**
 * Request payload for founder discovery queries.
 */
export interface SearchRequest {
  query?: string;
  employer?: string;
  role?: string;
  location?: string;
  country?: string;
  limit?: number;
  cursor?: string;
}

/**
 * Normalized candidate result profile returned by discovery and search operations.
 * Alias for the core FounderProfile schema contract.
 */
export type CandidateResult = FounderProfile;

export * from './types/index';
