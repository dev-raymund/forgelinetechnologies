"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { submitInquiry, type InquiryState } from "@/app/actions/inquiry";
import { PROJECT_TYPES, BUDGETS } from "@/lib/validation/inquiry";

/**
 * The live design's lead form, unchanged in markup and classes — same
 * .lead-form / .row / .btn structure it has always had, so site.css styles it
 * exactly as before.
 *
 * Two differences from the static original: it posts to our own server action
 * instead of a third-party Formspree endpoint, and it reports pending / error
 * / success states inline. Option lists come from the validation module so the
 * <select>s and the validator can't drift apart.
 */
const initial: InquiryState = { status: "idle" };

export default function LeadForm() {
  const [state, action] = useActionState(submitInquiry, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
    if (state.status !== "idle") statusRef.current?.focus();
  }, [state]);

  const errors = state.status === "error" ? state.errors : undefined;

  return (
    <form ref={formRef} className="lead-form" action={action}>
      <div className="row">
        <label>
          Name
          <input
            type="text"
            name="name"
            placeholder="Your name"
            required
            aria-invalid={errors?.name ? true : undefined}
          />
          {errors?.name && <span className="field-error">{errors.name}</span>}
        </label>
        <label>
          Email
          <input
            type="email"
            name="email"
            placeholder="you@company.com"
            required
            aria-invalid={errors?.email ? true : undefined}
          />
          {errors?.email && <span className="field-error">{errors.email}</span>}
        </label>
      </div>

      <label>
        What do you need?
        <select name="product" defaultValue="">
          <option value="">Choose one</option>
          {PROJECT_TYPES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>

      <label>
        Budget range
        <select name="budget" defaultValue="">
          <option value="">Not sure yet</option>
          {BUDGETS.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </label>

      <label>
        Tell us about the project
        <textarea
          name="message"
          rows={4}
          placeholder="What are you building? A few lines on the goal, timeline, and any links."
          aria-invalid={errors?.message ? true : undefined}
        />
        {errors?.message && <span className="field-error">{errors.message}</span>}
      </label>

      {/* honeypot — the field name the original markup already used */}
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" style={{ display: "none" }} />

      <Submit />

      {state.status !== "idle" && (
        <p
          ref={statusRef}
          tabIndex={-1}
          role={state.status === "error" ? "alert" : "status"}
          className={state.status === "error" ? "form-status is-error" : "form-status is-ok"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-wide btn-lg" disabled={pending}>
      {pending ? "Sending…" : "Send project details"}
    </button>
  );
}
