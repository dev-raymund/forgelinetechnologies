import "server-only";
import { headers } from "next/headers";
import { and, desc, eq, gte } from "drizzle-orm";
import { getDb, auditLogs } from "@/db";

/**
 * Audit log.
 *
 * Deliberately small: who did what to which record, and when. Enough to answer
 * "who published that" without becoming a second copy of the data.
 *
 * Writing it must never fail the operation it describes — a publish that
 * worked should not report an error because the log did not. Failures are
 * logged to the server and swallowed.
 */

export type AuditAction =
  | "login"
  | "login.failed"
  | "logout"
  | "post.create" | "post.update" | "post.publish" | "post.unpublish" | "post.delete"
  | "work.create" | "work.update" | "work.publish" | "work.unpublish" | "work.delete"
  | "review.approve" | "review.reject" | "review.publish" | "review.unpublish" | "review.delete"
  | "inquiry.status" | "inquiry.note" | "inquiry.delete"
  | "user.create" | "user.update" | "user.deactivate" | "user.delete"
  | "prospecting.audit.requested" | "prospecting.audit.running"
  | "prospecting.audit.completed" | "prospecting.audit.failed"
  | "prospecting.audit.rerun"
  | "prospect.import" | "prospect.queue" | "prospect.suppress"
  | "prospect.unsuppress" | "prospect.dismiss";

export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim().slice(0, 64);
  return h.get("x-real-ip")?.slice(0, 64) ?? "";
}

export async function audit(entry: {
  action: AuditAction;
  userId?: number | null;
  actorEmail?: string;
  entity?: string;
  entityId?: number | null;
  detail?: string;
}): Promise<void> {
  try {
    await getDb().insert(auditLogs).values({
      action: entry.action,
      userId: entry.userId ?? null,
      actorEmail: (entry.actorEmail ?? "").slice(0, 255),
      entity: entry.entity ?? "",
      entityId: entry.entityId ?? null,
      detail: (entry.detail ?? "").slice(0, 300),
      ip: await clientIp(),
    });
  } catch (err) {
    console.error("[audit] write failed", entry.action, err);
  }
}

/**
 * Failed logins from one IP within the window.
 *
 * Counted from the audit log rather than a separate table — the rows are
 * already being written, and an attacker cannot clear them.
 */
export async function countRecentFailedLogins(
  ip: string,
  windowMs: number,
): Promise<number> {
  if (!ip) return 0;
  const since = new Date(Date.now() - windowMs);
  try {
    const rows = await getDb()
      .select({ id: auditLogs.id })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, "login.failed"),
          eq(auditLogs.ip, ip),
          gte(auditLogs.createdAt, since),
        ),
      )
      .limit(50);
    return rows.length;
  } catch {
    // A failing rate-limit check must not lock everyone out.
    return 0;
  }
}

export async function recentAudit(limit = 20) {
  return getDb()
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
