import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Admin accounts.
 *
 * The table exists so authentication can be added without a migration later.
 * No auth is implemented yet and nothing reads this table.
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

/** Portfolio projects. */
export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    category: varchar("category", { length: 32 }).notNull(),
    summary: varchar("summary", { length: 300 }).notNull().default(""),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    imageAlt: varchar("image_alt", { length: 250 }).notNull().default(""),
    liveUrl: text("live_url").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("projects_published_idx").on(t.published),
    index("projects_category_idx").on(t.category),
  ],
);

/** Blog posts. */
export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 250 }).notNull(),
    slug: varchar("slug", { length: 250 }).notNull().unique(),
    excerpt: varchar("excerpt", { length: 400 }).notNull().default(""),
    body: text("body").notNull().default(""),
    coverUrl: text("cover_url").notNull().default(""),
    published: boolean("published").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("posts_published_idx").on(t.published),
    index("posts_published_at_idx").on(t.publishedAt),
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

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type NewInquiry = typeof inquiries.$inferInsert;
