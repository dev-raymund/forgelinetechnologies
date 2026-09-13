-- Forgeline admin dashboard — schema for users, sessions, blog, reviews,
-- works and the audit log.
--
-- Written to be idempotent, because this database predates the migration
-- journal: `inquiries`, `users`, `posts` and `projects` were created with
-- `drizzle-kit push` and `inquiries` holds live production rows. A plain
-- generated baseline would try to CREATE them and fail. Every statement here
-- is guarded, so the file is correct both against this database and against an
-- empty one.
--
-- `posts` and `projects` are extended, not recreated. Both were empty at the
-- time of writing, which is the only reason dropping their `published` column
-- is safe; `inquiries` is not touched at all.

BEGIN;

-- ---------------------------------------------------------------- users
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" varchar(255) NOT NULL,
  "name" varchar(150) DEFAULT '' NOT NULL,
  "password_hash" text NOT NULL,
  "role" varchar(16) DEFAULT 'editor' NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- ---------------------------------------------------------------- inquiries
-- Pre-existing and carrying production data. Created here only so the file
-- also works against an empty database; never altered.
CREATE TABLE IF NOT EXISTS "inquiries" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(150) NOT NULL,
  "email" varchar(255) NOT NULL,
  "company" varchar(200) DEFAULT '' NOT NULL,
  "website" varchar(300) DEFAULT '' NOT NULL,
  "project_type" varchar(60) DEFAULT '' NOT NULL,
  "budget" varchar(60) DEFAULT '' NOT NULL,
  "timeline" varchar(60) DEFAULT '' NOT NULL,
  "message" text NOT NULL,
  "source" varchar(60) DEFAULT 'contact-form' NOT NULL,
  "source_ip" varchar(64) DEFAULT '' NOT NULL,
  "status" varchar(24) DEFAULT 'new' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------- sessions
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "user_agent" varchar(300) DEFAULT '' NOT NULL,
  "ip" varchar(64) DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------- projects
CREATE TABLE IF NOT EXISTS "projects" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar(200) NOT NULL,
  "slug" varchar(200) NOT NULL,
  "category" varchar(32) NOT NULL,
  "summary" varchar(300) DEFAULT '' NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "image_url" text DEFAULT '' NOT NULL,
  "image_alt" varchar(250) DEFAULT '' NOT NULL,
  "live_url" text DEFAULT '' NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "kind" varchar(32) DEFAULT 'Website' NOT NULL;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "sector" varchar(80) DEFAULT '' NOT NULL;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "stack" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "overview" text DEFAULT '' NOT NULL;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "challenge" text DEFAULT '' NOT NULL;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "approach" text DEFAULT '' NOT NULL;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "outcome" text DEFAULT '' NOT NULL;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "gallery" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "featured" boolean DEFAULT false NOT NULL;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "status" varchar(16) DEFAULT 'draft' NOT NULL;
-- Superseded by `status`. Safe: the table held no rows.
DROP INDEX IF EXISTS "projects_published_idx";
ALTER TABLE "projects" DROP COLUMN IF EXISTS "published";

-- ---------------------------------------------------------------- posts
CREATE TABLE IF NOT EXISTS "posts" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar(250) NOT NULL,
  "slug" varchar(250) NOT NULL,
  "excerpt" varchar(400) DEFAULT '' NOT NULL,
  "body" text DEFAULT '' NOT NULL,
  "cover_url" text DEFAULT '' NOT NULL,
  "published_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);

ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "seo_title" varchar(250) DEFAULT '' NOT NULL;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "seo_description" varchar(400) DEFAULT '' NOT NULL;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "og_image" text DEFAULT '' NOT NULL;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "status" varchar(16) DEFAULT 'draft' NOT NULL;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "author_id" integer;
DROP INDEX IF EXISTS "posts_published_idx";
ALTER TABLE "posts" DROP COLUMN IF EXISTS "published";

