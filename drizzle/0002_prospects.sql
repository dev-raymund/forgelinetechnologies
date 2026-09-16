-- Phase 2 prospect discovery.
-- Additive and idempotent: creates one table, adds two nullable columns, and
-- alters no existing column.

BEGIN;

CREATE TABLE IF NOT EXISTS "prospects" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_name" text NOT NULL,
  "domain" varchar(253) NOT NULL,
  "website_url" text NOT NULL,
  "industry" varchar(80) DEFAULT '' NOT NULL,
  "country" varchar(2) DEFAULT '' NOT NULL,
  "location" text DEFAULT '' NOT NULL,
  "contact_channel" text DEFAULT '' NOT NULL,
  "contact_provenance" text DEFAULT '' NOT NULL,
  "sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" varchar(16) DEFAULT 'new' NOT NULL,
  "suppressed_at" timestamp with time zone,
  "suppression_reason" text DEFAULT '' NOT NULL,
  "last_audit_id" integer,
  "last_audited_at" timestamp with time zone,
  "total_score" integer DEFAULT 0 NOT NULL,
  "primary_opportunity" varchar(32) DEFAULT '' NOT NULL,
  "created_by" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "prospects_domain_key" ON "prospects" ("domain");
CREATE INDEX IF NOT EXISTS "prospects_status_idx" ON "prospects" ("status");
CREATE INDEX IF NOT EXISTS "prospects_score_idx" ON "prospects" ("total_score");
CREATE INDEX IF NOT EXISTS "prospects_country_idx" ON "prospects" ("country");
CREATE INDEX IF NOT EXISTS "prospects_industry_idx" ON "prospects" ("industry");

ALTER TABLE "prospect_audits" ADD COLUMN IF NOT EXISTS "prospect_id" integer;
CREATE INDEX IF NOT EXISTS "prospect_audits_prospect_idx" ON "prospect_audits" ("prospect_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prospects_created_by_fk') THEN
    ALTER TABLE "prospects" ADD CONSTRAINT "prospects_created_by_fk"
      FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prospect_audits_prospect_fk') THEN
    ALTER TABLE "prospect_audits" ADD CONSTRAINT "prospect_audits_prospect_fk"
      FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prospects_last_audit_fk') THEN
    ALTER TABLE "prospects" ADD CONSTRAINT "prospects_last_audit_fk"
      FOREIGN KEY ("last_audit_id") REFERENCES "prospect_audits"("id") ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
