import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "./auth";
import type { User } from "@/db/schema";

/**
 * Route guards. These live outside actions.ts because a "use server" module can
 * only export server actions — and pages need these too. Rendering a page and
 * running a mutation must be gated by the same check, or hiding a nav link
 * becomes the only thing standing between an editor and the users screen.
 */

/** Any signed-in, active user. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Admin-only. Editors go to the dashboard, not the login screen. */
export async function requireAdminRole(): Promise<User> {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/admin");
  return user;
}
