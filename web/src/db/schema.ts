import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";

/**
 * Admin users. Replaces the old single ADMIN_EMAIL/ADMIN_PASSWORD_HASH pair —
 * those env vars now only bootstrap the first account (see src/db/seed.ts).
 *
 * Roles:
 *   admin  — everything, including managing other users
 *   editor — work + posts only; cannot see or change users
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 250 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull().default(""),
  // scrypt "salt:key" — never the password itself.
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 16 }).notNull().default("editor"),
  // Deactivating beats deleting: it kills access immediately but keeps the row.
  active: boolean("active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Portfolio projects — the "Selected work" grid on the homepage.
 * `category` drives the filter buttons; counts are derived, never hand-written.
 */
export const works = pgTable(
  "works",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    // "apps" | "ecommerce" | "sites" — matches the existing data-cat filters.
    category: varchar("category", { length: 32 }).notNull(),
    // The pill above the title, e.g. "Web App · Education".
    badge: varchar("badge", { length: 120 }).notNull().default(""),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    imageAlt: varchar("image_alt", { length: 250 }).notNull().default(""),
    liveUrl: text("live_url").notNull().default(""),
    // Lower sorts first; ties fall back to newest.
    sortOrder: integer("sort_order").notNull().default(0),
    published: boolean("published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("works_category_idx").on(t.category),
    index("works_published_idx").on(t.published),
  ],
);

/**
 * Blog posts. Body is Markdown, rendered at request time.
 */
export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 250 }).notNull(),
    slug: varchar("slug", { length: 250 }).notNull().unique(),
    excerpt: text("excerpt").notNull().default(""),
    body: text("body").notNull().default(""),
    coverUrl: text("cover_url").notNull().default(""),
    coverAlt: varchar("cover_alt", { length: 250 }).notNull().default(""),
    // Comma-separated; kept simple on purpose — no join table for a handful of tags.
    tags: varchar("tags", { length: 300 }).notNull().default(""),
    published: boolean("published").notNull().default(false),
    // Null until first publish, then frozen so edits don't reorder the blog.
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("posts_published_idx").on(t.published),
    index("posts_published_at_idx").on(t.publishedAt),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Work = typeof works.$inferSelect;
export type NewWork = typeof works.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export const WORK_CATEGORIES = [
  { value: "apps", label: "Web Apps" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "sites", label: "Websites" },
] as const;

export const USER_ROLES = [
  { value: "admin", label: "Admin", hint: "Full access, including managing users" },
  { value: "editor", label: "Editor", hint: "Work and posts only" },
] as const;

export type Role = (typeof USER_ROLES)[number]["value"];

/**
 * Project enquiries from the contact form.
 *
 * Stored before the email is sent, so a Resend outage costs a notification
 * rather than the lead itself. `status` is deliberately a plain varchar with a
 * default rather than a pg enum — adding a stage later shouldn't need a
 * migration on a type that other tables don't reference.
 */
export const projectInquiries = pgTable(
  "project_inquiries",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 250 }).notNull(),
    company: varchar("company", { length: 200 }).notNull().default(""),
    website: varchar("website", { length: 300 }).notNull().default(""),
    phone: varchar("phone", { length: 60 }).notNull().default(""),
    projectType: varchar("project_type", { length: 60 }).notNull().default(""),
    budget: varchar("budget", { length: 60 }).notNull().default(""),
    timeline: varchar("timeline", { length: 60 }).notNull().default(""),
    message: text("message").notNull(),
    // "new" | "contacted" | "qualified" | "closed"
    status: varchar("status", { length: 24 }).notNull().default("new"),
    // Kept for rate-limiting and abuse triage, not shown in the admin.
    sourceIp: varchar("source_ip", { length: 64 }).notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("inquiries_status_idx").on(t.status),
    index("inquiries_created_idx").on(t.createdAt),
  ],
);

export type ProjectInquiry = typeof projectInquiries.$inferSelect;
export type NewProjectInquiry = typeof projectInquiries.$inferInsert;
