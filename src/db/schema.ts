import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import type { OpportunityOverride, ScoreAdjustments } from "../lib/prospecting/types.ts";

/**
 * Admin accounts.
 *
 * `active` is the account's on/off switch rather than a `status` enum: it has
 * two meaningful states and deactivating already revokes every session, so a
 * third value would describe nothing the system acts on.
 *
 * Roles are "admin" and "editor". Kept as a varchar for the same reason
 * inquiry status is — adding a role should not require a type migration.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull().default(""),
  // scrypt "salt:key" — the password itself is never stored.
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 16 }).notNull().default("editor"),
  // Deactivating beats deleting: it revokes access but keeps the row.
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Portfolio projects.
 *
 * Seeded from src/data/projects.ts, which stays in the repository as the seed
 * source and the fallback. Slugs are the contract: they are live URLs with
 * search history behind them, so a slug change is a redirect, never an edit.
 *
 * `liveUrl` is deliberately allowed to be empty. A build outlives the site it
 * produced, and the public page says so plainly rather than linking into a
 * dead domain — see /work/fast-track-home-loans.
 */
export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    /** Display grouping, e.g. "sites". Retained from the original table. */
    category: varchar("category", { length: 32 }).notNull(),
    /** How it was built — "Website" | "Web App" | "E-commerce" | "Custom Build". */
    kind: varchar("kind", { length: 32 }).notNull().default("Website"),
    /** The client's industry, shown as metadata beside the kind. */
    sector: varchar("sector", { length: 80 }).notNull().default(""),
    summary: varchar("summary", { length: 300 }).notNull().default(""),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    imageAlt: varchar("image_alt", { length: 250 }).notNull().default(""),
    /** Empty means there is no reachable live site. Never a dead URL. */
    liveUrl: text("live_url").notNull().default(""),
    /** Named technologies. Only what the build genuinely used. */
    stack: jsonb("stack").$type<string[]>().notNull().default([]),
    /* Case-study prose. Optional: written for some projects, not all, and
       nothing is generated to fill the gap. */
    overview: text("overview").notNull().default(""),
    challenge: text("challenge").notNull().default(""),
    approach: text("approach").notNull().default(""),
    outcome: text("outcome").notNull().default(""),
    gallery: jsonb("gallery").$type<{ src: string; alt: string }[]>().notNull().default([]),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    /** "published" | "draft" | "archived". Only published reaches the public site. */
    status: varchar("status", { length: 16 }).notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("projects_status_idx").on(t.status),
    index("projects_category_idx").on(t.category),
    index("projects_featured_idx").on(t.featured),
    index("projects_sort_idx").on(t.sortOrder),
  ],
);

/**
 * Blog posts.
 *
 * `body` is Markdown, not HTML. Storing the source rather than rendered markup
 * means the sanitiser runs on output we generate ourselves from a known
 * grammar, instead of on markup a browser once accepted — a much smaller thing
 * to get right. Rendering lives in lib/markdown.ts.
 *
 * `status` replaced the old `published` boolean: draft and published are two
 * of three states, and archived needs somewhere to live that is not deletion.
 */
export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 250 }).notNull(),
    slug: varchar("slug", { length: 250 }).notNull().unique(),
    excerpt: varchar("excerpt", { length: 400 }).notNull().default(""),
    /** Markdown source. */
    body: text("body").notNull().default(""),
    coverUrl: text("cover_url").notNull().default(""),
    /* SEO overrides. Empty means "derive from the post", which is what the
       public page does — an author should not have to fill these in to get
       sensible metadata. */
    seoTitle: varchar("seo_title", { length: 250 }).notNull().default(""),
    seoDescription: varchar("seo_description", { length: 400 }).notNull().default(""),
    ogImage: text("og_image").notNull().default(""),
    /** "draft" | "published" | "archived". Only published reaches the public site. */
    status: varchar("status", { length: 16 }).notNull().default("draft"),
    authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("posts_status_idx").on(t.status),
    index("posts_published_at_idx").on(t.publishedAt),
    index("posts_author_idx").on(t.authorId),
  ],
);

/**
 * Project enquiries from the contact form.
 *
 * `status` is a plain varchar rather than a pg enum: adding a stage later
 * should not require a type migration on something nothing references.
 */
export const inquiries = pgTable(
  "inquiries",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    company: varchar("company", { length: 200 }).notNull().default(""),
    website: varchar("website", { length: 300 }).notNull().default(""),
    projectType: varchar("project_type", { length: 60 }).notNull().default(""),
    budget: varchar("budget", { length: 60 }).notNull().default(""),
    timeline: varchar("timeline", { length: 60 }).notNull().default(""),
    message: text("message").notNull(),
    // Where the enquiry came from, e.g. "contact-form".
    source: varchar("source", { length: 60 }).notNull().default("contact-form"),
    // Retained for rate limiting and abuse triage only.
    sourceIp: varchar("source_ip", { length: 64 }).notNull().default(""),
    // "new" | "contacted" | "qualified" | "closed"
    status: varchar("status", { length: 24 }).notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // Set by the application when status changes; enquiries are triaged, not
    // edited, so there is no trigger behind this.
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("inquiries_status_idx").on(t.status),
    index("inquiries_created_at_idx").on(t.createdAt),
    // Composite, because the rate limit filters on both columns together.
    index("inquiries_ip_created_idx").on(t.sourceIp, t.createdAt),
  ],
);

