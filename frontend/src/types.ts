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

export * from './types/index';
