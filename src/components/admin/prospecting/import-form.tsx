"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { previewImport, commitImport } from "@/lib/prospecting/actions";
import type { ImportPreview, ImportResult } from "@/lib/prospecting/actions";
import { Empty } from "@/components/admin/ui";

const field =
  "mt-1.5 w-full rounded-sm border border-rule-strong bg-white px-3 py-2.5 text-[0.9375rem] focus:border-ink focus:outline-none";

export function ImportForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Extract<ImportPreview, { status: "ready" }> | null>(null);
  const [result, setResult] = useState<Extract<ImportResult, { status: "imported" }> | null>(null);
  const [csv, setCsv] = useState("");
  const [previewedCsv, setPreviewedCsv] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  /**
   * Both the textarea and the file upload funnel through here so that
   * editing OR re-uploading after a successful preview invalidates it: the
   * stale table (and its "Import N" count) must disappear rather than let a
   * later import silently ship text the reviewer never actually reviewed.
   */
  function applyCsvChange(next: string) {
    setCsv(next);
    if (preview && next !== previewedCsv) {
      setPreview(null);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    applyCsvChange(await file.text());
  }

  function handleCheck(formData: FormData) {
    const requestedCsv = csv;
    formData.set("csv", requestedCsv);
    setSourceUrl(String(formData.get("sourceUrl") ?? "").trim());
    start(async () => {
      setError(null);
      setResult(null);
      const outcome = await previewImport(formData);
      if (outcome.status === "error") {
        setPreview(null);
        setError(outcome.message);
        return;
      }
      setPreview(outcome);
      setPreviewedCsv(requestedCsv);
    });
  }

  function handleImport(formData: FormData) {
    formData.set("csv", previewedCsv);
    start(async () => {
      setError(null);
      const outcome = await commitImport(formData);
      if (outcome.status === "error") {
        setError(outcome.message);
        return;
      }
      setResult(outcome);
      setPreview(null);
    });
  }

  return (
    <div className="max-w-[56rem] space-y-6">
      <form
        action={handleCheck}
        className="rounded-sm border border-rule bg-white p-5 md:p-6"
      >
        {error ? (
          <p role="alert" className="mb-5 border-l-2 border-accent bg-paper px-3 py-2 text-[0.875rem]">
            {error}
          </p>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="import-source-name" className="text-[0.875rem] font-medium">
              Source name
            </label>
            <input
              id="import-source-name"
              name="sourceName"
              type="text"
              required
              placeholder="e.g. Chamber of commerce directory"
              className={field}
            />
          </div>
          <div>
            <label htmlFor="import-source-url" className="text-[0.875rem] font-medium">
              Source URL <span className="font-normal text-faint">(optional)</span>
            </label>
            <input
              id="import-source-url"
              name="sourceUrl"
              type="url"
              inputMode="url"
              placeholder="https://example.com/directory"
              className={`${field} font-mono`}
            />
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="import-file" className="text-[0.875rem] font-medium">
            Upload CSV <span className="font-normal text-faint">(optional)</span>
          </label>
          <input
            id="import-file"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="mt-1.5 block w-full text-[0.875rem]"
          />
        </div>

        <div className="mt-5">
          <label htmlFor="import-csv" className="text-[0.875rem] font-medium">
            CSV contents
          </label>
          <textarea
            id="import-csv"
            value={csv}
            onChange={(e) => applyCsvChange(e.target.value)}
            rows={10}
            placeholder="company,website,industry,country,location,contact,contact_source"
            className={`${field} font-mono text-[0.8125rem]`}
          />
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
            Paste CSV text or upload a file above. Required columns: company,
            website. Optional: industry, country, location, contact,
            contact_source.
          </p>
        </div>

        <button
          type="submit"
          disabled={pending || !csv.trim()}
          className="mt-6 rounded-sm bg-ink px-5 py-2.5 text-[0.9375rem] font-medium text-on-ink transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Checking…" : "Check file"}
        </button>
      </form>

      {preview ? (
        <form
          action={handleImport}
          className="rounded-sm border border-rule bg-white p-5 md:p-6"
        >
          <input type="hidden" name="sourceName" value={preview.sourceName} />
          <input type="hidden" name="sourceUrl" value={sourceUrl} />
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[1.0625rem] font-semibold">
              Valid rows <span className="font-mono text-micro font-normal text-faint">{preview.rows.length}</span>
            </h2>
            <span className="font-mono text-micro text-faint">Source: {preview.sourceName}</span>
          </div>

          {preview.rows.length === 0 ? (
            <Empty>No valid rows were found in this file.</Empty>
          ) : (
            <div className="overflow-x-auto rounded-sm border border-rule">
              <table className="w-full min-w-[44rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-rule">
                    {["Company", "Domain", "Industry", "Country", "Location", "Contact"].map((h) => (
                      <th key={h} scope="col" className="px-4 py-2.5 font-mono text-micro font-normal text-faint">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr key={row.domain} className="border-b border-rule last:border-b-0">
                      <td className="px-4 py-3 text-[0.9375rem] font-medium">{row.companyName}</td>
                      <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{row.domain}</td>
                      <td className="px-4 py-3 text-[0.875rem] text-muted">{row.industry || "—"}</td>
                      <td className="px-4 py-3 text-[0.875rem] text-muted">{row.country || "—"}</td>
                      <td className="px-4 py-3 text-[0.875rem] text-muted">{row.location || "—"}</td>
                      <td className="px-4 py-3 text-[0.875rem] text-muted">{row.contactChannel || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-7 flex items-baseline justify-between gap-2">
            <h2 className="text-[1.0625rem] font-semibold">
              Errors <span className="font-mono text-micro font-normal text-faint">{preview.errors.length}</span>
            </h2>
          </div>
          {preview.errors.length === 0 ? (
            <p className="mt-2 text-[0.875rem] text-muted">No row errors.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-sm border border-rule">
              <table className="w-full min-w-[28rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-rule">
                    {["Line", "Message"].map((h) => (
                      <th key={h} scope="col" className="px-4 py-2.5 font-mono text-micro font-normal text-faint">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.errors.map((err, index) => (
                    <tr key={`${err.line}-${index}`} className="border-b border-rule last:border-b-0">
                      <td className="px-4 py-3 font-mono text-[0.8125rem] text-faint">{err.line}</td>
                      <td className="px-4 py-3 text-[0.875rem] text-muted">{err.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            type="submit"
            disabled={pending || preview.rows.length === 0}
            className="mt-6 rounded-sm bg-accent px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
          >
            {pending ? "Importing…" : `Import ${preview.rows.length} prospects`}
          </button>
        </form>
      ) : null}

      {result ? (
        <div className="rounded-sm border border-rule bg-white p-5 md:p-6">
          <h2 className="text-[1.0625rem] font-semibold">Import complete</h2>
          <dl className="mt-4 grid grid-cols-3 gap-4 text-[0.875rem]">
            <div>
              <dt className="font-mono text-micro text-faint">Inserted</dt>
              <dd className="mt-1 font-mono text-[1.25rem] text-graphite">{result.inserted}</dd>
            </div>
            <div>
              <dt className="font-mono text-micro text-faint">Updated</dt>
              <dd className="mt-1 font-mono text-[1.25rem] text-graphite">{result.updated}</dd>
            </div>
            <div>
              <dt className="font-mono text-micro text-faint">Suppressed (skipped)</dt>
              <dd className="mt-1 font-mono text-[1.25rem] text-graphite">{result.skippedSuppressed}</dd>
            </div>
          </dl>
          <Link
            href="/admin/prospecting/prospects"
            className="mt-6 inline-block text-[0.9375rem] font-medium underline decoration-rule-strong underline-offset-4 hover:decoration-accent"
          >
            View prospects →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