/**
 * Login sessions.
 *
 * Server-side rather than a self-contained token, and that is the whole point:
 * a row can be deleted. Deactivating an account or forcing a logout takes
 * effect on the next request instead of whenever a token happens to expire,
 * which is the property an admin panel actually needs.
 *
 * The cookie carries only the id. Nothing about the user travels in it.
 */
export const sessions = pgTable(
  "sessions",
  {
    /** 256 bits of CSPRNG, base64url. Not a serial — ids must not be guessable. */
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    /* Recorded for the session list, so someone can recognise a login that was
       not theirs. Not used for authorisation — both are trivially spoofed. */
    userAgent: varchar("user_agent", { length: 300 }).notNull().default(""),
    ip: varchar("ip", { length: 64 }).notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("sessions_user_idx").on(t.userId),
    index("sessions_expires_idx").on(t.expiresAt),
  ],
);

/**
 * Client reviews.
 *
 * Nothing here reaches the public site without a person deciding it should.
 * Every submission starts as "pending", and `permissionToPublish` records what
 * the reviewer actually agreed to — publishing someone's words and employer
 * without it is not a bug we want to be one edit away from.
 */
export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    company: varchar("company", { length: 200 }).notNull().default(""),
    /** Never published. Used to reply, and to recognise a duplicate. */
    email: varchar("email", { length: 255 }).notNull(),
    rating: integer("rating").notNull(),
    body: text("body").notNull(),
    /** Optional: a review does not have to be about a listed project. */
    projectId: integer("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    photoUrl: text("photo_url").notNull().default(""),
    permissionToPublish: boolean("permission_to_publish").notNull().default(false),
    /** "pending" | "approved" | "rejected" | "published". */
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    sourceIp: varchar("source_ip", { length: 64 }).notNull().default(""),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reviews_status_idx").on(t.status),
    index("reviews_created_at_idx").on(t.createdAt),
    index("reviews_project_idx").on(t.projectId),
    // Composite, because the rate limit filters on both columns together.
    index("reviews_ip_created_idx").on(t.sourceIp, t.createdAt),
  ],
);

/**
 * Notes against an enquiry.
 *
 * A related table rather than a text column on `inquiries`: notes are written
 * by different people at different times, and who wrote what and when is the
 * useful part. Appending to a blob loses exactly that.
 */
export const inquiryNotes = pgTable(
  "inquiry_notes",
  {
    id: serial("id").primaryKey(),
    inquiryId: integer("inquiry_id")
      .notNull()
      .references(() => inquiries.id, { onDelete: "cascade" }),
    authorId: integer("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("inquiry_notes_inquiry_idx").on(t.inquiryId)],
);

/**
 * Audit log.
 *
 * Deliberately small: who did what to which record, and when. Enough to answer
 * "who published that" or "who deleted this" without becoming a second copy of
 * the data it describes.
 */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    /** Nullable so a failed login attempt can be recorded without a user. */
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    /** Kept alongside userId so the log survives the account being deleted. */
    actorEmail: varchar("actor_email", { length: 255 }).notNull().default(""),
    /** e.g. "login", "post.publish", "review.approve", "inquiry.status". */
    action: varchar("action", { length: 60 }).notNull(),
    /** e.g. "post", "review". Empty for actions with no subject, like login. */
    entity: varchar("entity", { length: 40 }).notNull().default(""),
    entityId: integer("entity_id"),
    /** Small, human-readable context. Never the whole record. */
    detail: varchar("detail", { length: 300 }).notNull().default(""),
    ip: varchar("ip", { length: 64 }).notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_created_at_idx").on(t.createdAt),
    index("audit_logs_user_idx").on(t.userId),
    index("audit_logs_entity_idx").on(t.entity, t.entityId),
  ],
);

/**
 * A manually requested website audit. A row is created before the background
 * job starts so the admin can see queued, partial, and failed runs as well as
 * successful reports.
 */
