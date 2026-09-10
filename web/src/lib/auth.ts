import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = "fg_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set to a random string of at least 32 characters. Generate one with: openssl rand -base64 32",
    );
  }
  return new TextEncoder().encode(s);
}

/* ---------------- passwords ---------------- */

/** scrypt hash, stored as "salt:hex". Used by `npm run hash` and user CRUD. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, keyHex] = stored.split(":");
  if (!salt || !keyHex) return false;
  const key = await scryptAsync(password, salt, 64);
  const expected = Buffer.from(keyHex, "hex");
  // Length check first — timingSafeEqual throws on a length mismatch.
  if (expected.length !== key.length) return false;
  return timingSafeEqual(key, expected);
}

/**
 * Burns roughly the same CPU as a real verify. Called when no user matches so
 * that "unknown email" and "wrong password" take the same time to answer.
 */
export async function dummyVerify(): Promise<void> {
  await scryptAsync("dummy", "0".repeat(32), 64);
}

/* ---------------- sessions ---------------- */

/** The cookie carries the user id only — role and status are read fresh per request. */
export async function createSession(userId: number): Promise<void> {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

async function sessionUserId(): Promise<number | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.uid === "number" ? payload.uid : null;
  } catch {
    return null;
  }
}

/**
 * The signed-in user, loaded from the database on every call.
 *
 * Deliberately not cached in the token: deactivating an account or changing a
 * role takes effect on the very next request, instead of waiting out a session.
 */
export async function getCurrentUser(): Promise<User | null> {
  const uid = await sessionUserId();
  if (uid === null) return null;
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, uid), eq(users.active, true)))
    .limit(1);
  return user ?? null;
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}
