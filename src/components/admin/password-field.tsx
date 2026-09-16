"use client";

import { useId, useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/admin/icons";

/**
 * A password input with a reveal toggle.
 *
 * The two account-management fields used to be `type="text"`, so a password
 * being set for someone else sat readable on screen. Masking by default and
 * revealing on a deliberate click is the safer default; the toggle keeps it
 * possible to check what was typed.
 */
export function PasswordField({
  id,
  name,
  className,
  required,
  minLength,
  placeholder,
  autoComplete,
  defaultValue,
}: {
  id: string;
  name: string;
  className: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  autoComplete?: string;
  defaultValue?: string;
}) {
  const [shown, setShown] = useState(false);
  const describedBy = useId();

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={shown ? "text" : "password"}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-describedby={describedBy}
        className={`${className} pr-11`}
      />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-pressed={shown}
        aria-label={shown ? "Hide password" : "Show password"}
        title={shown ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted transition-colors hover:text-graphite focus-visible:text-graphite"
      >
        {/* The icon shows the action, not the state: an open eye offers to
            reveal, a struck-through eye offers to hide. */}
        {shown ? <EyeOffIcon className="text-[1.1rem]" /> : <EyeIcon className="text-[1.1rem]" />}
      </button>
      <span id={describedBy} className="sr-only">
        {shown ? "Password is visible" : "Password is hidden"}
      </span>
    </div>
  );
}
