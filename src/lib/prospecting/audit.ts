import { asc, and, eq } from "drizzle-orm";
import {
  auditFindings,
  getDb,
  prospectAudits,
  type AuditFinding as StoredAuditFinding,
  type ProspectAudit,
} from "../../db/index.ts";
import type { AuditFinding as ObservedFinding, AuditStatus } from "./types.ts";

const TRANSITIONS: Record<AuditStatus, readonly AuditStatus[]> = {
  queued: ["running", "failed"],
  running: ["completed", "partial", "failed"],
  completed: [],
  partial: [],
  failed: [],
};

export function canTransitionAudit(from: AuditStatus, to: AuditStatus): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

async function transitionAudit(id: number, to: AuditStatus, values: Record<string, unknown>) {
  const [current] = await getDb()
    .select({ status: prospectAudits.status })
    .from(prospectAudits)
    .where(eq(prospectAudits.id, id))
    .limit(1);
  if (!current || !canTransitionAudit(current.status as AuditStatus, to)) {
    throw new Error(`Audit ${id} cannot transition to ${to}.`);
  }

  const rows = await getDb()
    .update(prospectAudits)
    .set({ ...values, status: to, updatedAt: new Date() })
    .where(and(eq(prospectAudits.id, id), eq(prospectAudits.status, current.status)))
    .returning();
  if (!rows[0]) throw new Error(`Audit ${id} was changed by another worker.`);
  return rows[0];
}

/**
 * `prospectId` is optional because a Phase 1 audit is a bare URL with no
 * prospect behind it, but it must be carried whenever there is one: an audit
 * created without it never appears in that prospect's history, and the drain's
 * `applyResult` returns early on a null prospectId, so the run would also never
 * reach the prospect's score.
 */
export async function createAuditRequest(input: {
  requestedUrl: string;
  requestedBy: number;
  prospectId?: number | null;
}): Promise<{ id: number }> {
  const [row] = await getDb()
    .insert(prospectAudits)
    .values({
      requestedUrl: input.requestedUrl,
      requestedBy: input.requestedBy,
      prospectId: input.prospectId ?? null,
    })
    .returning({ id: prospectAudits.id });
  if (!row) throw new Error("The audit request could not be created.");
  return row;
}

export async function getAuditForAdmin(
  id: number,
): Promise<{ audit: ProspectAudit; findings: StoredAuditFinding[] } | null> {
  const [audit] = await getDb()
    .select()
    .from(prospectAudits)
    .where(eq(prospectAudits.id, id))
    .limit(1);
  if (!audit) return null;
  const findings = await getDb()
    .select()
    .from(auditFindings)
    .where(eq(auditFindings.auditId, id))
    .orderBy(asc(auditFindings.id));
  return { audit, findings };
}

/**
 * The minimum a reviewer action needs to decide whether an audit can be
 * re-run, and to carry the prospect it belongs to onto the replacement,
 * without loading the full report and its findings.
 */
export async function getAuditSummary(
  id: number,
): Promise<
  { id: number; requestedUrl: string; status: AuditStatus; prospectId: number | null } | null
> {
  const [row] = await getDb()
    .select({
      id: prospectAudits.id,
      requestedUrl: prospectAudits.requestedUrl,
      status: prospectAudits.status,
      prospectId: prospectAudits.prospectId,
    })
    .from(prospectAudits)
    .where(eq(prospectAudits.id, id))
    .limit(1);
  if (!row) return null;
  return { ...row, status: row.status as AuditStatus };
}

export async function saveAuditRunning(id: number) {
  return transitionAudit(id, "running", { startedAt: new Date(), errorDetail: "" });
}

export async function saveAuditResult(input: {
  id: number;
  status: "completed" | "partial";
  finalUrl: string;
  httpStatus: number;
  https: boolean;
  redirectChain: string[];
  report: Record<string, unknown>;
  findings: ObservedFinding[];
}) {
  const row = await transitionAudit(input.id, input.status, {
    finalUrl: input.finalUrl,
    httpStatus: input.httpStatus,
    https: input.https,
    redirectChain: input.redirectChain,
    report: input.report,
    completedAt: new Date(),
    errorDetail: "",
  });

  if (input.findings.length > 0) {
    await getDb().insert(auditFindings).values(
      input.findings.map((finding) => ({
        auditId: input.id,
        category: finding.category,
        rule: finding.rule,
        severity: finding.severity,
        pageUrl: finding.pageUrl,
        evidence: finding.evidence,
        recommendation: finding.recommendation,
        confidence: finding.confidence,
        observedAt: new Date(finding.observedAt),
      })),
    );
  }
  return row;
}

export async function saveAuditFailure(id: number, detail: string) {
  return transitionAudit(id, "failed", {
    errorDetail: detail.slice(0, 10_000),
    completedAt: new Date(),
  });
}
