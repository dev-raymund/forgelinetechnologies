"use client";

import { useState, useTransition } from "react";
import { rerunAudit } from "@/lib/prospecting/actions";

/**
 * An audit only stays queued or running when the process that was auditing it
 * stopped first. This closes that row and starts a fresh audit of the same URL.
 */
export function RerunButton({ auditId }: { auditId: number }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const result = await rerunAudit(auditId);
            if (result.status === "error") setError(result.message);
          })
        }
        className="rounded-sm border border-rule-strong px-4 py-2 text-[0.875rem] font-medium transition-colors hover:border-ink disabled:opacity-60"
      >
        {pending ? "Starting…" : "Re-run audit"}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-[0.8125rem] text-muted">
          {error}
        </p>
      ) : null}
    </div>
  );
}
