"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { submitInquiry, type InquiryState } from "@/lib/inquiry";
import { PROJECT_TYPES, BUDGETS, TIMELINES } from "@/lib/validation";

/**
 * Contact form.
 *
 * Progressive by construction: it is a real <form> with a server action, so it
 * submits and validates without JavaScript. `useActionState` only upgrades the
 * experience — it does not enable it.
 *
 * Errors are wired with aria-describedby and aria-invalid per field, and the
 * status line is a polite live region so a screen-reader user hears the result
 * without having to go looking for it.
 *
 * The honeypot is positioned off-screen rather than display:none. A field that
 * is display:none is trivially detected and skipped; one that is merely moved
 * is not. It is hidden from assistive technology and removed from the tab
 * order so it can never trap a real person.
 */
const initial: InquiryState = { status: "idle" };

const field =
  "w-full rounded-sm border bg-white px-3.5 py-3 text-[0.9375rem] text-graphite " +
  "transition-colors placeholder:text-faint focus:border-signal";

export function ContactForm() {
  const [state, action, pending] = useActionState(submitInquiry, initial);
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const id = (n: string) => `${uid}-${n}`;
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  const err = (n: keyof typeof errors) => errors[n];

  // Move focus to the outcome so keyboard and screen-reader users are told
  // what happened instead of being left at the bottom of a form.
  useEffect(() => {
    if (state.status === "idle") return;
    statusRef.current?.focus();
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  if (state.status === "success") {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="border border-rule bg-white p-8 md:p-10"
      >
        <h2 className="text-subtitle font-semibold text-graphite">
          Your enquiry is in
        </h2>
        <p className="mt-4 max-w-[52ch] text-[1.0625rem] leading-relaxed text-muted">
          {state.message}
        </p>
        {state.confirmationSent ? (
          <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-relaxed text-muted">
            A confirmation is on its way to the address you gave. If it does not
            arrive, check the spam folder before assuming it went missing.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} noValidate className="flex flex-col gap-6">
      {state.status === "error" ? (
        <div
          ref={statusRef}
          tabIndex={-1}
          role="alert"
          className="border-l-2 border-signal bg-white px-4 py-3 text-[0.9375rem] text-graphite"
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id={id("name")}
          name="name"
          label="Your name"
          required
          autoComplete="name"
          error={err("name")}
        />
        <Field
          id={id("email")}
          name="email"
          type="email"
          label="Email"
          required
          autoComplete="email"
          error={err("email")}
        />
        <Field
          id={id("company")}
          name="company"
          label="Company"
          optional
          autoComplete="organization"
          error={err("company")}
        />
        <Field
          id={id("website")}
          name="website"
          label="Current website"
          optional
          placeholder="yourbusiness.com"
          autoComplete="url"
          error={err("website")}
        />
      </div>

      {/* items-end so the controls bottom-align even if a label wraps. */}
      <div className="grid gap-6 sm:grid-cols-3 sm:items-end">
        <Select
          id={id("projectType")}
          name="projectType"
          label="Project type"
          options={PROJECT_TYPES}
          error={err("projectType")}
        />
        <Select
          id={id("budget")}
          name="budget"
          label="Budget"
          options={BUDGETS}
          error={err("budget")}
        />
        <Select
          id={id("timeline")}
          name="timeline"
          label="Timeline"
          options={TIMELINES}
          error={err("timeline")}
        />
      </div>

      <div>
        <Label htmlFor={id("message")} required>
          The project
        </Label>
        <textarea
          id={id("message")}
          name="message"
          rows={6}
          required
          aria-invalid={err("message") ? true : undefined}
          aria-describedby={
            err("message") ? `${id("message")}-error` : `${id("message")}-hint`
          }
          placeholder="What are you trying to build, and what problem is it solving?"
          className={`${field} mt-2 resize-y ${
            err("message") ? "border-signal" : "border-rule-strong"
          }`}
        />
        {err("message") ? (
          <ErrorText id={`${id("message")}-error`}>{err("message")}</ErrorText>
        ) : (
          <p
            id={`${id("message")}-hint`}
            className="mt-2 text-[0.8125rem] text-muted"
          >
            A couple of sentences is plenty. Deadlines and existing systems are
            the useful details.
          </p>
        )}
      </div>

      {/* Honeypot. Never shown, never announced, never focusable. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-px w-px overflow-hidden [clip-path:inset(50%)] [white-space:nowrap]"
      >
        <label htmlFor={id("companyWebsite")}>Company website</label>
        <input
          id={id("companyWebsite")}
          name="companyWebsite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-sm bg-signal px-6 py-3.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-signal-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send project details"}
        </button>
        <p className="text-[0.8125rem] text-muted">
          No mailing list, and your details are not passed to anyone.
        </p>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ pieces */

function Label({
  htmlFor,
  required,
  optional,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-baseline gap-2 text-[0.9375rem] font-medium text-graphite"
    >
      {children}
      {required ? (
        <span className="text-[0.75rem] font-normal text-muted">Required</span>
      ) : null}
      {optional ? (
        <span className="text-[0.75rem] font-normal text-faint">Optional</span>
      ) : null}
    </label>
  );
}

function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-2 text-[0.8125rem] font-medium text-signal">
      {children}
    </p>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required,
  optional,
  placeholder,
  autoComplete,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div className="min-w-0">
      <Label htmlFor={id} required={required} optional={optional}>
        {label}
      </Label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${field} mt-2 ${error ? "border-signal" : "border-rule-strong"}`}
      />
      {error ? <ErrorText id={`${id}-error`}>{error}</ErrorText> : null}
    </div>
  );
}

function Select({
  id,
  name,
  label,
  options,
  error,
}: {
  id: string;
  name: string;
  label: string;
  options: readonly string[];
  error?: string;
}) {
  return (
    // min-w-0 so the select can shrink inside its grid track. Without it a
    // grid child keeps min-width:auto, which is the width of its longest
    // option, and the row overflows the page at intermediate widths.
    <div className="min-w-0">
      <Label htmlFor={id} optional>
        {label}
      </Label>
      <select
        id={id}
        name={name}
        defaultValue=""
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${field} mt-2 appearance-none ${
          error ? "border-signal" : "border-rule-strong"
        }`}
      >
        <option value="">Select one</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error ? <ErrorText id={`${id}-error`}>{error}</ErrorText> : null}
    </div>
  );
}
