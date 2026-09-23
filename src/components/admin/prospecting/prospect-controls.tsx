"use client";

import { useState, useTransition } from "react";
import {
  reanalyzeProspect,
  setProspectOpportunity,
  setProspectStatus,
  setProspectSuppression,
  type ReanalyzeResult,
} from "@/lib/prospecting/actions";
import {
  OPPORTUNITY_VALUES,
  PROSPECT_STATUSES,
  SERVICE_FOR_OPPORTUNITY,
  type ForgelineService,
} from "@/lib/prospecting/types";

/**
 * The three things a person changes on a saved prospect: where it sits in the
 * pipeline, what the opportunity is, and whether the business has opted out.
 *
 * Every one of them is an explicit action. Nothing here moves a status as a
 * side effect of reading, generating or copying anything.
 *
 * The server re-validates all of it; the `<select>` options only save a round
 * trip and are not the boundary.
 */

const SELECT =
  "mt-1.5 w-full rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.9375rem] focus:border-ink focus:outline-none";
const FIELD =
  "mt-1.5 w-full rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] focus:border-ink focus:outline-none";
const BUTTON =
  "rounded-sm border border-rule-strong px-4 py-2 text-[0.875rem] font-medium transition-colors hover:border-ink focus:border-ink focus:outline-none disabled:opacity-60";

/** Every service the vocabulary defines, for the human-selected opportunities. */
const SERVICES = [...new Set(Object.values(SERVICE_FOR_OPPORTUNITY).filter((s): s is ForgelineService => s !== ""))];

function Error({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="mt-2 text-[0.8125rem] text-muted">
      {message}
    </p>
  ) : null;
}

export function StatusControl({ prospectId, status }: { prospectId: number; status: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState(status);

  function change(next: string) {
    const previous = value;
    setValue(next);
    start(async () => {
      setError(null);
      const result = await setProspectStatus(prospectId, next);
      if ("error" in result) {
        setValue(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <label htmlFor={`status-${prospectId}`} className="text-[0.875rem] font-medium">
        Status
      </label>
      <select
        id={`status-${prospectId}`}
        value={value}
        disabled={pending}
        onChange={(event) => change(event.target.value)}
        className={SELECT}
      >
        {/* A value the migration carried over but the new vocabulary does not
            define still renders, so nothing looks silently blank. */}
        {PROSPECT_STATUSES.includes(value as never) ? null : <option value={value}>{value}</option>}
        {PROSPECT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <Error message={error} />
    </div>
  );
}

export function OpportunityControl({
  prospectId,
  opportunity,
  service,
}: {
  prospectId: number;
  opportunity: string;
  service: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState(opportunity || "SEO");
  const [chosenService, setChosenService] = useState(service);
  const [reason, setReason] = useState("");

  function save() {
    start(async () => {
      setError(null);
      const result = await setProspectOpportunity(prospectId, chosen, chosenService, reason);
      if ("error" in result) setError(result.error);
      else setOpen(false);
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`mt-4 ${BUTTON}`}>
        Change opportunity
      </button>
    );
  }

  return (
    <div className="mt-4 border-t border-rule pt-4">
      <label htmlFor={`opportunity-${prospectId}`} className="text-[0.875rem] font-medium">
        Opportunity
      </label>
      <select
        id={`opportunity-${prospectId}`}
        value={chosen}
        onChange={(event) => {
          const next = event.target.value;
          setChosen(next);
          // A starting point only — the person can pick any service, or none.
          setChosenService(SERVICE_FOR_OPPORTUNITY[next as keyof typeof SERVICE_FOR_OPPORTUNITY] ?? "");
        }}
        className={SELECT}
      >
        {OPPORTUNITY_VALUES.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      <label htmlFor={`service-${prospectId}`} className="mt-4 block text-[0.875rem] font-medium">
        Service
      </label>
      <select
        id={`service-${prospectId}`}
        value={chosenService}
        onChange={(event) => setChosenService(event.target.value)}
        className={SELECT}
      >
        <option value="">No service</option>
        {SERVICES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <label htmlFor={`reason-${prospectId}`} className="mt-4 block text-[0.875rem] font-medium">
        Reason <span className="font-normal text-muted">(optional)</span>
      </label>
      <textarea
        id={`reason-${prospectId}`}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={3}
        placeholder="Why this opportunity, in your own words."
        className={FIELD}
      />

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={save} disabled={pending} className={BUTTON}>
          {pending ? "Saving…" : "Save opportunity"}
        </button>
        <button type="button" onClick={() => setOpen(false)} disabled={pending} className={BUTTON}>
          Cancel
        </button>
      </div>
      <Error message={error} />
    </div>
  );
}

export function SuppressionControl({
  prospectId,
  suppressed,
}: {
  prospectId: number;
  suppressed: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  function run(value: string | null) {
    start(async () => {
      setError(null);
      const result = await setProspectSuppression(prospectId, value);
      if ("error" in result) setError(result.error);
      else setReason("");
    });
  }

  if (suppressed) {
    return (
      <div>
        <button type="button" onClick={() => run(null)} disabled={pending} className={BUTTON}>
          {pending ? "Working…" : "Lift suppression"}
        </button>
        <Error message={error} />
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={`suppress-${prospectId}`} className="text-[0.875rem] font-medium">
        Reason
      </label>
      <input
        id={`suppress-${prospectId}`}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="They asked not to be contacted"
        className={FIELD}
      />
      <button
        type="button"
        onClick={() => run(reason)}
        disabled={pending || !reason.trim()}
        className={`mt-3 ${BUTTON}`}
      >
        {pending ? "Working…" : "Suppress"}
      </button>
      <Error message={error} />
    </div>
  );
}

/**
 * Re-reads the website with the quick scan, never the full audit.
 *
 * The fresh result is always shown. It is only written when the current
 * opportunity was system-detected; a person's choice is kept until they ask
 * for it to be replaced, so a re-scan cannot quietly undo a decision.
 */
export function ReanalyzeControl({ prospectId }: { prospectId: number }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ReanalyzeResult | null>(null);

  function run(replaceHumanChoice: boolean) {
    start(async () => {
      setResult(await reanalyzeProspect(prospectId, replaceHumanChoice));
    });
  }

  return (
    <div>
      <button type="button" onClick={() => run(false)} disabled={pending} className={BUTTON}>
        {pending ? "Reading the website…" : "Analyze website"}
      </button>

      {result?.status === "error" ? (
        <p role="alert" className="mt-3 border-l-2 border-accent bg-paper px-3 py-2 text-[0.875rem]">
          {result.message}
        </p>
      ) : null}

      {result?.status === "ok" ? (
        <div className="mt-4 border-t border-rule pt-4 text-[0.875rem]">
          <p className="font-mono text-micro text-faint">The website now reads as</p>
          <p className="mt-1 text-[1.0625rem] font-semibold text-graphite">{result.view.opportunity}</p>
          <p className="mt-2 leading-relaxed text-muted">{result.view.reason}</p>

          {result.humanChoiceKept ? (
            <div className="mt-4 border-l-2 border-accent bg-paper px-3 py-2">
              <p className="leading-relaxed">
                Your own choice of opportunity has been kept. Replace it only if you want
                the detected one instead.
              </p>
              <button
                type="button"
                onClick={() => run(true)}
                disabled={pending}
                className={`mt-3 ${BUTTON}`}
              >
                Replace with the detected opportunity
              </button>
            </div>
          ) : (
            <p className="mt-3 font-mono text-micro text-faint">
              {result.applied ? "Saved to this prospect." : "Not saved."}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
