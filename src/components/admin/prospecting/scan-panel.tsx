"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { analyzeWebsite, saveProspect } from "@/lib/prospecting/actions";
import { outreachFromView, type OutreachDraft } from "@/lib/prospecting/outreach";
import type { ScanView } from "@/lib/prospecting/scan-view";

/**
 * The prospecting screen: paste a website, read one answer.
 *
 * Every decision this renders was made on the server — the opportunity by
 * `detectOpportunity`, the wording by `opportunity.ts`, the observation lines
 * by `findings-summary.ts`, and the shape by `toScanView`. Nothing here reads
 * a finding or reaches a conclusion, and `reason` and `evidence` are printed
 * exactly as supplied. That is deliberate: those sentences are careful about
 * what the scan can and cannot claim, and a component that rephrased them
 * would be where a claim the evidence does not support gets introduced.
 */

const FIELD =
  "mt-1.5 w-full rounded-sm border border-rule-strong bg-white px-3 py-2.5 text-[0.9375rem] focus:border-ink focus:outline-none";
const PRIMARY =
  "rounded-sm bg-accent px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-accent-deep disabled:opacity-60";
const SECONDARY =
  "rounded-sm border border-rule-strong px-4 py-2 text-[0.875rem] font-medium transition-colors hover:border-ink focus:border-ink focus:outline-none";

export function ScanPanel() {
  const [pending, start] = useTransition();
  const [view, setView] = useState<ScanView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(formData: FormData) {
    // `useTransition`'s pending flag also disables the button, so a second
    // submit cannot start a second scan while one is in flight.
    start(async () => {
      setError(null);
      const result = await analyzeWebsite(formData);
      if (result.status === "error") {
        setView(null);
        setError(result.message);
        return;
      }
      setView(result.view);
    });
  }

  function reset() {
    setView(null);
    setError(null);
    inputRef.current?.focus();
  }

  if (view) return <ScanResult view={view} onReset={reset} />;

  return (
    <form action={handleSubmit} className="max-w-[42rem] rounded-sm border border-rule bg-white p-5 md:p-6">
      {error ? (
        <div role="alert" className="mb-5 border-l-2 border-accent bg-paper px-3 py-3">
          <p className="text-[0.875rem] font-medium">Unable to analyze this website.</p>
          <p className="mt-1 text-[0.875rem] text-muted">{error}</p>
        </div>
      ) : null}

      <div>
        <label htmlFor="prospecting-url" className="text-[0.875rem] font-medium">
          Website URL
        </label>
        <input
          id="prospecting-url"
          ref={inputRef}
          name="url"
          type="text"
          required
          inputMode="url"
          autoComplete="url"
          placeholder="example.com"
          aria-describedby="prospecting-url-help"
          className={`${FIELD} font-mono`}
        />
        <p id="prospecting-url-help" className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
          The homepage is read once, unauthenticated, and nothing is sent to the
          business. Enter the address with or without <code className="font-mono">https://</code>.
        </p>
      </div>

      <button type="submit" disabled={pending} className={`mt-6 ${PRIMARY}`}>
        {pending ? "Analyzing website…" : "Analyze website"}
      </button>
      {pending ? (
        <p role="status" className="mt-3 text-[0.875rem] text-muted">
          Analyzing website…
        </p>
      ) : null}
    </form>
  );
}

