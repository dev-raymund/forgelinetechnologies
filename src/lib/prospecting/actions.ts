"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { authorise } from "@/lib/auth/guard";
import { audit, type AuditAction } from "@/lib/auth/audit";
import {
  createAuditRequest,
  getAuditSummary,
  saveAuditFailure,
} from "@/lib/prospecting/audit";
import { runAuditInBackground } from "@/lib/prospecting/run";
import {
  rerunAuditForUser,
  requestAuditForUser,
  type AuditActionResult,
} from "@/lib/prospecting/admin";

export type { AuditActionResult } from "@/lib/prospecting/admin";

/**
 * `after` runs the audit once the response has been sent, in the same
 * invocation, so the reviewer is redirected to the report immediately and no
 * separate queue process is required to make local development work.
 */
function startAudit(input: { auditId: number; requestedUrl: string }) {
  after(() => runAuditInBackground(input));
}

function auditLog(action: AuditAction) {
  return ({
    id,
    requestedUrl,
    actor,
  }: {
    id: number;
    requestedUrl: string;
    actor: { id: number; email: string };
  }) =>
    audit({
      action,
      userId: actor.id,
      actorEmail: actor.email,
      entity: "prospect_audit",
      entityId: id,
      detail: requestedUrl,
    });
}

export async function requestAudit(formData: FormData): Promise<AuditActionResult> {
  const result = await requestAuditForUser(formData, {
    authorize: () => authorise("prospecting.manage"),
    createAuditRequest,
    startAudit,
    saveFailure: saveAuditFailure,
    onQueued: auditLog("prospecting.audit.requested"),
  });

  if (result.status === "queued") redirect(result.redirectTo);
  return result;
}

export async function rerunAudit(auditId: number): Promise<AuditActionResult> {
  const result = await rerunAuditForUser(auditId, {
    authorize: () => authorise("prospecting.manage"),
    loadAudit: getAuditSummary,
    createAuditRequest,
    startAudit,
    saveFailure: saveAuditFailure,
    onQueued: auditLog("prospecting.audit.rerun"),
  });

  if (result.status === "queued") redirect(result.redirectTo);
  return result;
}
