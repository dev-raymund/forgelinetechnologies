/**
 * Qualification storage.
 *
 * Loads what `qualifyProspect` needs, keeps the list's snapshot columns in
 * step with it, and writes the reviewer's adjustments, override and decision.
 * The rules live in `qualify.ts`, which has no database access.
 */
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  auditFindings,
  getDb,
  prospectAudits,
  prospects,
  type AuditFinding as StoredAuditFinding,
  type Prospect,
} from "../../db/index.ts";
import type { TechnologyIndicator } from "./analyze.ts";
import {
  qualificationSnapshot,
  qualifyProspect,
  type Qualification,
  type QualifyInput,
} from "./qualify.ts";
import type {
  AuditFinding,
  ComponentKey,
  Confidence,
  FindingCategory,
  FindingSeverity,
  JsonValue,
  OpportunityOverride,
  ScoreAdjustment,
} from "./types.ts";

const CONFIDENCES: readonly string[] = ["low", "medium", "high"];

type DecisionInput = { decision: "qualified" | "dismissed"; reason: string; userId: number };

/** Pure: a stored finding row back in the shape the scorer reads. */
export function toObservedFinding(row: StoredAuditFinding): AuditFinding {
  return {
    id: String(row.id),
    category: row.category as FindingCategory,
    rule: row.rule,
    severity: row.severity as FindingSeverity,
    pageUrl: row.pageUrl,
    evidence: row.evidence as Record<string, JsonValue>,
    recommendation: row.recommendation,
    confidence: row.confidence as Confidence,
    observedAt: row.observedAt.toISOString(),
  };
}

/**
 * Pure: the technology indicators in a stored report. The report is untyped
 * jsonb, so anything that is not a well-formed indicator is dropped rather
 * than trusted.
 */
export function storedTechnologyIndicators(report: Record<string, unknown>): TechnologyIndicator[] {
  const raw = report.technologyIndicators;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is TechnologyIndicator => {
    if (typeof item !== "object" || item === null) return false;
    const { name, signal, confidence } = item as Record<string, unknown>;
    return (
      typeof name === "string" &&
      typeof signal === "string" &&
      typeof confidence === "string" &&
      CONFIDENCES.includes(confidence)
    );
  });
}

/** Pure: the decision columns for a decision, or for clearing one. */
export function decisionValues(
  input: DecisionInput | null,
  now: Date,
): { decision: string; decisionReason: string; decidedBy: number | null; decidedAt: Date | null } {
  return input
    ? { decision: input.decision, decisionReason: input.reason, decidedBy: input.userId, decidedAt: now }
    : { decision: "", decisionReason: "", decidedBy: null, decidedAt: null };
}

/**
 * The prospect's most recent audit that produced findings. It is looked up
 * directly rather than through `last_audit_id`, which Phase 2 deliberately
 * leaves pointing at a failed run so its error stays readable.
 */
export async function latestUsableAudit(prospectId: number): Promise<QualifyInput["audit"]> {
  const [audit] = await getDb()
    .select({ id: prospectAudits.id, report: prospectAudits.report })
    .from(prospectAudits)
    .where(
      and(
        eq(prospectAudits.prospectId, prospectId),
        inArray(prospectAudits.status, ["completed", "partial"]),
      ),
    )
    .orderBy(desc(prospectAudits.id))
    .limit(1);
  if (!audit) return null;

  const rows = await getDb()
    .select()
    .from(auditFindings)
    .where(eq(auditFindings.auditId, audit.id))
    .orderBy(asc(auditFindings.id));

  return {
    id: audit.id,
    findings: rows.map(toObservedFinding),
    technologyIndicators: storedTechnologyIndicators(audit.report),
  };
}

export async function loadQualification(
  prospectId: number,
): Promise<{ prospect: Prospect; qualification: Qualification } | null> {
  const [prospect] = await getDb().select().from(prospects).where(eq(prospects.id, prospectId)).limit(1);
  if (!prospect) return null;

  const audit = await latestUsableAudit(prospectId);
  const qualification = qualifyProspect({
    audit,
    prospect: {
      country: prospect.country,
      industry: prospect.industry,
      contactChannel: prospect.contactChannel,
      contactProvenance: prospect.contactProvenance,
    },
    adjustments: prospect.scoreAdjustments ?? {},
    opportunityOverride: prospect.opportunityOverride ?? null,
  });
  return { prospect, qualification };
}

/**
 * Recomputes the list's `total_score` and `primary_opportunity` and writes
 * those two columns only. Never `status`, `suppressed_at` or the decision:
 * those belong to the pipeline and the reviewer.
 */
export async function refreshQualificationSnapshot(prospectId: number): Promise<void> {
  const loaded = await loadQualification(prospectId);
  if (!loaded) return;
  await getDb()
    .update(prospects)
    .set(qualificationSnapshot(loaded.qualification))
    .where(eq(prospects.id, prospectId));
}

export async function setScoreAdjustment(
  prospectId: number,
  component: ComponentKey,
  adjustment: ScoreAdjustment,
): Promise<boolean> {
  // `||` merges one key into the stored object in a single statement, so two
  // reviewers adjusting different components cannot overwrite each other.
  const rows = await getDb()
    .update(prospects)
    .set({
      scoreAdjustments: sql`${prospects.scoreAdjustments} || ${JSON.stringify({ [component]: adjustment })}::jsonb`,
      updatedAt: new Date(),
    })
    .where(eq(prospects.id, prospectId))
    .returning({ id: prospects.id });
  return rows.length > 0;
}

export async function clearScoreAdjustment(prospectId: number, component: ComponentKey): Promise<boolean> {
  const rows = await getDb()
    .update(prospects)
    .set({
      scoreAdjustments: sql`${prospects.scoreAdjustments} - ${component}::text`,
      updatedAt: new Date(),
    })
    .where(eq(prospects.id, prospectId))
    .returning({ id: prospects.id });
  return rows.length > 0;
}

export async function setOpportunityOverride(
  prospectId: number,
  override: OpportunityOverride,
): Promise<boolean> {
  const rows = await getDb()
    .update(prospects)
    .set({ opportunityOverride: override, updatedAt: new Date() })
    .where(eq(prospects.id, prospectId))
    .returning({ id: prospects.id });
  return rows.length > 0;
}

export async function clearOpportunityOverride(prospectId: number): Promise<boolean> {
  const rows = await getDb()
    .update(prospects)
    .set({ opportunityOverride: null, updatedAt: new Date() })
    .where(eq(prospects.id, prospectId))
    .returning({ id: prospects.id });
  return rows.length > 0;
}

/**
 * A suppressed prospect cannot be qualified. Suppression is the business's
 * opt-out, and the Qualified shortlist is what later outreach draws from. The
 * guard is in the UPDATE so a suppression that commits while the reviewer is
 * deciding still wins.
 */
export async function setDecision(prospectId: number, input: DecisionInput): Promise<boolean> {
  const rows = await getDb()
    .update(prospects)
    .set({ ...decisionValues(input, new Date()), updatedAt: new Date() })
    .where(
      and(
        eq(prospects.id, prospectId),
        input.decision === "qualified" ? isNull(prospects.suppressedAt) : undefined,
      ),
    )
    .returning({ id: prospects.id });
  return rows.length > 0;
}

export async function clearDecision(prospectId: number): Promise<boolean> {
  const rows = await getDb()
    .update(prospects)
    .set({ ...decisionValues(null, new Date()), updatedAt: new Date() })
    .where(eq(prospects.id, prospectId))
    .returning({ id: prospects.id });
  return rows.length > 0;
}
