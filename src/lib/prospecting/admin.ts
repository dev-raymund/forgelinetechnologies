import { normalizeAuditUrl, type HostResolver } from "./url-safety.ts";
import type { AuditStatus } from "./types.ts";

export type AuditActionResult =
  | { status: "error"; message: string; field?: "url" }
  | { status: "queued"; id: number; redirectTo: string };

type AuditActor = { id: number; email: string };
type Authorisation =
  | { ok: true; user: AuditActor }
  | { ok: false; error: string };

/**
 * Schedules the audit for this row. The job runs in the same process once the
 * response has been sent, so this only throws if scheduling itself is
 * impossible — never for an audit that merely fails later.
 */
type StartAudit = (input: {
  auditId: number;
  requestedUrl: string;
  requestedBy: number;
}) => void | Promise<void>;

type CreateAuditRequest = (input: {
  requestedUrl: string;
  requestedBy: number;
}) => Promise<{ id: number }>;

type OnQueued = (input: {
  id: number;
  requestedUrl: string;
  actor: AuditActor;
}) => Promise<unknown>;

type AuditRequestDependencies = {
  authorize: () => Promise<Authorisation>;
  createAuditRequest: CreateAuditRequest;
  startAudit: StartAudit;
  saveFailure: (id: number, detail: string) => Promise<unknown>;
  onQueued?: OnQueued;
  resolveHost?: HostResolver;
};

export type StoredAuditSummary = {
  id: number;
  requestedUrl: string;
  status: AuditStatus;
};

type AuditRerunDependencies = {
  authorize: () => Promise<Authorisation>;
  loadAudit: (id: number) => Promise<StoredAuditSummary | null>;
  createAuditRequest: CreateAuditRequest;
  startAudit: StartAudit;
  saveFailure: (id: number, detail: string) => Promise<unknown>;
  onQueued?: OnQueued;
  resolveHost?: HostResolver;
};

const TERMINAL: readonly AuditStatus[] = ["completed", "partial", "failed"];

function detail(error: unknown): string {
  return (error instanceof Error ? error.message : "The audit could not be started.").slice(0, 300);
}

function queued(id: number): AuditActionResult {
  return { status: "queued", id, redirectTo: `/admin/prospecting/audits/${id}` };
}

/**
 * Creates the row, then schedules the job. A row is only left queued if it is
 * genuinely about to run: any scheduling error is recorded on the row so the
 * reviewer never sees an audit that silently never started.
 */
async function createAndStart(
  input: { requestedUrl: string; actor: AuditActor },
  dependencies: {
    createAuditRequest: CreateAuditRequest;
    startAudit: StartAudit;
    saveFailure: (id: number, detail: string) => Promise<unknown>;
    onQueued?: OnQueued;
  },
): Promise<AuditActionResult> {
  const created = await dependencies.createAuditRequest({
    requestedUrl: input.requestedUrl,
    requestedBy: input.actor.id,
  });

  try {
    await dependencies.startAudit({
      auditId: created.id,
      requestedUrl: input.requestedUrl,
      requestedBy: input.actor.id,
    });
  } catch (error) {
    await dependencies.saveFailure(created.id, detail(error)).catch(() => undefined);
    return { status: "error", message: "The audit could not be started. Try again." };
  }

  await dependencies.onQueued?.({
    id: created.id,
    requestedUrl: input.requestedUrl,
    actor: input.actor,
  });

  return queued(created.id);
}

/**
 * The authenticated input workflow, kept dependency-injected so it can be
 * tested without cookies, Neon, a background job, or a network request.
 */
export async function requestAuditForUser(
  formData: FormData,
  dependencies: AuditRequestDependencies,
): Promise<AuditActionResult> {
  const authorised = await dependencies.authorize();
  if (!authorised.ok) return { status: "error", message: authorised.error };

  const rawUrl = String(formData.get("url") ?? "").trim();
  if (!rawUrl) return { status: "error", field: "url", message: "Enter a website URL." };

  let normalizedUrl: string;
  try {
    normalizedUrl = (await normalizeAuditUrl(rawUrl, dependencies.resolveHost)).url;
  } catch {
    return {
      status: "error",
      field: "url",
      message: "Enter a public HTTP or HTTPS URL without credentials.",
    };
  }

  return createAndStart({ requestedUrl: normalizedUrl, actor: authorised.user }, dependencies);
}

/**
 * Recovers an audit that never reached a terminal state, which happens when the
 * process running the job stops before it can record a result. The stuck row is
 * closed as failed and a fresh audit is created for the same URL, so the report
 * history stays truthful about what was actually observed and when.
 */
export async function rerunAuditForUser(
  auditId: number,
  dependencies: AuditRerunDependencies,
): Promise<AuditActionResult> {
  const authorised = await dependencies.authorize();
  if (!authorised.ok) return { status: "error", message: authorised.error };

  const existing = await dependencies.loadAudit(auditId);
  if (!existing) return { status: "error", message: "That audit no longer exists." };
  if (TERMINAL.includes(existing.status)) {
    return {
      status: "error",
      message: "This audit has already finished. Request a new audit instead.",
    };
  }

  // The stored URL was safe when it was accepted; DNS may since have moved it
  // to a private address, so it is checked again before anything is fetched.
  let normalizedUrl: string;
  try {
    normalizedUrl = (await normalizeAuditUrl(existing.requestedUrl, dependencies.resolveHost)).url;
  } catch {
    return {
      status: "error",
      message: "That URL is no longer a safe public address to audit.",
    };
  }

  await dependencies.saveFailure(existing.id, "Superseded by a re-run.").catch(() => undefined);
  return createAndStart({ requestedUrl: normalizedUrl, actor: authorised.user }, dependencies);
}
