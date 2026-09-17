"use client";

import { useState, useTransition } from "react";
import {
  clearDecisionAction,
  dismissProspectAction,
  qualifyProspectAction,
} from "@/lib/prospecting/qualification-actions";

/**
 * Qualify, dismiss, or clear the reviewer's decision. Dismissing needs a
 * reason and qualifying does not. All three are reversible and logged.
 */
export function DecisionControls({
  prospectId,
  decision,
  suppressed,
}: {
  prospectId: number;
  decision: string;
  suppressed: boolean;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const trimmed = reason.trim();

  function run(action: () => Promise<{ ok: true } | { error: string }>) {
    start(async () => {
      setError(null);
      const result = await action();
      if ("error" in result) setError(result.error);
      else setReason("");
    });
  }

  return (
    <div className="mt-4">
      <label htmlFor={`decision-reason-${prospectId}`} className="text-[0.875rem] font-medium">
        Reason
      </label>
      <input
        id={`decision-reason-${prospectId}`}
        value={reason}
        maxLength={300}
        onChange={(e) => {
          setReason(e.target.value);
          if (error) setError(null);
        }}
        placeholder="Required to dismiss, optional to qualify"
        className="mt-1.5 w-full rounded-sm border border-rule-strong bg-white px-3 py-2.5 text-[0.9375rem] focus:border-ink focus:outline-none"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || suppressed}
          onClick={() => run(() => qualifyProspectAction(prospectId, trimmed))}
          className="rounded-sm bg-ink px-4 py-2 text-[0.875rem] font-medium text-on-ink transition-colors hover:opacity-90 disabled:opacity-60"
        >
          Qualify
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!trimmed) {
              setError("Give a reason before dismissing this prospect.");
              return;
            }
            run(() => dismissProspectAction(prospectId, trimmed));
          }}
          className="rounded-sm border border-rule-strong px-4 py-2 text-[0.875rem] font-medium transition-colors hover:border-ink disabled:opacity-60"
        >
          Dismiss
        </button>
        {decision ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => clearDecisionAction(prospectId))}
            className="rounded-sm border border-rule-strong px-4 py-2 text-[0.875rem] font-medium transition-colors hover:border-ink disabled:opacity-60"
          >
            Clear decision
          </button>
        ) : null}
      </div>
      {suppressed ? (
        <p className="mt-2 text-[0.75rem] text-faint">A suppressed prospect cannot be qualified.</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-[0.8125rem] text-muted">
          {error}
        </p>
      ) : null}
    </div>
  );
}
