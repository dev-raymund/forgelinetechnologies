"use client";

import { useState, useTransition } from "react";
import {
  suppressProspectAction,
  unsuppressProspectAction,
} from "@/lib/prospecting/actions";

/**
 * The opt-out control on the prospect detail page.
 *
 * `suppressProspectAction` takes the reason as a plain argument rather than a
 * `FormData`, so this cannot be a native form action the way `logout` is —
 * it needs client state to hold the reason and to refuse to submit it empty,
 * the same shape as `RerunButton`.
 */
export function SuppressControls({
  id,
  suppressed,
}: {
  id: number;
  suppressed: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  if (suppressed) {
    return (
      <div>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              const result = await unsuppressProspectAction(id);
              if ("error" in result) setError(result.error);
            })
          }
          className="rounded-sm border border-rule-strong px-4 py-2 text-[0.875rem] font-medium transition-colors hover:border-ink disabled:opacity-60"
        >
          {pending ? "Restoring…" : "Unsuppress"}
        </button>
        {error ? (
          <p role="alert" className="mt-2 text-[0.8125rem] text-muted">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  const trimmed = reason.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!trimmed) {
          setError("Give a reason before suppressing this prospect.");
          return;
        }
        start(async () => {
          setError(null);
          const result = await suppressProspectAction(id, trimmed);
          if ("error" in result) setError(result.error);
        });
      }}
    >
      <label htmlFor={`suppress-reason-${id}`} className="text-[0.875rem] font-medium">
        Suppression reason
      </label>
      <input
        id={`suppress-reason-${id}`}
        value={reason}
        onChange={(e) => {
          setReason(e.target.value);
          if (error) setError(null);
        }}
        required
        placeholder="e.g. Asked not to be contacted"
        className="mt-1.5 w-full rounded-sm border border-rule-strong bg-white px-3 py-2.5 text-[0.9375rem] focus:border-ink focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending || !trimmed}
        className="mt-3 rounded-sm border border-rule-strong px-4 py-2 text-[0.875rem] font-medium transition-colors hover:border-ink disabled:opacity-60"
      >
        {pending ? "Suppressing…" : "Suppress"}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-[0.8125rem] text-muted">
          {error}
        </p>
      ) : null}
    </form>
  );
}
