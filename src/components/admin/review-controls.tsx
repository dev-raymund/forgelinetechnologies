"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteReview,
  editReview,
  setReviewStatus,
  type ReviewResult,
} from "@/lib/admin/review-actions";

const field =
  "mt-1.5 w-full rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.9375rem] focus:border-ink focus:outline-none";

export function ReviewControls({
  id,
  status,
  name,
  company,
  body,
  permissionToPublish,
  canDelete,
}: {
  id: number;
  status: string;
  name: string;
  company: string;
  body: string;
  permissionToPublish: boolean;
  canDelete: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  const run = (fn: (fd: FormData) => Promise<ReviewResult>, fd: FormData) =>
    start(async () => {
      const r = await fn(fd);
      if (!r.ok) {
        setError(r.error ?? "That did not work.");
        return;
      }
      setError(null);
      setEditing(false);
      setConfirming(false);
      router.refresh();
    });

  const move = (to: string) => {
    const fd = new FormData();
    fd.set("id", String(id));
    fd.set("status", to);
    run(setReviewStatus, fd);
  };

  /* Publishing is the only action gated on consent, and it is gated in the
     action too — this just avoids offering a button that will refuse. */
  const transitions: { to: string; label: string; disabled?: boolean }[] = [
    { to: "approved", label: "Approve" },
    { to: "published", label: "Publish", disabled: !permissionToPublish },
    { to: "pending", label: "Back to pending" },
    { to: "rejected", label: "Reject" },
  ].filter((t) => t.to !== status);

  return (
    <>
      {error ? (
        <p role="alert" className="mt-3 border-l-2 border-accent bg-paper px-3 py-2 text-[0.875rem]">
          {error}
        </p>
      ) : null}

      {editing ? (
        <form
          action={(fd) => {
            fd.set("id", String(id));
            run(editReview, fd);
          }}
          className="mt-4 border-t border-rule pt-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`rn-${id}`} className="text-[0.875rem] font-medium">Name</label>
              <input id={`rn-${id}`} name="name" defaultValue={name} required className={field} />
            </div>
            <div>
              <label htmlFor={`rc-${id}`} className="text-[0.875rem] font-medium">Company</label>
              <input id={`rc-${id}`} name="company" defaultValue={company} className={field} />
            </div>
          </div>
          <div className="mt-3">
            <label htmlFor={`rb-${id}`} className="text-[0.875rem] font-medium">Review</label>
            <textarea id={`rb-${id}`} name="body" rows={5} defaultValue={body} required className={field} />
            <p className="mt-1.5 text-[0.8125rem] text-muted">
              Typos and clarity only. The rating cannot be changed — it is
              theirs, not ours.
            </p>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-sm bg-ink px-4 py-2 text-[0.875rem] font-medium text-white disabled:opacity-60"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-sm border border-rule-strong px-4 py-2 text-[0.875rem] font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-rule pt-4">
          {transitions.map((t) => (
            <button
              key={t.to}
              type="button"
              disabled={pending || t.disabled}
              title={t.disabled ? "The reviewer did not give permission to publish" : undefined}
              onClick={() => move(t.to)}
              className={`rounded-sm px-3 py-1.5 text-[0.875rem] font-medium transition-colors ${
                t.to === "published"
                  ? "bg-accent text-white hover:bg-accent-deep"
                  : "border border-rule-strong bg-white text-graphite hover:bg-black/[0.04]"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[0.875rem] text-muted underline decoration-rule-strong underline-offset-4 hover:text-graphite"
          >
            Edit
          </button>

          {canDelete ? (
            confirming ? (
              <span className="flex items-center gap-2">
                <span className="text-[0.875rem]">Delete permanently?</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("id", String(id));
                    run(deleteReview, fd);
                  }}
                  className="rounded-sm bg-accent px-3 py-1.5 text-[0.875rem] font-medium text-white"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-sm border border-rule-strong px-3 py-1.5 text-[0.875rem] font-medium"
                >
                  No
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="text-[0.875rem] text-muted underline decoration-rule-strong underline-offset-4 hover:text-graphite"
              >
                Delete
              </button>
            )
          ) : null}
        </div>
      )}
    </>
  );
}
