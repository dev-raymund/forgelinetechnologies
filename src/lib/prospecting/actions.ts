"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authorise } from "@/lib/auth/guard";
import { audit, type AuditAction } from "@/lib/auth/audit";
import {
  createAuditRequest,
  getAuditSummary,
  saveAuditFailure,
} from "@/lib/prospecting/audit";
import { runAuditInBackground } from "@/lib/prospecting/run";
import { rerunAuditForUser, type AuditActionResult } from "@/lib/prospecting/admin";
import { normalizeDomain, websiteUrlForDomain } from "@/lib/prospecting/domain";
import {
  createProspect,
  getProspectRow,
  serviceForOpportunity,
  setOpportunityByUser,
  setOpportunityBySystem,
  setStatus,
  setSuppression,
} from "@/lib/prospecting/prospect-store";
import {
  validateCompanyName,
  validateContactEmail,
  validateContactPhone,
  validateCountry,
  validateDomain,
  validateOpportunity,
  validateProspectId,
  validateService,
  validateStatus,
  validateText,
  INDUSTRY_MAX,
  LOCATION_MAX,
  REASON_MAX,
} from "@/lib/prospecting/prospect-input";
import { normalizeAuditUrl } from "@/lib/prospecting/url-safety";
import { scanWebsite } from "@/lib/prospecting/run";
import { detectOpportunity } from "@/lib/prospecting/opportunity";
import { toScanView, type ScanView } from "@/lib/prospecting/scan-view";
import { outreachFromView } from "@/lib/prospecting/outreach";

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

export type AnalyzeWebsiteResult =
  | { status: "error"; message: string }
  | { status: "ok"; view: ScanView };

/**
 * The prospecting screen's one server entry point: read a website, decide the
 * opportunity, hand back what the screen shows.
 *
 * It writes nothing. No prospect row, no audit row, no audit-log entry — the
 * result lives in the request that asked for it, and persistence arrives with
 * the status tracking it belongs to.
 *
 * The URL is normalised through the two functions that already exist rather
 * than a validator written here. `normalizeDomain` accepts what people
 * actually type ("example.com", "www.example.com", a deep link) and reduces it
 * to a host; `websiteUrlForDomain` turns that into the homepage URL, so a
 * tracking query or a stale deep link never becomes the page that is read; and
 * `normalizeAuditUrl` applies the SSRF guard, which `fetchBoundedPage` then
 * applies again on the request and on every redirect hop.
 *
 * A URL that cannot be used is an error, because there is nothing to show. A
 * website that cannot be read is NOT an error: the scan comes back with its
 * failure recorded, and the rules turn that into a Needs Manual Review result,
 * which is a more useful thing to put in front of someone than an error box.
 */
export async function analyzeWebsite(formData: FormData): Promise<AnalyzeWebsiteResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { status: "error", message: authorised.error };

  const raw = String(formData.get("url") ?? "").trim();
  if (!raw) return { status: "error", message: "Enter a website address." };

  const domain = normalizeDomain(raw);
  if (!domain) {
    return { status: "error", message: "That is not a website address. Try something like example.com." };
  }

  let url: string;
  try {
    url = (await normalizeAuditUrl(websiteUrlForDomain(domain))).url;
  } catch {
    // Deliberately not the thrown message: the guard distinguishes private
    // addresses from malformed ones, and which one a host tripped is not
    // something an unauthenticated guess should be able to probe for.
    return {
      status: "error",
      message: "That website could not be analyzed. It must be a public HTTP or HTTPS address.",
    };
  }

  try {
    const scan = await scanWebsite(url);
    return { status: "ok", view: toScanView(scan, detectOpportunity(scan)) };
  } catch (error) {
    // `scanWebsite` records a failed fetch on the result rather than throwing,
    // so reaching here means something unexpected. The cause goes to the
    // server log; the screen gets a sentence with nothing internal in it.
    console.error("[prospecting] analyze failed", domain, error);
    return { status: "error", message: "That website could not be analyzed. Try again, or try another address." };
  }
}

export type ProspectActionResult = { ok: true } | { error: string };

const GONE = "That prospect no longer exists.";

function revalidateProspect(id?: number) {
  revalidatePath("/admin/prospecting/prospects");
  if (id !== undefined) revalidatePath(`/admin/prospecting/prospects/${id}`);
}

export type SaveProspectResult =
  | { status: "created"; id: number }
  | { status: "duplicate"; id: number; companyName: string }
  | { status: "error"; message: string };

