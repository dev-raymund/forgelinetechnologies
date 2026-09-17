"use client";

import { useState, useTransition } from "react";
import {
  adjustScoreAction,
  clearScoreAdjustmentAction,
} from "@/lib/prospecting/qualification-actions";
import type { ComponentKey } from "@/lib/prospecting/types";

const PLACEHOLDERS: Record<ComponentKey, string> = {
  websiteUx: "e.g. Checked on a phone; the fixed-width finding is real",
  seo: "e.g. Title and description are missing on every page checked",
  technical: "e.g. The broken links point to a retired booking system",
  conversion: "e.g. The enquiry form sits below the fold on the homepage",
  businessFit: "e.g. Industry is property management; target fit",
  decisionMakerAvailability: "e.g. Director listed on the About page",
};

const LINK =
  "text-[0.8125rem] font-medium underline decoration-rule-strong underline-offset-4 hover:decoration-accent disabled:opacity-60";

/**
 * Sets or clears a reviewer's value for one score component. The server
 * re-validates the bounds and the reason; the checks here only save a trip.
 */
export function ScoreAdjustControls({
  prospectId,
  component,
  cap,
  automatic,
  adjusted,
}: {
  prospectId: number;
  component: ComponentKey;
  cap: number;
  automatic: number;
  adjusted: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [points, setPoints] = useState(String(automatic));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const hintId = `adjust-${component}-hint`;
  const isDecisionMaker = component === "decisionMakerAvailability";

  function save() {
    const value = Number(points);
    if (!Number.isInteger(value) || value < 0 || value > cap) {
      setError(`Enter a whole number from 0 to ${cap}.`);
      return;
    }
    if (!reason.trim()) {
      setError("Give a reason for this adjustment.");
      return;
    }
    start(async () => {
      setError(null);
      const result = await adjustScoreAction(prospectId, component, value, reason.trim());
      if ("error" in result) {
        setError(result.error);
      } else {
        setOpen(false);
        setReason("");
        // `points` was seeded from `automatic` only once, at mount, so it
        // would otherwise keep showing whatever was last typed here. Reset it
        // so reopening the form starts fresh rather than stale.
        setPoints(String(automatic));
      }
    });
  }

  function clear() {
    start(async () => {
      setError(null);
      const result = await clearScoreAdjustmentAction(prospectId, component);
      if ("error" in result) {
        setError(result.error);
      } else {
        setPoints(String(automatic));
      }
    });
  }

  return (
    <div className="mt-2">
      {open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-2"
        >
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={`adjust-${component}-points`} className="text-[0.8125rem] text-graphite">
              Points
            </label>
            <input
              id={`adjust-${component}-points`}
              type="number"
              min={0}
              max={cap}
              step={1}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-20 rounded-sm border border-rule-strong bg-white px-2 py-1.5 text-[0.875rem] focus:border-ink focus:outline-none"
            />
            <span className="font-mono text-micro text-faint">of {cap}</span>
          </div>
          <label htmlFor={`adjust-${component}-reason`} className="block text-[0.8125rem] text-graphite">
            Reason
          </label>
          <input
            id={`adjust-${component}-reason`}
            value={reason}
            maxLength={300}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder={PLACEHOLDERS[component]}
            aria-describedby={isDecisionMaker ? hintId : undefined}
            className="w-full rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] focus:border-ink focus:outline-none"
          />
          {isDecisionMaker ? (
            <p id={hintId} className="text-[0.75rem] text-faint">
              Name the role and where the company publishes it. Never name the person.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-sm bg-ink px-3 py-1.5 text-[0.8125rem] font-medium text-on-ink transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save adjustment"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="rounded-sm border border-rule-strong px-3 py-1.5 text-[0.8125rem] font-medium transition-colors hover:border-ink disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setOpen(true)} className={LINK}>
            Adjust
          </button>
          {adjusted ? (
            <button type="button" disabled={pending} onClick={clear} className={LINK}>
              {pending ? "Clearing…" : "Clear adjustment"}
            </button>
          ) : null}
        </div>
      )}
      {error ? (
        <p role="alert" className="mt-1 text-[0.8125rem] text-muted">
          {error}
        </p>
      ) : null}
    </div>
  );
}
