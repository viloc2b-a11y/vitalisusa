-- VITALIS — Matching Engine v1 — Referrals Patch
-- Adds engine output columns to the existing referrals table.
-- Safe to run multiple times (ADD COLUMN IF NOT EXISTS).
--
-- Run in: Supabase SQL Editor
-- Date:   2026-03-30

-- Engine matching result
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS matched_study_id text;
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS match_found boolean DEFAULT false;

-- Engine routing output
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS engine_action text;
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS engine_reason text;
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS engine_message text;

-- Engine metadata
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS engine_version text DEFAULT 'v1';
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS engine_output jsonb DEFAULT '{}'::jsonb;

-- Indexes for coordinator queue queries and lookups
CREATE INDEX IF NOT EXISTS idx_referrals_matched_study_id ON referrals(matched_study_id);
CREATE INDEX IF NOT EXISTS idx_referrals_match_found ON referrals(match_found);
CREATE INDEX IF NOT EXISTS idx_referrals_engine_version ON referrals(engine_version);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
