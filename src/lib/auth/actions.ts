"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, users } from "@/db";
import { verifyPassword, fakeVerify } from "@/lib/auth/password";
import { createSession, destroySession, getSessionUser } from "@/lib/auth/session";
import { audit, clientIp, countRecentFailedLogins } from "@/lib/auth/audit";

/**
 * Login.
 *
 * One failure message for every cause. Unknown address, wrong password,
 * deactivated account — all answer "Email or password is incorrect", and the
 * unknown-address path still runs a full scrypt so it costs the same as a real
 * attempt. Anything more helpful is an account enumeration oracle.
 */

const LOGIN_LIMIT = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const GENERIC = "Email or password is incorrect.";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(255).pipe(z.email()),
  password: z.string().min(1).max(200),
});

/**
 * "idle" is the state before anything is submitted; "success" is returned only
 * after a session exists. They must be distinct: a form that treats its own
 * initial state as success navigates away the moment it mounts.
 */
export type LoginState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string; email?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) return { status: "error", message: GENERIC, email };

  const ip = await clientIp();
  if ((await countRecentFailedLogins(ip, LOGIN_WINDOW_MS)) >= LOGIN_LIMIT) {
    await audit({ action: "login.failed", detail: "rate limited" });
    return {
      status: "error",
      message: "Too many attempts. Try again in a few minutes.",
      email,
    };
  }

  const [account] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (!account) {
    await fakeVerify(parsed.data.password);
    await audit({ action: "login.failed", detail: "no such account" });
    return { status: "error", message: GENERIC, email };
  }

  const ok = await verifyPassword(parsed.data.password, account.passwordHash);
  if (!ok || !account.active) {
    await audit({
      action: "login.failed",
      userId: account.id,
      actorEmail: account.email,
      detail: ok ? "account inactive" : "bad password",
    });
    return { status: "error", message: GENERIC, email };
  }

  await createSession(account.id);
  await audit({
    action: "login",
    userId: account.id,
    actorEmail: account.email,
  });
  return { status: "success" };
}

export async function logout(): Promise<void> {
  const user = await getSessionUser();
  if (user) {
    await audit({ action: "logout", userId: user.id, actorEmail: user.email });
  }
  await destroySession();
}
