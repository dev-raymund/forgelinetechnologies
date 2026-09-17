-- Phase 3 prospect qualification.
-- Additive and idempotent: adds six columns and one index to "prospects",
-- alters no existing column, and leaves every existing row valid.

BEGIN;

ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "score_adjustments" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "opportunity_override" jsonb;
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "decision" varchar(16) DEFAULT '' NOT NULL;
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "decision_reason" text DEFAULT '' NOT NULL;
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "decided_by" integer;
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "decided_at" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "prospects_decision_idx" ON "prospects" ("decision");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prospects_decided_by_fk') THEN
    ALTER TABLE "prospects" ADD CONSTRAINT "prospects_decided_by_fk"
      FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
