"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-level error boundary.
 *
 * Without this a thrown exception renders Next's default error screen, which
 * is unbranded and tells a visitor nothing they can act on. This keeps them
 * inside the site and offers the two things that actually help: try again, or
 * reach a human.
 *
 * The digest is shown because it is the only handle a visitor can quote when
 * they report the problem, and it identifies the server-side error without
 * leaking the stack trace.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Reaches the platform logs. Never rendered to the visitor.
    console.error("[route error]", error);
  }, [error]);

  return (
    <section className="on-ink bg-ink text-on-ink">
      <div className="shell">
        <div className="railed railed-inset py-24 md:py-36">
          <p className="font-mono text-micro text-accent">Something broke</p>
          <h1 className="text-title mt-5 max-w-[20ch] font-semibold text-white">
            That page did not load
          </h1>
          <p className="mt-6 max-w-[54ch] text-dek text-on-ink-muted">
            The fault is on our side, not yours. Trying again often works — the
            most common cause is a database waking from idle.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center rounded-sm bg-accent px-5 py-3 text-[0.9375rem] font-medium text-white transition-colors hover:bg-accent-deep"
            >
              Try again
            </button>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-sm border border-rule-ink-strong px-5 py-3 text-[0.9375rem] font-medium text-on-ink transition-colors hover:border-white hover:bg-white/5"
            >
              Tell us what happened
            </Link>
          </div>

          {error.digest ? (
            <p className="mt-10 font-mono text-micro text-on-ink-muted">
              Reference {error.digest}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
