/**
 * Who can do what.
 *
 * Plain data with no imports, so it can be tested directly and imported from
 * anywhere — guard.ts is "server-only" and the nav needs the same matrix to
 * decide which links to render.
 *
 * Roles are compared, never trusted: `role` is a varchar, so an unrecognised
 * value holds nothing rather than defaulting to anything.
 */
export type Role = "admin" | "editor";

const CAPABILITIES = {
  "users.manage": ["admin"],
  "posts.manage": ["admin", "editor"],
  "works.manage": ["admin", "editor"],
  "reviews.manage": ["admin", "editor"],
  "inquiries.manage": ["admin", "editor"],
  "media.manage": ["admin", "editor"],
  "audit.read": ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Capability = keyof typeof CAPABILITIES;

export function roleHas(role: string, capability: Capability): boolean {
  const allowed = CAPABILITIES[capability] as readonly string[] | undefined;
  return allowed ? allowed.includes(role) : false;
}