function ScanResult({ view, onReset }: { view: ScanView; onReset: () => void }) {
  return (
    <div className="max-w-[48rem] space-y-6">
      <section className="rounded-sm border border-rule bg-white p-5">
        <h2 className="text-[1.0625rem] font-semibold">Website</h2>
        <p className="mt-3 text-[1.0625rem] font-medium text-graphite">{view.siteName}</p>
        <p className="font-mono text-[0.8125rem] text-muted">{view.domain}</p>

        <dl className="mt-4 grid gap-4 text-[0.875rem] sm:grid-cols-2">
          <Fact label="Requested URL" value={view.requestedUrl} mono />
          <Fact
            label="Final URL"
            value={view.finalUrl ?? "Not reached"}
            mono
            note={view.redirected ? "Redirected" : undefined}
          />
          <Fact label="HTTP status" value={view.httpStatus === null ? "Not reached" : String(view.httpStatus)} />
          <Fact label="HTTPS" value={view.https ? "Enabled" : "Not enabled"} />
        </dl>
      </section>

      {view.quickFindings.length ? (
        <section className="rounded-sm border border-rule bg-white p-5">
          <h2 className="text-[1.0625rem] font-semibold">Quick findings</h2>
          <ul className="mt-3 space-y-1.5 text-[0.875rem] text-muted">
            {view.quickFindings.map((line) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden="true" className="text-faint">
                  •
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-sm border border-rule bg-white p-5">
        <h2 className="font-mono text-micro text-faint">Potential opportunity</h2>
        <p className="mt-2 text-[1.5rem] font-semibold leading-tight text-graphite">{view.opportunity}</p>

        {view.service ? (
          <div className="mt-5 border-t border-rule pt-4">
            <h3 className="font-mono text-micro text-faint">Recommended service</h3>
            <p className="mt-1 text-[1.0625rem] font-medium text-graphite">{view.service}</p>
          </div>
        ) : null}

        <div className="mt-5 border-l-2 border-accent bg-paper px-4 py-3">
          <h3 className="font-mono text-micro text-faint">Why</h3>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-graphite">{view.reason}</p>
        </div>

        {view.evidence.length ? (
          <div className="mt-5">
            <h3 className="font-mono text-micro text-faint">Evidence</h3>
            <ul className="mt-2 space-y-1.5 text-[0.875rem] text-muted">
              {view.evidence.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden="true" className="text-faint">
                    •
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <SaveProspect view={view} />

      <Outreach view={view} />

      <button type="button" onClick={onReset} className={SECONDARY}>
        Analyze another website
      </button>
    </div>
  );
}

function Fact({
  label,
  value,
  mono,
  note,
}: {
  label: string;
  value: string;
  mono?: boolean;
  note?: string;
}) {
  return (
    <div>
      <dt className="font-mono text-micro text-faint">{label}</dt>
      <dd className={`mt-1 break-all text-graphite ${mono ? "font-mono text-[0.8125rem]" : ""}`}>
        {value}
        {note ? <span className="ml-2 font-mono text-micro text-muted">{note}</span> : null}
      </dd>
    </div>
  );
}

/**
 * The outreach step.
 *
 * `outreachFromView` is a pure deterministic function, so it runs here rather
 * than through a server action: there is nothing to look up, nothing to store,
 * and a round trip would only add latency to a template.
 *
 * When it declines to write one — No Clear Opportunity, Needs Manual Review,
 * or nothing specific to cite — the reason is shown instead of a button. That
 * is the useful answer: it tells the reader this prospect is not one to
 * contact yet, rather than leaving a missing button to interpret.
 */
function Outreach({ view }: { view: ScanView }) {
  const [open, setOpen] = useState(false);
  const result = outreachFromView(view);

  if (result.kind === "skip") {
    return (
      <section className="rounded-sm border border-dashed border-rule-strong bg-white p-5">
        <h2 className="text-[1.0625rem] font-semibold">Outreach</h2>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">{result.reason}</p>
      </section>
    );
  }

  return (
    <section className="rounded-sm border border-rule bg-white p-5">
      <h2 className="text-[1.0625rem] font-semibold">Outreach</h2>
      {open ? (
        <OutreachDraftView draft={result.draft} onHide={() => setOpen(false)} />
      ) : (
        <>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">
            A short permission-based email you review and send yourself. Nothing
            is sent from here.
          </p>
          <button type="button" onClick={() => setOpen(true)} className={`mt-4 ${PRIMARY}`}>
            Generate outreach
          </button>
        </>
      )}
    </section>
  );
}

function OutreachDraftView({ draft, onHide }: { draft: OutreachDraft; onHide: () => void }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  async function copy() {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(draft.body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      // Denied permission, an insecure origin, or an older browser. The draft
      // is on screen and selectable either way, so this is a note, not a
      // failure.
      setCopyError("Copying is not available here. Select the message and copy it manually.");
    }
  }

  return (
    <div className="mt-4">
      <h3 className="font-mono text-micro text-faint">Subject</h3>
      <p className="mt-1 text-[0.9375rem] font-medium text-graphite">{draft.subject}</p>

      <h3 className="mt-5 font-mono text-micro text-faint">Message</h3>
      <div className="mt-1 whitespace-pre-wrap rounded-sm border border-rule bg-paper px-4 py-3 text-[0.9375rem] leading-relaxed text-graphite">
        {draft.body}
      </div>

      <h3 className="mt-5 font-mono text-micro text-faint">Contact</h3>
      <p className="mt-1 text-[0.875rem] text-muted">No contact email recorded.</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={copy} className={SECONDARY}>
          Copy email
        </button>
        <button type="button" onClick={onHide} className={SECONDARY}>
          Hide draft
        </button>
        <span role="status" aria-live="polite" className="text-[0.875rem] text-muted">
          {copied ? "Copied to clipboard." : ""}
        </span>
      </div>
      {copyError ? (
        <p role="alert" className="mt-2 text-[0.875rem] text-muted">
          {copyError}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Saves the analysed site as a prospect.
 *
 * Sends only what the scan already established — the server never fetches the
 * site again. A domain already in the table is reported back with a link to
 * it, rather than overwritten or duplicated.
 */
function SaveProspect({ view }: { view: ScanView }) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState<{ id: number; duplicate: boolean; name?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function save() {
    start(async () => {
      setError(null);
      const result = await saveProspect({
        companyName: view.siteName,
        websiteUrl: view.finalUrl ?? view.requestedUrl,
        opportunity: view.opportunity,
        service: view.service ?? "",
        opportunityReason: view.reason,
      });
      if (result.status === "error") setError(result.message);
      else if (result.status === "duplicate") {
        setSaved({ id: result.id, duplicate: true, name: result.companyName });
      } else setSaved({ id: result.id, duplicate: false });
    });
  }

  if (saved) {
    return (
      <section className="rounded-sm border border-rule bg-white p-5">
        <h2 className="text-[1.0625rem] font-semibold">Prospect</h2>
        <p className="mt-2 text-[0.9375rem] text-graphite">
          {saved.duplicate
            ? "This website is already in your prospects."
            : `Saved. ${view.siteName} is now at To Contact.`}
        </p>
        <Link
          href={`/admin/prospecting/prospects/${saved.id}`}
          className="mt-3 inline-block text-[0.875rem] font-medium underline decoration-rule-strong underline-offset-4 hover:decoration-accent"
        >
          {saved.duplicate ? `Open ${saved.name}` : "Open the prospect"}
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-sm border border-rule bg-white p-5">
      <h2 className="text-[1.0625rem] font-semibold">Prospect</h2>
      <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
        Saves this result and starts the prospect at To Contact.
      </p>
      <button type="button" onClick={save} disabled={pending} className={`mt-4 ${PRIMARY}`}>
        {pending ? "Saving…" : "Save prospect"}
      </button>
      {error ? (
        <p role="alert" className="mt-3 border-l-2 border-accent bg-paper px-3 py-2 text-[0.875rem]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
