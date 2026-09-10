/**
 * Shared, safely-inlined view of the deployment target.
 *
 * NEXT_PUBLIC_* is inlined at build time, so this is a constant in the bundle
 * rather than a runtime lookup — which is what we want: a build either is or
 * isn't a staging build, and that never changes while it runs.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim()
  ? `/${process.env.NEXT_PUBLIC_BASE_PATH.trim().replace(/^\/+/, "").replace(/\/+$/, "")}`
  : "";

export const isStaging = basePath !== "";
