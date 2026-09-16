-- Phase 1 website audit storage.
-- Additive and idempotent: this migration does not alter existing production
-- tables or rows.

BEGIN;

CREATE TABLE IF NOT EXISTS "prospect_audits" (
  "id" serial PRIMARY KEY NOT NULL,
  "requested_url" text NOT NULL,
  "final_url" text DEFAULT '' NOT NULL,
  "status" varchar(16) DEFAULT 'queued' NOT NULL,
  "audit_version" varchar(32) DEFAULT 'phase1-v1' NOT NULL,
  "requested_by" integer,
  "requested_at" timestamp with time zone DEFAULT now() NOT NULL,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "http_status" integer,
  "https" boolean DEFAULT false NOT NULL,
  "redirect_chain" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "report" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "total_score" integer DEFAULT 0 NOT NULL,
  "error_detail" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_findings" (
  "id" serial PRIMARY KEY NOT NULL,
  "audit_id" integer NOT NULL,
  "category" varchar(32) NOT NULL,
  "rule" varchar(80) NOT NULL,
  "severity" varchar(16) NOT NULL,
  "page_url" text NOT NULL,
  "evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "recommendation" text NOT NULL,
  "confidence" varchar(16) NOT NULL,
  "observed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prospect_audits_requested_by_users_id_fk') THEN
    ALTER TABLE "prospect_audits" ADD CONSTRAINT "prospect_audits_requested_by_users_id_fk"
      FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_findings_audit_id_prospect_audits_id_fk') THEN
    ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_audit_id_prospect_audits_id_fk"
      FOREIGN KEY ("audit_id") REFERENCES "public"."prospect_audits"("id") ON DELETE cascade;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "prospect_audits_status_idx" ON "prospect_audits" ("status");
CREATE INDEX IF NOT EXISTS "prospect_audits_requested_at_idx" ON "prospect_audits" ("requested_at");
CREATE INDEX IF NOT EXISTS "prospect_audits_requested_by_idx" ON "prospect_audits" ("requested_by");
CREATE INDEX IF NOT EXISTS "audit_findings_audit_idx" ON "audit_findings" ("audit_id");
CREATE INDEX IF NOT EXISTS "audit_findings_category_idx" ON "audit_findings" ("category");
CREATE INDEX IF NOT EXISTS "audit_findings_severity_idx" ON "audit_findings" ("severity");

COMMIT;
