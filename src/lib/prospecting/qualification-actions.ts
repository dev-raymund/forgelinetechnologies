"use server";

import { revalidatePath } from "next/cache";
import { authorise } from "@/lib/auth/guard";
import { audit } from "@/lib/auth/audit";
import { COMPONENTS } from "@/lib/prospecting/qualify";
import {
  clearDecision,
  clearOpportunityOverride,
  clearScoreAdjustment,
  latestUsableAudit,
  refreshQualificationSnapshot,
  setDecision,
  setOpportunityOverride,
  setScoreAdjustment,
} from "@/lib/prospecting/qualification";
import { getProspect } from "@/lib/prospecting/prospects";
import {
  validateAdjustment,
  validateComponentKey,
  validateDecision,
  validateOverride,
  validateProspectId,
} from "@/lib/prospecting/review-input";

export type QualificationActionResult = { ok: true } | { error: string };

const GONE = "That prospect no longer exists.";

/** Both pages show qualification: the list through its snapshot columns. */
function revalidateProspect(id: number) {
  revalidatePath("/admin/prospecting/prospects");
  revalidatePath(`/admin/prospecting/prospects/${id}`);
}

function labelFor(component: string): string {
  return COMPONENTS.find((definition) => definition.key === component)?.label ?? component;
}

export async function adjustScoreAction(
  prospectId: number,
  component: string,
  points: number,
  reason: string,
): Promise<QualificationActionResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { error: id.error };
  const input = validateAdjustment({ component, points, reason });
  if (!input.ok) return { error: input.error };

  const definition = COMPONENTS.find((c) => c.key === input.value.component);
  let auditId: number | null = null;
  if (definition?.findingBased) {
    // Pinned to the audit whose findings the reviewer judged, so a newer audit
    // makes the adjustment stale instead of letting it outlive its evidence.
    const latest = await latestUsableAudit(id.value);
    if (!latest) return { error: "Run an audit before adjusting a website component." };
    auditId = latest.id;
  }

  const saved = await setScoreAdjustment(id.value, input.value.component, {
    points: input.value.points,
    reason: input.value.reason,
    byUserId: authorised.user.id,
    byEmail: authorised.user.email,
    at: new Date().toISOString(),
    auditId,
  });
  if (!saved) return { error: GONE };

  await refreshQualificationSnapshot(id.value);
  await audit({
    action: "prospect.score.adjust",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id.value,
    detail: `${labelFor(input.value.component)} → ${input.value.points}: ${input.value.reason}`,
  });
  revalidateProspect(id.value);
  return { ok: true };
}

export async function clearScoreAdjustmentAction(
  prospectId: number,
  component: string,
): Promise<QualificationActionResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { error: id.error };
  const key = validateComponentKey(component);
  if (!key.ok) return { error: key.error };

  if (!(await clearScoreAdjustment(id.value, key.value))) return { error: GONE };

  await refreshQualificationSnapshot(id.value);
  await audit({
    action: "prospect.score.clear",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id.value,
    detail: labelFor(key.value),
  });
  revalidateProspect(id.value);
  return { ok: true };
}

export async function setOpportunityOverrideAction(
  prospectId: number,
  primary: string,
  secondary: string[],
  reason: string,
): Promise<QualificationActionResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { error: id.error };
  const input = validateOverride({ primary, secondary, reason });
  if (!input.ok) return { error: input.error };

  const saved = await setOpportunityOverride(id.value, {
    ...input.value,
    byUserId: authorised.user.id,
    byEmail: authorised.user.email,
    at: new Date().toISOString(),
  });
  if (!saved) return { error: GONE };

  await refreshQualificationSnapshot(id.value);
  const chosen = [input.value.primary, ...input.value.secondary].join(", ");
  await audit({
    action: "prospect.opportunity.set",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id.value,
    detail: `${chosen}: ${input.value.reason}`,
  });
  revalidateProspect(id.value);
  return { ok: true };
}

export async function clearOpportunityOverrideAction(prospectId: number): Promise<QualificationActionResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { error: id.error };

  if (!(await clearOpportunityOverride(id.value))) return { error: GONE };

  await refreshQualificationSnapshot(id.value);
  await audit({
    action: "prospect.opportunity.clear",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id.value,
  });
  revalidateProspect(id.value);
  return { ok: true };
}

export async function qualifyProspectAction(
  prospectId: number,
  reason: string,
): Promise<QualificationActionResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { error: id.error };
  const input = validateDecision({ decision: "qualified", reason });
  if (!input.ok) return { error: input.error };

  const prospect = await getProspect(id.value);
  if (!prospect) return { error: GONE };
  if (prospect.suppressedAt !== null) {
    return { error: "This prospect is suppressed. Unsuppress it before qualifying." };
  }

  const saved = await setDecision(id.value, { ...input.value, userId: authorised.user.id });
  if (!saved) {
    return { error: "This prospect was suppressed or removed while you were deciding. Reload and try again." };
  }

  await audit({
    action: "prospect.qualify",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id.value,
    detail: input.value.reason,
  });
  revalidateProspect(id.value);
  return { ok: true };
}

export async function dismissProspectAction(
  prospectId: number,
  reason: string,
): Promise<QualificationActionResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { error: id.error };
  const input = validateDecision({ decision: "dismissed", reason });
  if (!input.ok) return { error: input.error };

  if (!(await setDecision(id.value, { ...input.value, userId: authorised.user.id }))) return { error: GONE };

  await audit({
    action: "prospect.dismiss",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id.value,
    detail: input.value.reason,
  });
  revalidateProspect(id.value);
  return { ok: true };
}

export async function clearDecisionAction(prospectId: number): Promise<QualificationActionResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { error: id.error };

  if (!(await clearDecision(id.value))) return { error: GONE };

  await audit({
    action: "prospect.decision.clear",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id.value,
  });
  revalidateProspect(id.value);
  return { ok: true };
}
