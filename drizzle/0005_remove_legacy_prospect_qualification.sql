-- Phase 7: remove the retired qualification model from "prospects".
--
-- Destructive. It drops eight columns. Read the verification below before
-- applying, and take a backup first -- there is no down-migration, and the
-- dropped values cannot be recovered from the schema afterwards.
--
-- VERIFICATION, run read-only against the live database immediately before
-- this migration was written:
--
--   score_adjustments     0 of 2 rows non-empty
--   opportunity_override  0 of 2 rows non-null
--   decision              0 of 2 rows non-empty
--   decision_reason       0 of 2 rows non-empty
--   decided_by            0 of 2 rows non-null
--   decided_at            0 of 2 rows non-null
--   total_score           2 of 2 rows non-zero   -- retired model output
--   primary_opportunity   2 of 2 rows non-empty  -- retired model output
--
-- Six hold nothing. The two that do hold values are the outputs of the
-- 100-point model this work replaced: a denormalized score and its
-- classification. They are not carried forward by design -- migration 0004
-- deliberately did not translate them, because presenting a retired score as a
-- current conclusion is the thing the simplification set out to stop. The
-- underlying evidence is not lost: it stays in "prospect_audits" and
-- "audit_findings", which this migration does not touch.
--
-- DELIBERATELY NOT DROPPED: "contact_channel" and "contact_provenance". They
-- are superseded by "contact_email" and "contact_phone", but one row still
-- holds a real contact-page URL and the active model has no field for a URL.
-- Dropping them would lose a working contact for a live prospect, so they stay
-- until there is somewhere for that value to go. They are no longer part of
-- the application model.
--
-- ROLLBACK: restore from a backup taken before this runs. Re-adding the
-- columns would give every row a default and restore no data.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. The status default
--
-- Still 'new', a value from the retired pipeline vocabulary. Every insert that
-- does not name a status would land there. The application always names one,
-- but a default that cannot be valid is a trap for the next person.
-- ---------------------------------------------------------------------------

ALTER TABLE "prospects" ALTER COLUMN "status" SET DEFAULT 'To Contact';

-- ---------------------------------------------------------------------------
-- 2. Drop the retired qualification columns
--
-- Their indexes go with them: Postgres drops an index when its column is
-- dropped, so "prospects_score_idx" and "prospects_decision_idx" need no
-- separate statement.
-- ---------------------------------------------------------------------------

ALTER TABLE "prospects" DROP COLUMN IF EXISTS "score_adjustments";
ALTER TABLE "prospects" DROP COLUMN IF EXISTS "opportunity_override";
ALTER TABLE "prospects" DROP COLUMN IF EXISTS "decision_reason";
ALTER TABLE "prospects" DROP COLUMN IF EXISTS "decided_at";
ALTER TABLE "prospects" DROP COLUMN IF EXISTS "decided_by";
ALTER TABLE "prospects" DROP COLUMN IF EXISTS "decision";
ALTER TABLE "prospects" DROP COLUMN IF EXISTS "total_score";
ALTER TABLE "prospects" DROP COLUMN IF EXISTS "primary_opportunity";

-- ---------------------------------------------------------------------------
-- 3. The list's index
--
-- The list filters by opportunity now, where it used to sort by score.
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "prospects_opportunity_idx" ON "prospects" ("opportunity");

COMMIT;
