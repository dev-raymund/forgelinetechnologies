import { and, between, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import {
  getDb,
  prospectAudits,
  prospects,
  type NewProspect,
  type Prospect,
  type ProspectSource,
} from "../../db/index.ts";
import { saveAuditFailure } from "./audit.ts";
import { isLostClaim } from "./queue.ts";
import { refreshQualificationSnapshot } from "./qualification.ts";
import { BANDS, qualificationSnapshot, qualifyProspect } from "./qualify.ts";
import type { ParsedProspect } from "./csv.ts";

export type UpsertSummary = {
  inserted: number;
  updated: number;
  skippedSuppressed: number;
  /** Updated prospects whose list score could not be refreshed. */
  staleScores: number;
};

/**
 * Pure: turns parsed rows into insert values. Deliberately sets no lifecycle,
 * suppression or decision field — those belong to the row that already exists
 * and must survive a re-import untouched.
 *
 * The score snapshot is set because a new prospect has no audit and no
 * reviewer input yet, so its qualification is exactly its business fit and
 * contact. It reaches inserted rows only: the conflict `set` in
 * `upsertProspects` names its columns and leaves an existing row's snapshot
 * alone.
 */
export function buildUpsertValues(
  rows: ParsedProspect[],
  source: ProspectSource,
  createdBy: number | null,
): NewProspect[] {
  return rows.map((row) => ({
    companyName: row.companyName,
    domain: row.domain,
    websiteUrl: row.websiteUrl,
    industry: row.industry,
    country: row.country,
    location: row.location,
    contactChannel: row.contactChannel,
    contactProvenance: row.contactProvenance,
    sources: [source],
    createdBy,
    ...qualificationSnapshot(
      qualifyProspect({ audit: null, prospect: row, adjustments: {}, opportunityOverride: null }),
    ),
  }));
}

type QualificationFields = {
  country: string;
  industry: string;
  contactChannel: string;
  contactProvenance: string;
};

/** Pure: whether a re-import changed anything business fit or contact is scored from. */
export function qualificationInputsChanged(before: QualificationFields, after: QualificationFields): boolean {
  return (
    before.country !== after.country ||
    before.industry !== after.industry ||
    before.contactChannel !== after.contactChannel ||
    before.contactProvenance !== after.contactProvenance
  );
}

/**
 * Domain-unique upsert.
 *
 * The `WHERE prospects.suppressed_at IS NULL` clause is the opt-out guarantee,
 * enforced in SQL rather than application logic: a business that asked not to be
 * contacted is never revived by someone re-importing an old list.
 */
export async function upsertProspects(
  rows: ParsedProspect[],
  source: ProspectSource,
  actorId: number | null,
): Promise<UpsertSummary> {
  if (rows.length === 0) return { inserted: 0, updated: 0, skippedSuppressed: 0, staleScores: 0 };

  const values = buildUpsertValues(rows, source, actorId);
  const before = await getDb()
    .select({
      id: prospects.id,
      domain: prospects.domain,
      suppressedAt: prospects.suppressedAt,
      country: prospects.country,
      industry: prospects.industry,
      contactChannel: prospects.contactChannel,
      contactProvenance: prospects.contactProvenance,
    })
    .from(prospects)
    .where(inArray(prospects.domain, values.map((v) => v.domain!)));

  const existing = new Map(before.map((r) => [r.domain, r]));
  const suppressed = new Set(before.filter((r) => r.suppressedAt !== null).map((r) => r.domain));

  const returned = await getDb()
    .insert(prospects)
    .values(values)
    .onConflictDoUpdate({
      target: prospects.domain,
      set: {
        companyName: sql`excluded.company_name`,
        websiteUrl: sql`excluded.website_url`,
        industry: sql`excluded.industry`,
        country: sql`excluded.country`,
        location: sql`excluded.location`,
        contactChannel: sql`excluded.contact_channel`,
        contactProvenance: sql`excluded.contact_provenance`,
        sources: sql`${prospects.sources} || excluded.sources`,
        updatedAt: new Date(),
      },
      setWhere: isNull(prospects.suppressedAt),
    })
    .returning({ domain: prospects.domain });

  const touched = new Set(returned.map((r) => r.domain));

  // The upsert is one statement and cannot recompute a score, so a re-import
  // that changed what business fit or contact is scored from refreshes those
  // snapshots here. Suppressed prospects never reach this: the conflict
  // `setWhere` refuses them, so they are not in `touched`.
  let staleScores = 0;
  for (const row of rows) {
    const previous = existing.get(row.domain);
    if (!previous || !touched.has(row.domain) || !qualificationInputsChanged(previous, row)) continue;
    try {
      await refreshQualificationSnapshot(previous.id);
    } catch (error) {
      // The rows are already saved, so this must not read as a failed import.
      // The list keeps this prospect's old score until the next refresh; the
      // detail page is unaffected because it always recomputes.
      console.error("[prospecting] snapshot refresh after import failed", previous.id, error);
      staleScores += 1;
    }
  }

  return {
    inserted: [...touched].filter((d) => !existing.has(d)).length,
    updated: [...touched].filter((d) => existing.has(d)).length,
    skippedSuppressed: [...suppressed].filter((d) => !touched.has(d)).length,
    staleScores,
  };
}

export type ProspectFilter = {
  status?: string;
  opportunity?: string;
  country?: string;
  industry?: string;
  /** One of `DECISION_FILTERS`. Anything else hides dismissed prospects. */
  decision?: string;
  /** A `BandKey`. Anything else is ignored. */
  band?: string;
};

export const DECISION_FILTERS = ["undecided", "qualified", "dismissed"] as const;

/**
 * Dismissed prospects are hidden unless asked for by name: a dismissal is the
 * reviewer saying "stop showing me this".
 */
function decisionClause(decision: string | undefined) {
  switch (decision) {
    case "qualified":
    case "dismissed":
      return eq(prospects.decision, decision);
    case "undecided":
      return eq(prospects.decision, "");
    default:
      return ne(prospects.decision, "dismissed");
  }
}

export function prospectListWhere(filter: ProspectFilter) {
  const band = BANDS.find((candidate) => candidate.key === filter.band);
  return and(
    filter.status ? eq(prospects.status, filter.status) : undefined,
    filter.opportunity ? eq(prospects.primaryOpportunity, filter.opportunity) : undefined,
    filter.country ? eq(prospects.country, filter.country) : undefined,
    filter.industry ? eq(prospects.industry, filter.industry) : undefined,
    decisionClause(filter.decision),
    // Bands are read from the stored effective total, which is exactly what
    // the list shows in its Score column.
    band ? between(prospects.totalScore, band.min, band.max) : undefined,
  );
}

export async function listProspects(filter: ProspectFilter = {}): Promise<Prospect[]> {
  return getDb()
    .select()
    .from(prospects)
    .where(prospectListWhere(filter))
    .orderBy(desc(prospects.totalScore), desc(prospects.id))
    .limit(200);
}

export async function getProspect(id: number): Promise<Prospect | null> {
  const [row] = await getDb().select().from(prospects).where(eq(prospects.id, id)).limit(1);
  return row ?? null;
}

/**
 * Suppression is an opt-out, so it has to stop work that is already scheduled
 * as well as work that has not started: a prospect suppressed while it sits in
 * the queue would otherwise keep its queued audit row and still have its site
 * fetched by the next drain.
 *
 * Audits already at `running` are left alone. That row is owned by the
 * compare-and-swap in `transitionAudit`, and the worker holding it is mid-fetch
 * — `applyResult` will not undo the suppression when it lands.
 */
export async function suppressProspect(id: number, reason: string): Promise<void> {
  await getDb()
    .update(prospects)
    .set({
      status: "suppressed",
      suppressedAt: new Date(),
      suppressionReason: reason.slice(0, 300),
      updatedAt: new Date(),
    })
    .where(eq(prospects.id, id));

  const queued = await getDb()
    .select({ id: prospectAudits.id })
    .from(prospectAudits)
    .where(and(eq(prospectAudits.prospectId, id), eq(prospectAudits.status, "queued")));

  for (const audit of queued) {
    try {
      // queued -> failed is a legal transition. A drain that claimed this audit
      // between the select and here wins the compare-and-swap and this throws;
      // that is the `running` case above, so the rejection is expected and the
      // suppression itself is already committed.
      await saveAuditFailure(audit.id, "Superseded by suppression.");
    } catch (error) {
      // Only that race is expected. Swallowing everything hid the case that
      // matters: if the database is unreachable the cancellation never lands,
      // and the suppressed prospect keeps a live queued audit for the next
      // drain to fetch — the opt-out breach, silently.
      if (!isLostClaim(error)) throw error;
    }
  }
}

export async function unsuppressProspect(id: number): Promise<void> {
  await getDb()
    .update(prospects)
    .set({ status: "new", suppressedAt: null, suppressionReason: "", updatedAt: new Date() })
    .where(eq(prospects.id, id));
}
