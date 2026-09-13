"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addInquiryNote,
  deleteInquiry,
  setInquiryStatus,
} from "@/lib/admin/inquiry-actions";
import { INQUIRY_STATUSES } from "@/lib/admin/inquiry-statuses";

/**
 * The interactive parts of an enquiry.
 *
 * One component with two modes rather than two components, because both share
 * the same pending/error handling and the same server actions. The server
 * re-authorises every call regardless of which buttons rendered.
 */
export function InquiryControls({
  id,
  status,
  canDelete,
  mode,
}: {
  id: number;
  status: string;
  canDelete: boolean;
  mode: "status" | "notes";
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  const run = (fn: (fd: FormData) => Promise<{ ok: boolean; error?: string }>, fd: FormData) =>
    start(async () => {
      const r = await fn(fd);
      setError(r.ok ? null : (r.error ?? "That did not work."));
      if (r.ok) router.refresh();
    });

  const problem = error ? (
    <p role="alert" className="mt-3 border-l-2 border-accent bg-paper px-3 py-2 text-[0.875rem]">
      {error}
    </p>
  ) : null;

  if (mode === "notes") {
    return (
      <>
        <form
          action={(fd) => {
            fd.set("id", String(id));
            run(addInquiryNote, fd);
            (document.getElementById(`note-${id}`) as HTMLTextAreaElement | null)?.form?.reset();
          }}
          className="mt-4"
        >
          <label htmlFor={`note-${id}`} className="sr-only">
            Add a note
          </label>
          <textarea
            id={`note-${id}`}
            name="body"
            rows={3}
            required
            placeholder="What happened, what was agreed, what is next."
            className="w-full rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.9375rem] focus:border-ink focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-sm bg-ink px-4 py-2 text-[0.875rem] font-medium text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Add note"}
          </button>
        </form>
        {problem}
      </>
    );
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {INQUIRY_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={pending || s === status}
            onClick={() => {
              const fd = new FormData();
              fd.set("id", String(id));
              fd.set("status", s);
              run(setInquiryStatus, fd);
            }}
            className={`rounded-sm px-3 py-1.5 font-mono text-micro transition-colors ${
              s === status
                ? "bg-ink text-white"
                : "border border-rule-strong bg-white text-muted hover:bg-black/[0.04]"
            } disabled:cursor-default`}
          >
            {s}
          </button>
        ))}
      </div>
      {problem}

      {canDelete ? (
        <div className="mt-6 border-t border-rule pt-4">
          {confirming ? (
            <div>
              {/* Two steps, never one click. A deleted enquiry is a lost lead
                  and there is nowhere to recover it from. */}
              <p className="text-[0.875rem] text-graphite">
                Delete this enquiry permanently? This cannot be undone.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("id", String(id));
                    start(async () => {
                      const r = await deleteInquiry(fd);
                      if (r.ok) router.push("/admin/inquiries");
                      else setError(r.error ?? "That did not work.");
                    });
                  }}
                  className="rounded-sm bg-accent px-4 py-2 text-[0.875rem] font-medium text-white disabled:opacity-60"
                >
                  {pending ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-sm border border-rule-strong px-4 py-2 text-[0.875rem] font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-[0.875rem] text-muted underline decoration-rule-strong underline-offset-4 hover:text-graphite"
            >
              Delete enquiry
            </button>
          )}
        </div>
      ) : null}
    </>
  );
}
