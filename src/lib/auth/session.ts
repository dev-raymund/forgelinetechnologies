import "server-only";
import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb, sessions, users, type User } from "@/db";
import { withRetry } from "@/lib/queries";
import { SESSION_COOKIE } from "@/lib/auth/cookie";

/**
 * Sessions.
 *
 * The cookie holds an opaque id and nothing else — no role, no email, no
 * expiry the client can read or edit. Every request resolves the id against
 * the database, which is what makes revocation real: deleting the row, or
 * deactivating the account, ends access on the next request rather than
 * whenever a token would have expired.
 *
 * That round trip is the cost. It buys the property an admin panel needs more
 * than it needs to save a query.
 */

export { SESSION_COOKIE } from "@/lib/auth/cookie";
const SESSION_DAYS = 7;

/** 256 bits. Session ids are credentials — they must not be guessable. */
function newSessionId(): string {
  return randomBytes(32).toString("base64url");
}

export type SessionUser = Pick<User, "id" | "email" | "name" | "role">;

export async function createSession(userId: number): Promise<string> {
  const id = newSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const h = await headers();

  await getDb().insert(sessions).values({
    id,
    userId,
    expiresAt,
    userAgent: (h.get("user-agent") ?? "").slice(0, 300),
    ip: (h.get("x-forwarded-for") ?? "").split(",")[0]!.trim().slice(0, 64),
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    // Off on localhost, where there is no TLS and the cookie would be dropped.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return id;
}

/**
 * The current user, or null.
 *
 * Joined against `users` in one query so an account deactivated a second ago
 * cannot act on this request. `active` is checked here rather than at login
 * for exactly that reason.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const rows = await withRetry(() =>
    getDb()
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.id, id),
          gt(sessions.expiresAt, new Date()),
          eq(users.active, true),
        ),
      )
      .limit(1),
  );
  return rows[0] ?? null;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) {
    // Delete the row first. If the cookie clear fails the session is already
    // dead; the other order would leave a usable session behind.
    await getDb().delete(sessions).where(eq(sessions.id, id)).catch(() => {});
  }
  jar.delete(SESSION_COOKIE);
}

/** Ends every session for a user — used when deactivating or demoting one. */
export async function destroyUserSessions(userId: number): Promise<void> {
  await getDb().delete(sessions).where(eq(sessions.userId, userId));
}

/** Housekeeping. Expired rows are already unusable; this stops them piling up. */
export async function purgeExpiredSessions(): Promise<void> {
  await getDb()
    .delete(sessions)
    .where(lt(sessions.expiresAt, new Date()))
    .catch(() => {});
}
