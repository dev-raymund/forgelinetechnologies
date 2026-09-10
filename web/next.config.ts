import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

/**
 * Staging is served under a path prefix (/staging) rather than its own
 * hostname. `basePath` rewrites every route, asset and Link in the build, so
 * it applies to a WHOLE deployment — production and staging are therefore two
 * separate deployments of this same codebase, differing only by this variable.
 *
 * Unset  -> production build, served at /
 * /staging -> staging build, served under /staging
 *
 * Set it in the Vercel project's environment variables, not here, so the
 * production project never accidentally inherits a prefix.
 */
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";

// Next requires a leading slash and no trailing slash; normalise rather than
// letting a stray value fail the build with an opaque error.
const basePath = rawBasePath
  ? `/${rawBasePath.replace(/^\/+/, "").replace(/\/+$/, "")}`
  : "";

const config: NextConfig = {
  // The repo root also has a package-lock.json (the paused digital-twin project),
  // so point tracing at this app explicitly.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  ...(basePath ? { basePath } : {}),
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default config;
