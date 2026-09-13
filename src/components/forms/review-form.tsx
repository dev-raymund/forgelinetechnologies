"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { submitReview, type ReviewState } from "@/lib/review";

const initial: ReviewState = { status: "idle" };

const field =
  "w-full rounded-sm border bg-white px-3 py-2.5 text-[0.9375rem] text-graphite focus:border-ink focus:outline-none";

/**
 * Client review form.
 *
 * Mirrors the contact form's behaviour deliberately: submitted values are
 * echoed back on failure, because React resets an uncontrolled form once its
 * action resolves and retyping a considered review is exactly the moment
 * someone gives up.
 */
export function ReviewForm({
  projects,
}: {
  projects: { id: number; title: string }[];
}) {
  const [state, action, pending] = useActionState(submitReview, initial);
  const uid = useId();
  const id = (n: string) => `${uid}-${n}`;
  const statusRef = useRef<HTMLDivElement>(null);

  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  const err = (n: keyof typeof errors) => errors[n];
  const sent = state.status === "error" ? state.values : undefined;
  const val = (n: string) => sent?.[n] ?? "";

  useEffect(() => {
    if (state.status === "error") statusRef.current?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <div className="rounded-sm border border-rule bg-white px-6 py-8">
        <h2 className="text-subtitle font-semibold text-graphite">
          {state.message}
        </h2>
        {/* No timeline is promised, because none can be kept — and nothing is
            implied to be live, because nothing is. */}
        <p className="mt-4 max-w-[54ch] text-[0.9375rem] leading-relaxed text-muted">
          Your review has been received. We read every one, and it will be
          reviewed before anything is published. Nothing appears on the site
          until then.
        </p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {state.status === "error" ? (
        <div
          ref={statusRef}
          tabIndex={-1}
          role="alert"
          className="border-l-2 border-accent bg-white px-4 py-3 text-[0.9375rem] text-graphite"
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor={id("name")} className="text-[0.9375rem] font-medium text-graphite">
            Your name <span className="text-[0.75rem] font-normal text-muted">Required</span>
          </label>
          <input
            id={id("name")}
            name="name"
            required
            autoComplete="name"
            defaultValue={val("name")}
            aria-invalid={err("name") ? true : undefined}
            className={`${field} mt-2 ${err("name") ? "border-accent" : "border-rule-strong"}`}
          />
          {err("name") ? <Err>{err("name")}</Err> : null}
        </div>

        <div className="min-w-0">
          <label htmlFor={id("company")} className="text-[0.9375rem] font-medium text-graphite">
            Company <span className="text-[0.75rem] font-normal text-faint">Optional</span>
          </label>
          <input
            id={id("company")}
            name="company"
            autoComplete="organization"
            defaultValue={val("company")}
            className={`${field} mt-2 border-rule-strong`}
          />
        </div>

        <div className="min-w-0">
          <label htmlFor={id("email")} className="text-[0.9375rem] font-medium text-graphite">
            Email <span className="text-[0.75rem] font-normal text-muted">Required</span>
          </label>
          <input
            id={id("email")}
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={val("email")}
            aria-invalid={err("email") ? true : undefined}
            aria-describedby={id("email-hint")}
            className={`${field} mt-2 ${err("email") ? "border-accent" : "border-rule-strong"}`}
          />
          {err("email") ? (
            <Err>{err("email")}</Err>
          ) : (
            <p id={id("email-hint")} className="mt-2 text-[0.8125rem] text-muted">
              Never published. Used only to reply.
            </p>
          )}
        </div>

        <div className="min-w-0">
          <label htmlFor={id("projectId")} className="text-[0.9375rem] font-medium text-graphite">
            Project <span className="text-[0.75rem] font-normal text-faint">Optional</span>
          </label>
          <select
            id={id("projectId")}
            name="projectId"
            key={val("projectId")}
            defaultValue={val("projectId")}
            className={`${field} mt-2 appearance-none border-rule-strong`}
          >
            <option value="">Not about a specific project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="text-[0.9375rem] font-medium text-graphite">
          Rating <span className="text-[0.75rem] font-normal text-muted">Required</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="cursor-pointer rounded-sm border border-rule-strong bg-white px-4 py-2 text-[0.9375rem] text-graphite has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white"
            >
              <input
                type="radio"
                name="rating"
                value={n}
                required
                defaultChecked={val("rating") === String(n)}
                className="sr-only"
              />
              {n}
            </label>
          ))}
        </div>
        {err("rating") ? <Err>{err("rating")}</Err> : null}
      </fieldset>

      <div>
        <label htmlFor={id("body")} className="text-[0.9375rem] font-medium text-graphite">
          Your review <span className="text-[0.75rem] font-normal text-muted">Required</span>
        </label>
        <textarea
          id={id("body")}
          name="body"
          rows={6}
          required
          defaultValue={val("body")}
          placeholder="What did we build, and how did working together go?"
          aria-invalid={err("body") ? true : undefined}
          className={`${field} mt-2 resize-y ${err("body") ? "border-accent" : "border-rule-strong"}`}
        />
        {err("body") ? (
          <Err>{err("body")}</Err>
        ) : (
          <p className="mt-2 text-[0.8125rem] text-muted">
            A couple of sentences is plenty — 20 characters minimum.
          </p>
        )}
      </div>

      <div>
        <label className="flex max-w-[62ch] items-start gap-3 text-[0.9375rem] leading-relaxed text-graphite">
          <input
            type="checkbox"
            name="permissionToPublish"
            required
            className="mt-1 size-4 shrink-0 accent-[#0d2350]"
          />
          <span>
            You may publish this review, with my name and company, on the
            Forgeline website.
          </span>
        </label>
        {err("permissionToPublish") ? <Err>{err("permissionToPublish")}</Err> : null}
      </div>

      {/* Honeypot. Never shown, never announced, never focusable. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-px w-px overflow-hidden [clip-path:inset(50%)] [white-space:nowrap]"
      >
        <label htmlFor={id("website")}>Website</label>
        <input id={id("website")} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-sm bg-accent px-6 py-3.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send review"}
        </button>
        <p className="text-[0.8125rem] text-muted">
          Nothing is published until we have read it.
        </p>
      </div>
    </form>
  );
}

function Err({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 text-[0.8125rem] font-medium text-graphite">{children}</p>
  );
}
