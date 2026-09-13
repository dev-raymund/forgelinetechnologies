"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createUser,
  resetUserPassword,
  setUserActive,
  updateUser,
  type UserResult,
} from "@/lib/admin/user-actions";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
};

const field =
  "mt-1.5 w-full rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.9375rem] focus:border-ink focus:outline-none";

const when = (d: Date) =>
  new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(d);

export function UserManager({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: number;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  /** Shown once, never stored. Cleared as soon as the admin dismisses it. */
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  const run = (fn: (fd: FormData) => Promise<UserResult>, fd: FormData, email: string) =>
    start(async () => {
      const r = await fn(fd);
      if (!r.ok) {
        setError(r.error ?? "That did not work.");
        return;
      }
      setError(null);
      setEditing(null);
      setAdding(false);
      if (r.password) setIssued({ email, password: r.password });
      router.refresh();
    });

  return (
    <>
      {error ? (
        <p role="alert" className="mb-4 border-l-2 border-accent bg-white px-4 py-3 text-[0.9375rem]">
          {error}
        </p>
      ) : null}

      {issued ? (
        <div role="status" className="mb-5 rounded-sm border border-accent bg-white px-4 py-4">
          <p className="text-[0.9375rem] font-medium text-graphite">
            Password for {issued.email}
          </p>
          <p className="mt-2 font-mono text-[1.0625rem] text-graphite">{issued.password}</p>
          <p className="mt-2 text-[0.875rem] text-muted">
            Shown once and stored only as a hash. Pass it on now — nobody,
            including you, can read it back.
          </p>
          <button
            type="button"
            onClick={() => setIssued(null)}
            className="mt-3 rounded-sm border border-rule-strong px-3 py-1.5 text-[0.875rem] font-medium"
          >
            Done
          </button>
        </div>
      ) : null}

      <div className="mb-5">
        {adding ? (
          <form
            action={(fd) => run(createUser, fd, String(fd.get("email") ?? ""))}
            className="rounded-sm border border-rule bg-white p-5"
          >
            <h2 className="text-[1.0625rem] font-semibold">New account</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="new-name" className="text-[0.875rem] font-medium">Name</label>
                <input id="new-name" name="name" className={field} />
              </div>
              <div>
                <label htmlFor="new-email" className="text-[0.875rem] font-medium">Email</label>
                <input id="new-email" name="email" type="email" required className={field} />
              </div>
              <div>
                <label htmlFor="new-role" className="text-[0.875rem] font-medium">Role</label>
                <select id="new-role" name="role" defaultValue="editor" className={field}>
                  <option value="editor">editor — content only</option>
                  <option value="admin">admin — everything, including accounts</option>
                </select>
              </div>
              <div>
                <label htmlFor="new-password" className="text-[0.875rem] font-medium">
                  Password
                </label>
                <input id="new-password" name="password" type="text" autoComplete="off" className={field} />
                <p className="mt-1.5 text-[0.8125rem] text-muted">
                  Leave empty to generate a strong one.
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-sm bg-accent px-5 py-2.5 text-[0.9375rem] font-medium text-white disabled:opacity-60"
              >
                {pending ? "Creating…" : "Create account"}
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-sm border border-rule-strong px-5 py-2.5 text-[0.9375rem] font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-sm bg-ink px-4 py-2 text-[0.875rem] font-medium text-white"
          >
            New account
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-sm border border-rule bg-white">
        <table className="w-full min-w-[44rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-rule">
              {["Name", "Email", "Role", "Status", "Added", ""].map((h) => (
                <th key={h} scope="col" className="px-4 py-2.5 font-mono text-micro font-normal text-faint">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              return editing === u.id ? (
                <tr key={u.id} className="border-b border-rule last:border-b-0">
                  <td colSpan={6} className="px-4 py-4">
                    <form action={(fd) => run(updateUser, fd, u.email)}>
                      <input type="hidden" name="id" value={u.id} />
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label htmlFor={`n-${u.id}`} className="text-[0.875rem] font-medium">Name</label>
                          <input id={`n-${u.id}`} name="name" defaultValue={u.name} className={field} />
                        </div>
                        <div>
                          <label htmlFor={`e-${u.id}`} className="text-[0.875rem] font-medium">Email</label>
                          <input id={`e-${u.id}`} name="email" type="email" required defaultValue={u.email} className={field} />
                        </div>
                        <div>
                          <label htmlFor={`r-${u.id}`} className="text-[0.875rem] font-medium">Role</label>
                          <select
                            id={`r-${u.id}`}
                            name="role"
                            defaultValue={u.role}
                            disabled={isSelf}
                            className={`${field} disabled:bg-black/[0.04]`}
                          >
                            <option value="editor">editor</option>
                            <option value="admin">admin</option>
                          </select>
                          {isSelf ? (
                            <p className="mt-1.5 text-[0.8125rem] text-muted">
                              You cannot change your own role.
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={pending}
                          className="rounded-sm bg-ink px-4 py-2 text-[0.875rem] font-medium text-white disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="rounded-sm border border-rule-strong px-4 py-2 text-[0.875rem] font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>

                    {/* A separate form, not a button on the one above: the
                        action validates a password and the edit action does
                        not, so sharing a form would submit whichever fields
                        happened to be filled. */}
                    <div className="mt-5 border-t border-rule pt-4">
                      <p className="text-[0.875rem] font-medium text-graphite">
                        Password
                      </p>
                      <form
                        action={(fd) => {
                          fd.set("id", String(u.id));
                          run(resetUserPassword, fd, u.email);
                        }}
                        className="mt-2 flex flex-wrap items-end gap-2"
                      >
                        <div className="min-w-[16rem] flex-1">
                          <label htmlFor={`pw-${u.id}`} className="sr-only">
                            New password for {u.email}
                          </label>
                          <input
                            id={`pw-${u.id}`}
                            name="password"
                            type="text"
                            autoComplete="new-password"
                            minLength={12}
                            placeholder="Type a password, or leave empty to generate one"
                            className={field}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={pending}
                          className="rounded-sm border border-rule-strong px-4 py-2 text-[0.875rem] font-medium disabled:opacity-60"
                        >
                          {pending ? "Setting…" : "Set password"}
                        </button>
                      </form>
                      <p className="mt-2 max-w-[52ch] text-[0.8125rem] text-muted">
                        At least 12 characters. Leave it empty and a strong one
                        is generated and shown once.
                        {isSelf
                          ? " Changing your own signs you out everywhere else, but keeps you signed in here."
                          : " This signs them out everywhere immediately."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={u.id} className="border-b border-rule last:border-b-0">
                  <td className="px-4 py-3 text-[0.9375rem] font-medium">
                    {u.name || "—"}
                    {isSelf ? <span className="ml-2 font-mono text-micro text-faint">you</span> : null}
                  </td>
                  <td className="px-4 py-3 text-[0.9375rem] text-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-sm bg-black/[0.06] px-2 py-0.5 font-mono text-micro text-muted">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-sm px-2 py-0.5 font-mono text-micro ${
                        u.active ? "bg-ink text-white" : "bg-black/[0.06] text-muted"
                      }`}
                    >
                      {u.active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[0.875rem] text-muted">{when(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditing(u.id)}
                        className="text-[0.875rem] font-medium underline decoration-rule-strong underline-offset-4 hover:decoration-accent"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pending || (isSelf && u.active)}
                        title={isSelf && u.active ? "You cannot deactivate your own account" : undefined}
                        onClick={() => {
                          const fd = new FormData();
                          fd.set("id", String(u.id));
                          fd.set("active", String(!u.active));
                          run(setUserActive, fd, u.email);
                        }}
                        className="text-[0.875rem] font-medium text-muted underline decoration-rule-strong underline-offset-4 hover:text-graphite disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {u.active ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-5 max-w-[62ch] text-[0.875rem] leading-relaxed text-muted">
        Accounts are deactivated, never deleted. Deactivating ends every session
        immediately and revokes access completely, while keeping the posts and
        notes that person wrote attributed to them.
      </p>
    </>
  );
}
