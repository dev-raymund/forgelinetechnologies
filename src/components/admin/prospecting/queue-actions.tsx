"use client";

import { useState, useTransition } from "react";
import { queueAllNew, runQueueNow } from "@/lib/prospecting/actions";
import type { DrainSummary } from "@/lib/prospecting/drain";

function formatDrain(summary: DrainSummary): string {
  return `${summary.completed} audited, ${summary.skipped} skipped, ${summary.failed} failed`;
}

/**
 * The two entry points for moving prospects through the audit queue from the
 * list page itself. Both share one pending flag, matching the rest of the
 * admin: a reviewer is not expected to fire these at the same time.
 */
export function QueueActions() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleQueueAllNew() {
    start(async () => {
      setError(null);
      setMessage(null);
      const result = await queueAllNew();
      if ("error" in result) setError(result.error);
      else setMessage(`${result.queued} queued.`);
    });
  }

  function handleRunQueueNow() {
    start(async () => {
      setError(null);
      setMessage(null);
      const result = await runQueueNow();
      if ("error" in result) setError(result.error);
      else setMessage(formatDrain(result));
    });
  }

  return (
    <div className="flex flex-col items-end gap-2 text-right">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={handleQueueAllNew}
          className="rounded-sm border border-rule-strong px-4 py-2 text-[0.875rem] font-medium transition-colors hover:border-ink disabled:opacity-60"
        >
          {pending ? "Working…" : "Queue all new"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={handleRunQueueNow}
          className="rounded-sm bg-ink px-4 py-2 text-[0.875rem] font-medium text-on-ink transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Running…" : "Run queue now"}
        </button>
      </div>
      {message ? (
        <p className="text-[0.8125rem] text-muted">{message}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-[0.8125rem] text-muted">
          {error}
        </p>
      ) : null}
      <div className="max-w-[22rem] space-y-1 text-[0.75rem] leading-relaxed text-faint">
        <p>
          Queue all new queues at most 200 prospects per click — the list
          itself is capped at 200.
        </p>
        <p>
          Run queue now runs up to five audits. For a large list use{" "}
          <code className="font-mono">npm run prospecting:drain</code>.
        </p>
      </div>
    </div>
  );
}