export const prospectAudits = pgTable(
  "prospect_audits",
  {
    id: serial("id").primaryKey(),
    requestedUrl: text("requested_url").notNull(),
    finalUrl: text("final_url").notNull().default(""),
    status: varchar("status", { length: 16 }).notNull().default("queued"),
    auditVersion: varchar("audit_version", { length: 32 }).notNull().default("phase1-v1"),
    requestedBy: integer("requested_by").references(() => users.id, { onDelete: "set null" }),
    prospectId: integer("prospect_id"),
    requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    httpStatus: integer("http_status"),
    https: boolean("https").notNull().default(false),
    redirectChain: jsonb("redirect_chain").$type<string[]>().notNull().default([]),
    report: jsonb("report").$type<Record<string, unknown>>().notNull().default({}),
    scores: jsonb("scores").$type<Record<string, number>>().notNull().default({}),
    totalScore: integer("total_score").notNull().default(0),
    errorDetail: text("error_detail").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("prospect_audits_status_idx").on(t.status),
    index("prospect_audits_requested_at_idx").on(t.requestedAt),
    index("prospect_audits_requested_by_idx").on(t.requestedBy),
    index("prospect_audits_prospect_idx").on(t.prospectId),
  ],
);

/** Evidence-level observations belonging to one website audit. */
export const auditFindings = pgTable(
  "audit_findings",
  {
    id: serial("id").primaryKey(),
    auditId: integer("audit_id")
      .notNull()
      .references(() => prospectAudits.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 32 }).notNull(),
    rule: varchar("rule", { length: 80 }).notNull(),
    severity: varchar("severity", { length: 16 }).notNull(),
    pageUrl: text("page_url").notNull(),
    evidence: jsonb("evidence").$type<Record<string, unknown>>().notNull().default({}),
    recommendation: text("recommendation").notNull(),
    confidence: varchar("confidence", { length: 16 }).notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_findings_audit_idx").on(t.auditId),
    index("audit_findings_category_idx").on(t.category),
    index("audit_findings_severity_idx").on(t.severity),
  ],
);

/** Where one import learned about a prospect. Append-only provenance. */
export type ProspectSource = {
  name: string;
  url: string;
  importedAt: string;
  importedBy: number | null;
};

/**
 * A researched organisation, not an inbound enquiry.
 *
 * `domain` is the deduplication key and is unique: re-importing a list can
 * never create a second row for the same business, which is what stops anyone
 * being worked or contacted twice.
 *
 * `totalScore` and `primaryOpportunity` are denormalized snapshots so the list
 * can sort and filter in SQL. They hold the effective qualification — the
 * latest usable audit's findings, business fit, contact, and any reviewer
 * adjustment or override — and `refreshQualificationSnapshot` rewrites them on
 * every path that can change one. The detail page never reads them for the
 * breakdown: it recomputes.
 *
 * `decision` is the reviewer's judgement and has its own columns, never a
 * value of `status`. The drain writes `status` after every audit, and Phase
 * 2's worst defect was a pipeline write overwriting a human decision held
 * there. Suppression stays separate too: it is the business's opt-out, while
 * dismissal is ForgeLine's judgement.
 */
export const prospects = pgTable(
  "prospects",
  {
    id: serial("id").primaryKey(),
    companyName: text("company_name").notNull(),
    domain: varchar("domain", { length: 253 }).notNull().unique(),
    websiteUrl: text("website_url").notNull(),
    industry: varchar("industry", { length: 80 }).notNull().default(""),
    country: varchar("country", { length: 2 }).notNull().default(""),
    location: text("location").notNull().default(""),
    contactChannel: text("contact_channel").notNull().default(""),
    contactProvenance: text("contact_provenance").notNull().default(""),
    sources: jsonb("sources").$type<ProspectSource[]>().notNull().default([]),
    status: varchar("status", { length: 16 }).notNull().default("new"),
    suppressedAt: timestamp("suppressed_at", { withTimezone: true }),
    suppressionReason: text("suppression_reason").notNull().default(""),
    lastAuditId: integer("last_audit_id"),
    lastAuditedAt: timestamp("last_audited_at", { withTimezone: true }),
    totalScore: integer("total_score").notNull().default(0),
    primaryOpportunity: varchar("primary_opportunity", { length: 32 }).notNull().default(""),
    scoreAdjustments: jsonb("score_adjustments").$type<ScoreAdjustments>().notNull().default({}),
    opportunityOverride: jsonb("opportunity_override").$type<OpportunityOverride>(),
    /** `""` (undecided), `qualified` or `dismissed`. */
    decision: varchar("decision", { length: 16 }).notNull().default(""),
    decisionReason: text("decision_reason").notNull().default(""),
    decidedBy: integer("decided_by").references(() => users.id, { onDelete: "set null" }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("prospects_status_idx").on(t.status),
    index("prospects_score_idx").on(t.totalScore),
    index("prospects_country_idx").on(t.country),
    index("prospects_industry_idx").on(t.industry),
    index("prospects_decision_idx").on(t.decision),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Inquiry = typeof inquiries.$inferSelect;
export type NewInquiry = typeof inquiries.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type InquiryNote = typeof inquiryNotes.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type ProspectAudit = typeof prospectAudits.$inferSelect;
export type NewProspectAudit = typeof prospectAudits.$inferInsert;
export type AuditFinding = typeof auditFindings.$inferSelect;
export type NewAuditFinding = typeof auditFindings.$inferInsert;
export type Prospect = typeof prospects.$inferSelect;
export type NewProspect = typeof prospects.$inferInsert;
