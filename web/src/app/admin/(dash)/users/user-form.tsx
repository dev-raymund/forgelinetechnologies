"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveUser, type ActionState } from "../../actions";
import { USER_ROLES, type User } from "@/db/schema";
import { IconAlert } from "@/components/admin-icons";

export default function UserForm({
  user,
  isSelf = false,
  isOnlyAdmin = false,
}: {
  user?: User;
  isSelf?: boolean;
  isOnlyAdmin?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveUser, {});

  return (
    <form className="adm-form" action={formAction}>
      {user && <input type="hidden" name="id" value={user.id} />}
      {state?.error && <div className="adm-err"><IconAlert />{state.error}</div>}

      {isOnlyAdmin && (
        <div className="adm-note">
          <IconAlert />
          This is the only active admin account. Its role and status are locked until another
          admin exists — otherwise nobody could get back in.
        </div>
      )}

      <div className="adm-fieldset">
        <p className="legend">Account</p>
        <div className="grid2">
          <label className="adm-field">
            <span>Name</span>
            <input type="text" name="name" defaultValue={user?.name ?? ""} autoFocus />
          </label>
          <label className="adm-field">
            <span>Email <em className="hint">used to sign in</em></span>
            <input type="email" name="email" defaultValue={user?.email ?? ""} required />
          </label>
        </div>

        <label className="adm-field">
          <span>
            Password{" "}
            <em className="hint">
              {user ? "leave blank to keep the current one" : "at least 10 characters"}
            </em>
          </span>
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            required={!user}
            minLength={user ? undefined : 10}
            placeholder={user ? "••••••••" : ""}
          />
        </label>
      </div>

      <div className="adm-fieldset">
        <p className="legend">Access</p>
        <label className="adm-field">
          <span>Role</span>
          <select name="role" defaultValue={user?.role ?? "editor"} disabled={isOnlyAdmin}>
            {USER_ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label} — {r.hint}</option>
            ))}
          </select>
          {/* A disabled select submits nothing; keep the value in the payload. */}
          {isOnlyAdmin && <input type="hidden" name="role" value={user?.role ?? "admin"} />}
        </label>

        <label className="adm-check">
          <input type="checkbox" name="active" defaultChecked={user?.active ?? true}
            disabled={isOnlyAdmin || isSelf} />
          <span>
            Active
            <br />
            <em className="hint">
              {isOnlyAdmin || isSelf
                ? "Can't deactivate this account — it would lock someone out."
                : "Deactivating signs them out on their next request."}
            </em>
          </span>
        </label>
        {(isOnlyAdmin || isSelf) && <input type="hidden" name="active" value="on" />}
      </div>

      <div className="adm-formbar">
        <button className="adm-btn" type="submit" disabled={pending}>
          {pending ? "Saving…" : user ? "Save changes" : "Create user"}
        </button>
        <Link className="adm-btn ghost" href="/admin/users">Cancel</Link>
      </div>
    </form>
  );
}