-- ---------------------------------------------------------------- reviews
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(150) NOT NULL,
  "company" varchar(200) DEFAULT '' NOT NULL,
  "email" varchar(255) NOT NULL,
  "rating" integer NOT NULL,
  "body" text NOT NULL,
  "project_id" integer,
  "photo_url" text DEFAULT '' NOT NULL,
  "permission_to_publish" boolean DEFAULT false NOT NULL,
  "status" varchar(16) DEFAULT 'pending' NOT NULL,
  "source_ip" varchar(64) DEFAULT '' NOT NULL,
  "published_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------- notes
CREATE TABLE IF NOT EXISTS "inquiry_notes" (
  "id" serial PRIMARY KEY NOT NULL,
  "inquiry_id" integer NOT NULL,
  "author_id" integer,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------- audit log
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer,
  "actor_email" varchar(255) DEFAULT '' NOT NULL,
  "action" varchar(60) NOT NULL,
  "entity" varchar(40) DEFAULT '' NOT NULL,
  "entity_id" integer,
  "detail" varchar(300) DEFAULT '' NOT NULL,
  "ip" varchar(64) DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------- keys
-- Guarded: ADD CONSTRAINT has no IF NOT EXISTS.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_user_id_users_id_fk') THEN
    ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_author_id_users_id_fk') THEN
    ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk"
      FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_project_id_projects_id_fk') THEN
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_project_id_projects_id_fk"
      FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inquiry_notes_inquiry_id_inquiries_id_fk') THEN
    ALTER TABLE "inquiry_notes" ADD CONSTRAINT "inquiry_notes_inquiry_id_inquiries_id_fk"
      FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inquiry_notes_author_id_users_id_fk') THEN
    ALTER TABLE "inquiry_notes" ADD CONSTRAINT "inquiry_notes_author_id_users_id_fk"
      FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_user_id_users_id_fk') THEN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null;
  END IF;
END $$;

-- ---------------------------------------------------------------- indexes
CREATE INDEX IF NOT EXISTS "sessions_user_idx"          ON "sessions"      ("user_id");
CREATE INDEX IF NOT EXISTS "sessions_expires_idx"       ON "sessions"      ("expires_at");
CREATE INDEX IF NOT EXISTS "projects_status_idx"        ON "projects"      ("status");
CREATE INDEX IF NOT EXISTS "projects_category_idx"      ON "projects"      ("category");
CREATE INDEX IF NOT EXISTS "projects_featured_idx"      ON "projects"      ("featured");
CREATE INDEX IF NOT EXISTS "projects_sort_idx"          ON "projects"      ("sort_order");
CREATE INDEX IF NOT EXISTS "posts_status_idx"           ON "posts"         ("status");
CREATE INDEX IF NOT EXISTS "posts_published_at_idx"     ON "posts"         ("published_at");
CREATE INDEX IF NOT EXISTS "posts_author_idx"           ON "posts"         ("author_id");
CREATE INDEX IF NOT EXISTS "reviews_status_idx"         ON "reviews"       ("status");
CREATE INDEX IF NOT EXISTS "reviews_created_at_idx"     ON "reviews"       ("created_at");
CREATE INDEX IF NOT EXISTS "reviews_project_idx"        ON "reviews"       ("project_id");
CREATE INDEX IF NOT EXISTS "reviews_ip_created_idx"     ON "reviews"       ("source_ip","created_at");
CREATE INDEX IF NOT EXISTS "inquiry_notes_inquiry_idx"  ON "inquiry_notes" ("inquiry_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx"  ON "audit_logs"    ("created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_user_idx"        ON "audit_logs"    ("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx"      ON "audit_logs"    ("entity","entity_id");
CREATE INDEX IF NOT EXISTS "inquiries_status_idx"       ON "inquiries"     ("status");
CREATE INDEX IF NOT EXISTS "inquiries_created_at_idx"   ON "inquiries"     ("created_at");
CREATE INDEX IF NOT EXISTS "inquiries_ip_created_idx"   ON "inquiries"     ("source_ip","created_at");

COMMIT;
