# Database setup

Neon Postgres via Drizzle ORM (`drizzle-orm/neon-http`).

**Status: schema written, NOT yet applied.** Applying it needs the connection
string for the new Neon project, which does not exist yet. See "Applying it"
below.

## Files

| File | Role |
|---|---|
| `src/db/schema.ts` | Table definitions — the single source of truth |
| `src/db/index.ts` | Connection; throws if `DATABASE_URL` is unset |
| `src/lib/queries.ts` | Typed reads, with a retry wrapper |
| `drizzle.config.ts` | Points drizzle-kit at the schema |

## Tables

### `users`
`id` · `email` (unique) · `name` · `password_hash` · `role` · `active` ·
`created_at` · `updated_at`

Exists so authentication can be added without a migration. Nothing reads it
yet. Passwords are scrypt `salt:key` when it is used; the password itself is
never stored.

### `projects`
`id` · `title` · `slug` (unique) · `category` · `summary` · `description` ·
`image_url` · `image_alt` · `live_url` · `sort_order` · `published` ·
`created_at` · `updated_at`

Indexes: `projects_published_idx`, `projects_category_idx`.

`published` defaults to **false** — a new row is a draft until deliberately
published.

### `posts`
`id` · `title` · `slug` (unique) · `excerpt` · `body` · `cover_url` ·
`published` · `published_at` · `created_at` · `updated_at`

Indexes: `posts_published_idx`, `posts_published_at_idx`.

### `inquiries`
`id` · `name` · `email` · `company` · `website` · `project_type` · `budget` ·
`message` · `source` · `source_ip` · `status` · `created_at`

Indexes: `inquiries_status_idx`, `inquiries_created_at_idx`, and the
composite **`inquiries_ip_created_idx` on `(source_ip, created_at)`** — the
rate-limit query filters on both columns together, so a composite serves it
where two single-column indexes would not.

`status` is a plain varchar defaulting to `new`, not a pg enum: adding a
workflow stage later should not require a type migration.

## Applying it

```
npm run db:push
```

The script is `node --env-file=.env ./node_modules/drizzle-kit/bin.cjs push`.
drizzle-kit runs outside Next and does not read `.env` on its own, so the
script passes it explicitly.

## Verification — do not trust the CLI

On the previous database a `drizzle-kit push` **partially applied**: it
created a table, failed, and left two declared indexes missing while
reporting nothing useful. Always verify against the database itself:

```sql
select table_name, column_name, data_type
  from information_schema.columns
 where table_schema = 'public'
 order by table_name, ordinal_position;

select tablename, indexname, indexdef
  from pg_indexes
 where schemaname = 'public'
 order by tablename, indexname;
```

Expected once applied: **4 tables** and **12 indexes** — 4 primary keys, 3
unique constraints (`users.email`, `projects.slug`, `posts.slug`) and 7
declared indexes.

A failed push does not mean an unchanged database. Check after every run,
successful or not.

## Cold starts

Neon's free tier suspends after inactivity and the first query can exceed the
driver's connect timeout, surfacing as a 500. `withRetry()` in
`src/lib/queries.ts` retries connection-level failures twice (300ms, 600ms)
and rethrows genuine SQL errors immediately — retrying bad SQL only delays
the same failure.
