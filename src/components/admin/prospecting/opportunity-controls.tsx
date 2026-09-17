"use client";

import { useState, useTransition } from "react";
import {
  clearOpportunityOverrideAction,
  setOpportunityOverrideAction,
} from "@/lib/prospecting/qualification-actions";
import { OPPORTUNITIES, type Opportunity } from "@/lib/prospecting/types";

const LINK =
  "text-[0.8125rem] font-medium underline decoration-rule-strong underline-offset-4 hover:decoration-accent disabled:opacity-60";

/**
 * A reviewer's override of the opportunities. It is the only way to reach
 * Automation, API / Integration or Custom Software, which a homepage cannot
 * evidence. Clearing it restores the automatic set.
 */
export function OpportunityControls({
  prospectId,
  overridden,
  primary,
  secondary,
}: {
  prospectId: number;
  overridden: boolean;
  primary: Opportunity | null;
  secondary: Opportunity[];
}) {
  const [open, setOpen] = useState(false);
  const [chosenPrimary, setChosenPrimary] = useState<Opportunity>(primary ?? "Build Audit");
  const [chosenSecondary, setChosenSecondary] = useState<Opportunity[]>(secondary);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    if (!reason.trim()) {
      setError("Give a reason for this override.");
      return;
    }
    start(async () => {
      setError(null);
      const result = await setOpportunityOverrideAction(
        prospectId,
        chosenPrimary,
        chosenSecondary.filter((o) => o !== chosenPrimary),
        reason.trim(),
      );
      if ("error" in result) {
        setError(result.error);
      } else {
        setOpen(false);
        setReason("");
        // `chosenPrimary` and `chosenSecondary` were seeded from `primary` and
        // `secondary` only once, at mount, so they would otherwise keep
        // showing whatever was last chosen here. Reset them so reopening the
        // form starts fresh rather than stale.
        setChosenPrimary(primary ?? "Build Audit");
        setChosenSecondary(secondary);
      }
    });
  }

  function clear() {
    start(async () => {
      setError(null);
      const result = await clearOpportunityOverrideAction(prospectId);
      if ("error" in result) {
        setError(result.error);
      } else {
        setChosenPrimary(primary ?? "Build Audit");
        setChosenSecondary(secondary);
      }
    });
  }

  return (
    <div className="mt-3">
      {open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-3"
        >
          <div>
            <label htmlFor={`override-primary-${prospectId}`} className="block text-[0.8125rem] text-graphite">
              Primary
            </label>
            <select
              id={`override-primary-${prospectId}`}
              value={chosenPrimary}
              onChange={(e) => setChosenPrimary(e.target.value as Opportunity)}
              className="mt-1 rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] focus:border-ink focus:outline-none"
            >
              {OPPORTUNITIES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <fieldset>
            <legend className="text-[0.8125rem] text-graphite">Secondary</legend>
            <div className="mt-1 grid gap-1 sm:grid-cols-2">
              {OPPORTUNITIES.filter((o) => o !== chosenPrimary).map((o) => (
                <label key={o} className="flex items-center gap-2 text-[0.8125rem] text-muted">
                  <input
                    type="checkbox"
                    checked={chosenSecondary.includes(o)}
                    onChange={(e) =>
                      setChosenSecondary((current) =>
                        e.target.checked ? [...current, o] : current.filter((c) => c !== o),
                      )
                    }
                  />
                  {o}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor={`override-reason-${prospectId}`} className="block text-[0.8125rem] text-graphite">
              Reason
            </label>
            <input
              id={`override-reason-${prospectId}`}
              value={reason}
              maxLength={300}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. The About page describes quoting done by hand from spreadsheets"
              className="mt-1 w-full rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] focus:border-ink focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-sm bg-ink px-3 py-1.5 text-[0.8125rem] font-medium text-on-ink transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save override"}
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
            Override opportunities
          </button>
          {overridden ? (
            <button type="button" disabled={pending} onClick={clear} className={LINK}>
              {pending ? "Clearing…" : "Clear override"}
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
