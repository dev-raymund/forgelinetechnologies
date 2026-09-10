"use client";

import { useActionState } from "react";
import { login, type ActionState } from "../actions";
import { IconAlert } from "@/components/admin-icons";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(login, {});

  return (
    <div className="adm-login">
      <form className="box" action={formAction}>
        <div className="mark">F</div>
        <h1>Sign in</h1>
        <p className="sub">Forgeline Technologies admin.</p>

        <div className="adm-form">
          {state?.error && <div className="adm-err"><IconAlert />{state.error}</div>}

          <label className="adm-field">
            <span>Email</span>
            <input type="email" name="email" autoComplete="username" required autoFocus />
          </label>

          <label className="adm-field">
            <span>Password</span>
            <input type="password" name="password" autoComplete="current-password" required />
          </label>

          <button className="adm-btn" type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
