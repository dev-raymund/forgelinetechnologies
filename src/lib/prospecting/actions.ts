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
import { parseProspectCsv, type ParsedProspect, type RowError } from "@/lib/prospecting/csv";
import { upsertProspects } from "@/lib/prospecting/prospects";

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

export type ImportPreview =
  | { status: "error"; message: string }
  | { status: "ready"; rows: ParsedProspect[]; errors: RowError[]; sourceName: string };

export type ImportResult =
  | { status: "error"; message: string }
  | { status: "imported"; inserted: number; updated: number; skippedSuppressed: number };

/** Parses only. Nothing is written until the reviewer confirms the preview. */
export async function previewImport(formData: FormData): Promise<ImportPreview> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { status: "error", message: authorised.error };

  const text = String(formData.get("csv") ?? "");
  if (!text.trim()) return { status: "error", message: "Paste or upload a CSV first." };

  const sourceName = String(formData.get("sourceName") ?? "").trim();
  if (!sourceName) return { status: "error", message: "Name the source of this list." };

  const { rows, errors } = parseProspectCsv(text);
  return { status: "ready", rows, errors, sourceName };
}

export async function commitImport(formData: FormData): Promise<ImportResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { status: "error", message: authorised.error };

  const text = String(formData.get("csv") ?? "");
  const sourceName = String(formData.get("sourceName") ?? "").trim();
  if (!text.trim() || !sourceName) {
    return { status: "error", message: "The import is missing its file or its source name." };
  }

  const { rows } = parseProspectCsv(text);
  if (rows.length === 0) return { status: "error", message: "No valid rows to import." };

  const summary = await upsertProspects(
    rows,
    {
      name: sourceName,
      url: String(formData.get("sourceUrl") ?? "").trim(),
      importedAt: new Date().toISOString(),
      importedBy: authorised.user.id,
    },
    authorised.user.id,
  );

  await audit({
    action: "prospect.import",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    detail: `${sourceName}: ${summary.inserted} new, ${summary.updated} updated, ${summary.skippedSuppressed} suppressed`,
  });

  return { status: "imported", ...summary };
}
