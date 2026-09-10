"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Check, Loader2, AlertCircle } from "lucide-react";
import { submitInquiry, type InquiryState } from "@/app/(site)/contact/actions";
import { PROJECT_TYPES, BUDGETS, TIMELINES } from "@/lib/validation/inquiry";
import { site, contactCopy } from "@/lib/content";

const initial: InquiryState = { status: "idle" };

export default function InquiryForm() {
  const [state, action] = useActionState(submitInquiry, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  // Clear the form on success, and move focus to the message so screen-reader
  // users are told the outcome rather than left on a now-empty field.
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
    if (state.status !== "idle") alertRef.current?.focus();
  }, [state]);

  const errors = state.status === "error" ? state.errors : undefined;

  if (state.status === "success") {
    return (
      <div
        ref={alertRef}
        tabIndex={-1}
        role="status"
        className="rounded-[3px] border border-line bg-paper p-8"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Check className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-h3 font-semibold">Enquiry received</h2>
        <p className="mt-2 max-w-[46ch] leading-relaxed">{state.message}</p>
        <p className="mt-4 text-[0.9rem] text-muted">
          Nothing in your inbox within a day? Email{" "}
          <a href={`mailto:${site.email}`} className="text-brand-600 underline-offset-4 hover:underline">
            {site.email}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} noValidate className="rounded-[3px] border border-line bg-paper p-7 lg:p-8">
      {state.status === "error" && (
        <div
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          className="mb-6 flex gap-3 rounded-[3px] border border-red-200 bg-red-50 p-4 text-[0.9rem] text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{state.message}</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" name="name" required error={errors?.name} autoComplete="name" />
        <Field label="Email" name="email" type="email" required error={errors?.email} autoComplete="email" />
        <Field label="Company" name="company" error={errors?.company} autoComplete="organization" />
        <Field label="Website" name="website" error={errors?.website} placeholder="example.com" autoComplete="url" />
        <Field label="Phone" name="phone" type="tel" error={errors?.phone} autoComplete="tel" optional />
        <Select label="Project type" name="projectType" options={PROJECT_TYPES} required error={errors?.projectType} />
        <Select label="Budget" name="budget" options={BUDGETS} required error={errors?.budget} />
        <Select label="Timeline" name="timeline" options={TIMELINES} required error={errors?.timeline} />
      </div>

      <div className="mt-5">
        <Label htmlFor="message" required>
          Project details
        </Label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          aria-invalid={errors?.message ? true : undefined}
          aria-describedby={errors?.message ? "message-error" : undefined}
          placeholder="What are you building, what problem does it solve, and is there a date it needs to be live by?"
          className={inputClass(!!errors?.message)}
        />
        <FieldError id="message-error" message={errors?.message} />
      </div>

      {/* Honeypot: off-screen rather than display:none, which some bots detect.
          aria-hidden + tabIndex keeps it away from real users entirely. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="companyUrl">Company URL</label>
        <input id="companyUrl" name="companyUrl" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Submit />

      <p className="mt-4 text-[0.85rem] leading-relaxed text-muted">
        {contactCopy.privacy}
      </p>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[3px] bg-ink-900 px-7 font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Sending…
        </>
      ) : (
        <>
          Send enquiry
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </>
      )}
    </button>
  );
}

const inputClass = (invalid: boolean) =>
  `mt-1.5 w-full rounded-[3px] border bg-paper px-3.5 py-2.5 text-[0.95rem] text-ink-900 outline-none transition-colors placeholder:text-muted/70 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15 ${
    invalid ? "border-red-400" : "border-line-strong"
  }`;

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
    <label htmlFor={htmlFor} className="text-[0.85rem] font-medium text-ink-900">
      {children}
      {required && <span className="ml-1 text-brand-600">*</span>}
      {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-[0.82rem] text-red-700">
      {message}
    </p>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  optional,
  error,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <Label htmlFor={name} required={required} optional={optional}>
        {label}
      </Label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={inputClass(!!error)}
      />
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}

function Select({
  label,
  name,
  options,
  required,
  error,
}: {
  label: string;
  name: string;
  options: readonly string[];
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue=""
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={inputClass(!!error)}
      >
        <option value="" disabled>
          Choose one…
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}
