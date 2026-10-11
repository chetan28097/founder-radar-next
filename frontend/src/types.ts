/**
 * ============================================================================
 * FOUNDER RADAR — CRUSTDATA CANDIDATE & INTELLIGENCE SCHEMA
 * ============================================================================
 *
 * This module exports the core data contracts for candidate discovery, career
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

export * from './types/index';
