# Legacy documentation

These documents describe the **previous** ForgeLine application — a Next.js
app that lived in `web/`, alongside a static site in `site/` and a
digital-twin CLI at the repository root. All of it was removed in the
2026-09-11 rebuild.

They are kept because the measurements in them are still true of that system
and several findings carried forward into the new one: the enquiry pipeline
ordering, the Neon cold-start retry, the canonical-host decision, and the
reasons `db:push` could not be trusted.

For the current system, see the documents one level up.

The removed application is recoverable at commit `28f6bfa` on `origin/main`.
