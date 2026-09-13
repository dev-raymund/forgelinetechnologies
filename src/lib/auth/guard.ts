import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";

/**
 * Authorisation.
 *
 * Everything that reads or writes admin data calls one of these, including
 * server actions and route handlers — not just pages. Middleware only checks
 * that a session cookie is present, which is a cheap filter and nothing more:
 * it runs on the edge, it cannot reach the database, and it never sees a role.
 * Treating it as the security boundary would mean an EDITOR could reach user
 * management by calling the action directly.
 *
 * So the rule is: middleware redirects the browser, these functions decide.
 */

export type Role = "admin" | "editor";

/** Capability -> the roles that hold it. Roles are compared, never trusted. */
const CAPABILITIES = {
  "users.manage": ["admin"],
  "posts.manage": ["admin", "editor"],
  "works.manage": ["admin", "editor"],
  "reviews.manage": ["admin", "editor"],
  "inquiries.manage": ["admin", "editor"],
  "audit.read": ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Capability = keyof typeof CAPABILITIES;

export function roleHas(role: string, capability: Capability): boolean {
  return (CAPABILITIES[capability] as readonly string[]).includes(role);
}

/** For pages: redirects to the login screen, preserving where they were going. */
export async function requireUser(returnTo?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/admin/login${next}`);
  }
  return user;
}

export async function requireCapability(
  capability: Capability,
  returnTo?: string,
): Promise<SessionUser> {
  const user = await requireUser(returnTo);
  if (!roleHas(user.role, capability)) redirect("/admin?denied=1");
  return user;
}

/**
 * For server actions and route handlers.
 *
 * Returns a result instead of redirecting, so a mutation can answer with a
 * form error rather than a navigation. Never throws the reason back to the
 * client beyond "not allowed" — what a role can do is not information a
 * caller needs to probe for.
 */
export type Authorised =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string };

export async function authorise(capability: Capability): Promise<Authorised> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." };
  if (!roleHas(user.role, capability))
    return { ok: false, error: "You do not have access to that." };
  return { ok: true, user };
}