/**
 * Saves an analysed website as a prospect.
 *
 * Takes what the scan already established — it never fetches the site again.
 * The opportunity is recorded as a system detection, so `opportunitySetBy`
 * stays null until a person chooses one.
 *
 * A domain already in the table is reported back rather than overwritten or
 * duplicated: overwriting would discard a status someone had already moved,
 * and a second row would mean the same business worked twice.
 */
export async function saveProspect(input: {
  companyName: string;
  websiteUrl: string;
  opportunity: string;
  service: string;
  opportunityReason: string;
  industry?: string;
  country?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
}): Promise<SaveProspectResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { status: "error", message: authorised.error };

  const name = validateCompanyName(input.companyName);
  if (!name.ok) return { status: "error", message: name.error };
  const domain = validateDomain(input.websiteUrl);
  if (!domain.ok) return { status: "error", message: domain.error };
  const opportunity = validateOpportunity(input.opportunity);
  if (!opportunity.ok) return { status: "error", message: opportunity.error };
  const service = validateService(input.service);
  if (!service.ok) return { status: "error", message: service.error };
  const reason = validateText(input.opportunityReason, REASON_MAX, "the reason");
  if (!reason.ok) return { status: "error", message: reason.error };
  const industry = validateText(input.industry, INDUSTRY_MAX, "the industry");
  if (!industry.ok) return { status: "error", message: industry.error };
  const location = validateText(input.location, LOCATION_MAX, "the location");
  if (!location.ok) return { status: "error", message: location.error };
  const country = validateCountry(input.country);
  if (!country.ok) return { status: "error", message: country.error };
  const email = validateContactEmail(input.contactEmail);
  if (!email.ok) return { status: "error", message: email.error };
  const phone = validateContactPhone(input.contactPhone);
  if (!phone.ok) return { status: "error", message: phone.error };

  let result;
  try {
    result = await createProspect({
      companyName: name.value,
      domain: domain.value,
      industry: industry.value,
      country: country.value,
      location: location.value,
      contactEmail: email.value,
      contactPhone: phone.value,
      opportunity: opportunity.value,
      service: service.value,
      opportunityReason: reason.value,
      createdBy: authorised.user.id,
    });
  } catch (error) {
    console.error("[prospecting] saving a prospect failed", domain.value, error);
    return { status: "error", message: "That prospect could not be saved. Try again." };
  }

  if (result.status === "duplicate") {
    return { status: "duplicate", id: result.prospect.id, companyName: result.prospect.companyName };
  }

  await audit({
    action: "prospect.import",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: result.prospect.id,
    detail: `${domain.value}: ${opportunity.value}`,
  });
  revalidateProspect(result.prospect.id);
  return { status: "created", id: result.prospect.id };
}

/** The only thing that moves a prospect through the pipeline. */
export async function setProspectStatus(
  prospectId: number,
  status: string,
): Promise<ProspectActionResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { error: id.error };
  const value = validateStatus(status);
  if (!value.ok) return { error: value.error };

  if (!(await setStatus(id.value, value.value))) return { error: GONE };

  await audit({
    action: "prospect.status",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id.value,
    detail: value.value,
  });
  revalidateProspect(id.value);
  return { ok: true };
}

/**
 * A person's choice of opportunity, which the detector must not later undo.
 *
 * The service is taken from the person's own selection rather than derived,
 * because three of the opportunities are human-only and the vocabulary maps no
 * service to two others. An empty service is a valid answer.
 */
export async function setProspectOpportunity(
  prospectId: number,
  opportunity: string,
  service: string,
  reason: string,
): Promise<ProspectActionResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { error: id.error };
  const chosen = validateOpportunity(opportunity);
  if (!chosen.ok) return { error: chosen.error };
  const chosenService = validateService(service);
  if (!chosenService.ok) return { error: chosenService.error };
  const text = validateText(reason, REASON_MAX, "the reason");
  if (!text.ok) return { error: text.error };

  const saved = await setOpportunityByUser(id.value, {
    opportunity: chosen.value,
    service: chosenService.value,
    reason: text.value || `Set by ${authorised.user.email}.`,
    userId: authorised.user.id,
  });
  if (!saved) return { error: GONE };

  await audit({
    action: "prospect.opportunity.set",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id.value,
    detail: `${chosen.value}${chosenService.value ? ` / ${chosenService.value}` : ""}`,
  });
  revalidateProspect(id.value);
  return { ok: true };
}

