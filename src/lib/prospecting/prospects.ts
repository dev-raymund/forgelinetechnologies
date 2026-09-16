import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  getDb,
  prospectAudits,
  prospects,
  type NewProspect,
  type Prospect,
  type ProspectSource,
} from "../../db/index.ts";
import { saveAuditFailure } from "./audit.ts";
import type { ParsedProspect } from "./csv.ts";

export type UpsertSummary = { inserted: number; updated: number; skippedSuppressed: number };

/**
 * Pure: turns parsed rows into insert values. Deliberately sets no lifecycle,
 * score, or suppression field — those belong to the row that already exists and
 * must survive a re-import untouched.
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
  }));
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
  if (rows.length === 0) return { inserted: 0, updated: 0, skippedSuppressed: 0 };

  const values = buildUpsertValues(rows, source, actorId);
  const before = await getDb()
    .select({ domain: prospects.domain, suppressedAt: prospects.suppressedAt })
    .from(prospects)
    .where(inArray(prospects.domain, values.map((v) => v.domain!)));

  const existing = new Set(before.map((r) => r.domain));
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
  return {
    inserted: [...touched].filter((d) => !existing.has(d)).length,
    updated: [...touched].filter((d) => existing.has(d)).length,
    skippedSuppressed: [...suppressed].filter((d) => !touched.has(d)).length,
  };
}

export type ProspectFilter = {
  status?: string;
  opportunity?: string;
  country?: string;
  industry?: string;
};

export async function listProspects(filter: ProspectFilter = {}): Promise<Prospect[]> {
  const clauses = [
    filter.status ? eq(prospects.status, filter.status) : undefined,
    filter.opportunity ? eq(prospects.primaryOpportunity, filter.opportunity) : undefined,
    filter.country ? eq(prospects.country, filter.country) : undefined,
    filter.industry ? eq(prospects.industry, filter.industry) : undefined,
  ].filter((clause) => clause !== undefined);

  return getDb()
    .select()
    .from(prospects)
    .where(clauses.length ? and(...clauses) : undefined)
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
    // queued -> failed is a legal transition. A drain that claimed this audit
    // between the select and here wins the compare-and-swap and this throws;
    // that is the `running` case above, so the rejection is expected and the
    // suppression itself is already committed.
    await saveAuditFailure(audit.id, "Superseded by suppression.").catch(() => undefined);
  }
}

export async function unsuppressProspect(id: number): Promise<void> {
  await getDb()
    .update(prospects)
    .set({ status: "new", suppressedAt: null, suppressionReason: "", updatedAt: new Date() })
    .where(eq(prospects.id, id));
}
