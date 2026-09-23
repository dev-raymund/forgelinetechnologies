-- Phase 1 of the prospecting simplification: the simplified prospect model.
--
-- NOT YET APPLIED. See docs/prospecting-simplification-audit.md.
--
-- Additive and idempotent. It adds six columns, widens one, and backfills two
-- from values already in the table. It alters no column type destructively,
-- drops nothing, and leaves every existing row valid. The seven Phase 3
-- qualification columns are deliberately left in place: score.ts, qualify.ts,
-- qualification.ts, qualification-actions.ts, queue.ts, prospects.ts and the
-- reviewer UI still read them, and Phase 1 deletes nothing. Phase 7 drops them
-- in a separate migration, after a backup.
--
-- WHEN TO APPLY
-- The DDL in section 1 is safe at any time — every added column has a default
-- and today's code never names them, and widening varchar(16) to varchar(24)
-- cannot lose data.
--
-- The backfills in section 2 are safe to run at any time and safe to re-run,
-- but they are only USEFUL from Phase 6, when the status controls land and the
-- Phase 2 pipeline stops writing 'new' / 'queued' / 'audited'. Applied before
-- then, a later "Queue all new" will simply write the old vocabulary back into
-- some rows, and the backfill can be re-run.
--
-- There is no down-migration. Reversing section 1 means dropping four columns,
-- which loses any opportunity, service and reason recorded since.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. The simplified model
-- ---------------------------------------------------------------------------

-- The one opportunity a prospect is carried forward on. Longest value is
-- 'No Clear Opportunity' (20).
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "opportunity" varchar(32) DEFAULT '' NOT NULL;

-- The single ForgeLine service that follows from the opportunity. Longest
-- value is 'Custom web applications' (23).
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "service" varchar(40) DEFAULT '' NOT NULL;

-- The evidence-based sentence shown to a human and quoted by the outreach
-- email. Never a claim the scan did not support.
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "opportunity_reason" text DEFAULT '' NOT NULL;

-- The contact details the Phase 1 decision kept: a role or company address and
-- a business phone number. Deliberately no "contact_name" — a named
-- individual's details are personal data under UK GDPR and the Australian
-- Privacy Act, and both are target markets, so the system does not store one.
-- "contact_channel" and "contact_provenance" stay untouched beside these as
-- Phase 2 history.
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "contact_email" varchar(255) DEFAULT '' NOT NULL;
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "contact_phone" varchar(40) DEFAULT '' NOT NULL;

-- Set when a person chose the opportunity instead of the deterministic rules.
-- Replaces the reviewer identity previously carried inside the
-- "opportunity_override" jsonb.
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "opportunity_set_by" integer;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prospects_opportunity_set_by_fk') THEN
    ALTER TABLE "prospects" ADD CONSTRAINT "prospects_opportunity_set_by_fk"
      FOREIGN KEY ("opportunity_set_by") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- The outreach lifecycle needs room for 'Audit Requested' (15). varchar(16)
-- would fit it with one character to spare, which is not headroom.
ALTER TABLE "prospects" ALTER COLUMN "status" TYPE varchar(24);

-- ---------------------------------------------------------------------------
-- 2. Backfills
--
-- Both are guarded so that re-running this migration changes nothing, and so
-- that a row already carrying a new-vocabulary value is never overwritten.
-- ---------------------------------------------------------------------------

-- The Phase 2 pipeline statuses all mean the same thing in the simplified
-- model: nobody has contacted this business yet.
--
-- 'suppressed' maps to 'To Contact' as well, deliberately. Suppression is
-- carried by "suppressed_at", not by "status" — that is already how the
-- application reads it (see the prospect detail page, which treats
-- "suppressed_at" as the opt-out and "status" as a workflow label only).
-- Folding the opt-out into a status would make it one careless write away
-- from being lost.
UPDATE "prospects"
   SET "status" = 'To Contact'
 WHERE "status" IN ('new', 'queued', 'audited', 'suppressed');

-- "opportunity" is DELIBERATELY NOT backfilled from "primary_opportunity".
--
-- An earlier draft of this migration translated the old classifications across
-- ('Website Improvement' became 'Website Development', and so on). That is
-- exactly the reinterpretation the simplification set out to avoid: those
-- values were produced by the retired 100-point model, scored from audits run
-- by the full audit engine, and carrying them over would present a retired
-- score as a current conclusion.
--
-- So every existing row keeps the column default, ''. Empty means "not yet
-- analysed under the simplified model", which is the truth about these rows,
-- and the list says so in those words. A quick scan fills it with something
-- real. "service" is left empty for the same reason: no service should be
-- recommended on the strength of a rule that no longer exists.

-- A role address already recorded as a contact channel is an email, so it
-- moves across.
-- A contact page URL and anything else stay where they are.
UPDATE "prospects"
   SET "contact_email" = "contact_channel"
 WHERE "contact_email" = ''
   AND "contact_channel" LIKE '%@%'
   AND "contact_channel" NOT LIKE 'http%';

COMMIT;