export type ReanalyzeResult =
  | { status: "error"; message: string }
  | { status: "ok"; view: ScanView; applied: boolean; humanChoiceKept: boolean };

/**
 * Re-runs the quick scan for a saved prospect.
 *
 * Quick mode, never the full audit. The fresh result is always shown; whether
 * it is written depends on who chose the current opportunity. A person's
 * choice is kept unless they explicitly ask for it to be replaced, so a
 * re-scan can never quietly undo a human decision.
 */
export async function reanalyzeProspect(
  prospectId: number,
  replaceHumanChoice = false,
): Promise<ReanalyzeResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { status: "error", message: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { status: "error", message: id.error };

  const prospect = await getProspectRow(id.value);
  if (!prospect) return { status: "error", message: GONE };

  let url: string;
  try {
    url = (await normalizeAuditUrl(websiteUrlForDomain(prospect.domain))).url;
  } catch {
    return { status: "error", message: "That website could not be analyzed. It must be a public HTTP or HTTPS address." };
  }

  let view: ScanView;
  try {
    const scan = await scanWebsite(url);
    view = toScanView(scan, detectOpportunity(scan));
  } catch (error) {
    console.error("[prospecting] re-analyze failed", prospect.domain, error);
    return { status: "error", message: "That website could not be analyzed. Try again." };
  }

  const humanChose = prospect.opportunitySetBy !== null;
  const applied = await setOpportunityBySystem(id.value, {
    opportunity: view.opportunity,
    service: serviceForOpportunity(view.opportunity),
    reason: view.reason,
    replaceHumanChoice,
  });

  revalidateProspect(id.value);
  return { status: "ok", view, applied, humanChoiceKept: humanChose && !applied };
}

/**
 * The business's opt-out. Writes only the suppression columns — never
 * `status`, which is the person's pipeline judgement and a different fact.
 */
export async function setProspectSuppression(
  prospectId: number,
  reason: string | null,
): Promise<ProspectActionResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { error: id.error };
  if (reason !== null && !reason.trim()) {
    return { error: "Give a reason before suppressing this prospect." };
  }

  if (!(await setSuppression(id.value, reason))) return { error: GONE };

  await audit({
    action: reason === null ? "prospect.unsuppress" : "prospect.suppress",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id.value,
    detail: reason ?? "",
  });
  revalidateProspect(id.value);
  return { ok: true };
}

export type ProspectOutreachResult =
  | { status: "error"; message: string }
  | { status: "skip"; reason: string }
  | { status: "draft"; subject: string; body: string; opportunity: string; humanChoiceDiffers: boolean };

/**
 * The outreach draft for a saved prospect.
 *
 * Re-reads the homepage first, deliberately: an email that cites an
 * observation should cite one that is true today, not one recorded weeks ago.
 * It is the same single bounded fetch as any quick scan, and it writes
 * nothing — not the opportunity, not the status, not the draft.
 *
 * The saved company name wins over the page title, because a person may have
 * corrected it.
 */
export async function generateProspectOutreach(prospectId: number): Promise<ProspectOutreachResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { status: "error", message: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { status: "error", message: id.error };

  const prospect = await getProspectRow(id.value);
  if (!prospect) return { status: "error", message: GONE };

  let url: string;
  try {
    url = (await normalizeAuditUrl(websiteUrlForDomain(prospect.domain))).url;
  } catch {
    return { status: "error", message: "That website could not be read. It must be a public HTTP or HTTPS address." };
  }

  let view: ScanView;
  try {
    const scan = await scanWebsite(url);
    view = { ...toScanView(scan, detectOpportunity(scan)), siteName: prospect.companyName };
  } catch (error) {
    console.error("[prospecting] outreach scan failed", prospect.domain, error);
    return { status: "error", message: "That website could not be read. Try again." };
  }

  const result = outreachFromView(view);
  if (result.kind === "skip") return { status: "skip", reason: result.reason };

  return {
    status: "draft",
    subject: result.draft.subject,
    body: result.draft.body,
    opportunity: view.opportunity,
    // A person chose the saved opportunity and the site now reads differently.
    // Worth saying so rather than letting the two quietly disagree.
    humanChoiceDiffers: prospect.opportunitySetBy !== null && prospect.opportunity !== view.opportunity,
  };
}
