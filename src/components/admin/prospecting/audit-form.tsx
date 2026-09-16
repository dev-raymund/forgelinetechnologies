"use client";

import { useState, useTransition } from "react";
import { requestAudit } from "@/lib/prospecting/actions";

const field =
  "mt-1.5 w-full rounded-sm border border-rule-strong bg-white px-3 py-2.5 text-[0.9375rem] focus:border-ink focus:outline-none";

export function AuditForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(formData) =>
        start(async () => {
          const result = await requestAudit(formData);
          if (result.status === "error") setError(result.message);
        })
      }
      className="max-w-[42rem] rounded-sm border border-rule bg-white p-5 md:p-6"
    >
      {error ? (
        <p role="alert" className="mb-5 border-l-2 border-accent bg-paper px-3 py-2 text-[0.875rem]">
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="prospecting-url" className="text-[0.875rem] font-medium">
          Website URL
        </label>
        <input
          id="prospecting-url"
          name="url"
          type="url"
          required
          inputMode="url"
          placeholder="https://example.com"
          autoComplete="url"
          className={`${field} font-mono`}
        />
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
          Enter one public HTTP or HTTPS URL. The audit reads the bounded HTML
          response and headers only; it does not sign in, submit forms, or
          contact the business.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-sm bg-accent px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
      >
        {pending ? "Queueing audit…" : "Run website audit"}
      </button>
    </form>
  );
}
