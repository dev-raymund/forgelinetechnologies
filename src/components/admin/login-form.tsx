"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, type LoginState } from "@/lib/auth/actions";

const initial: LoginState = { status: "idle" };

/**
 * The action sets the session cookie and returns; navigation happens here.
 *
 * `router.refresh()` before pushing, because the layout reads the session on
 * the server — without it the shell would render from the pre-login cache and
 * show a signed-out state on a signed-in page.
 */
export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, initial);
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") return;
    router.refresh();
    router.push(next);
  }, [state.status, next, router]);

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.status === "error" ? (
        <p
          role="alert"
          className="border-l-2 border-accent bg-paper px-3 py-2 text-[0.875rem] text-graphite"
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="admin-email"
          className="text-[0.875rem] font-medium text-graphite"
        >
          Email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          defaultValue={state.status === "error" ? (state.email ?? "") : ""}
          className="mt-2 w-full rounded-sm border border-rule-strong bg-white px-3 py-2.5 text-[0.9375rem] text-graphite focus:border-ink focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="text-[0.875rem] font-medium text-graphite"
        >
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-2 w-full rounded-sm border border-rule-strong bg-white px-3 py-2.5 text-[0.9375rem] text-graphite focus:border-ink focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-accent px-5 py-3 text-[0.9375rem] font-medium text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
