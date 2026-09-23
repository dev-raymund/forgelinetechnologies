"use client";

import { useState, useTransition } from "react";
import { generateProspectOutreach, type ProspectOutreachResult } from "@/lib/prospecting/actions";

const BUTTON =
  "rounded-sm border border-rule-strong px-4 py-2 text-[0.875rem] font-medium transition-colors hover:border-ink focus:border-ink focus:outline-none disabled:opacity-60";
const PRIMARY =
  "rounded-sm bg-accent px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-accent-deep disabled:opacity-60";

/**
 * Outreach for a saved prospect.
 *
 * Generating a draft changes nothing about the prospect: no status moves, no
 * opportunity is rewritten, and the draft itself is not stored. The person
 * copies it and sends it from their own mail client.
 */
export function ProspectOutreach({ prospectId, contactEmail }: { prospectId: number; contactEmail: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ProspectOutreachResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  function generate() {
    start(async () => {
      setCopied(false);
      setCopyError(null);
      setResult(await generateProspectOutreach(prospectId));
    });
  }

  async function copy(body: string) {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopyError("Copying is not available here. Select the message and copy it manually.");
    }
  }

  return (
    <section className="rounded-sm border border-rule bg-white p-5">
      <h2 className="text-[1.0625rem] font-semibold">Outreach</h2>
      <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
        Reads the homepage again so the email cites what the site shows now.
        Nothing is sent, stored, or moved in the pipeline.
      </p>

      <button type="button" onClick={generate} disabled={pending} className={`mt-4 ${PRIMARY}`}>
        {pending ? "Reading the website…" : result ? "Generate again" : "Generate outreach"}
      </button>
      {pending ? (
        <p role="status" className="mt-3 text-[0.875rem] text-muted">
          Reading the website…
        </p>
      ) : null}

      {result?.status === "error" ? (
        <p role="alert" className="mt-4 border-l-2 border-accent bg-paper px-3 py-2 text-[0.875rem]">
          {result.message}
        </p>
      ) : null}

      {result?.status === "skip" ? (
        <p className="mt-4 text-[0.875rem] leading-relaxed text-muted">{result.reason}</p>
      ) : null}

      {result?.status === "draft" ? (
        <div className="mt-5 border-t border-rule pt-4">
          {result.humanChoiceDiffers ? (
            <p className="mb-4 border-l-2 border-accent bg-paper px-3 py-2 text-[0.8125rem] leading-relaxed">
              This prospect&rsquo;s opportunity was set by hand. The site now reads
              as <strong>{result.opportunity}</strong>, and the draft below follows
              what the site shows. Your saved choice has not been changed.
            </p>
          ) : null}

          <h3 className="font-mono text-micro text-faint">Subject</h3>
          <p className="mt-1 text-[0.9375rem] font-medium text-graphite">{result.subject}</p>

          <h3 className="mt-5 font-mono text-micro text-faint">Message</h3>
          <div className="mt-1 whitespace-pre-wrap rounded-sm border border-rule bg-paper px-4 py-3 text-[0.9375rem] leading-relaxed text-graphite">
            {result.body}
          </div>

          <h3 className="mt-5 font-mono text-micro text-faint">Contact</h3>
          <p className="mt-1 text-[0.875rem] text-muted">
            {contactEmail || "No contact email recorded."}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => copy(result.body)} className={BUTTON}>
              Copy email
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
      ) : null}
    </section>
  );
}
