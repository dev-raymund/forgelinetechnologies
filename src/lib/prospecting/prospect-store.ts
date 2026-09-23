/**
 * The simplified prospect store.
 *
 * Everything the pipeline reads and writes.
 *
 * Two facts are kept apart on purpose, as they have been since Phase 0:
 * `status` is the person's pipeline judgement, and "Not a Fit" is one of its
 * values; `suppressedAt` is the business asking not to be contacted. The
 * second is an operational and legal state, so it has its own columns and is
 * never folded into the first.
 */
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { PAGE_SIZE, offsetFor, paged, type Paged } from "../admin/pagination.ts";
import { getDb, prospects } from "../../db/index.ts";
import { websiteUrlForDomain } from "./domain.ts";
import {
  OPPORTUNITY_VALUES,
  PROSPECT_STATUSES,
  SERVICE_FOR_OPPORTUNITY,
  type ForgelineService,
  type Opportunity,
  type ProspectStatus,
} from "./types.ts";

/** The columns the list and the detail page actually read. */
export type ProspectRow = {
  id: number;
  companyName: string;
  domain: string;
  websiteUrl: string;
  industry: string;
  country: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  opportunity: Opportunity | "";
  service: ForgelineService | "";
  opportunityReason: string;
  opportunitySetBy: number | null;
  status: string;
  suppressedAt: Date | null;
  suppressionReason: string;
  lastAuditId: number | null;
  lastAuditedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const COLUMNS = {
  id: prospects.id,
  companyName: prospects.companyName,
  domain: prospects.domain,
  websiteUrl: prospects.websiteUrl,
  industry: prospects.industry,
  country: prospects.country,
  location: prospects.location,
  contactEmail: prospects.contactEmail,
  contactPhone: prospects.contactPhone,
  opportunity: prospects.opportunity,
  service: prospects.service,
  opportunityReason: prospects.opportunityReason,
  opportunitySetBy: prospects.opportunitySetBy,
  status: prospects.status,
  suppressedAt: prospects.suppressedAt,
  suppressionReason: prospects.suppressionReason,
  lastAuditId: prospects.lastAuditId,
  lastAuditedAt: prospects.lastAuditedAt,
  createdAt: prospects.createdAt,
  updatedAt: prospects.updatedAt,
} as const;

export type NewProspectInput = {
  companyName: string;
  /** Already normalised by `normalizeDomain`. */
  domain: string;
  industry?: string;
  country?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  opportunity: Opportunity;
  service: ForgelineService | "";
  opportunityReason: string;
  createdBy: number | null;
};

export type CreateProspectResult =
  | { status: "created"; prospect: ProspectRow }
  | { status: "duplicate"; prospect: ProspectRow };

export async function getProspectByDomain(domain: string): Promise<ProspectRow | null> {
  const [row] = await getDb().select(COLUMNS).from(prospects).where(eq(prospects.domain, domain)).limit(1);
  return (row as ProspectRow | undefined) ?? null;
}

export async function getProspectRow(id: number): Promise<ProspectRow | null> {
  const [row] = await getDb().select(COLUMNS).from(prospects).where(eq(prospects.id, id)).limit(1);
  return (row as ProspectRow | undefined) ?? null;
}

/**
 * Creates a prospect, or reports the one that already holds the domain.
 *
 * `domain` is unique, so a duplicate is refused by the database rather than by
 * a check that could race. An existing row is returned untouched: overwriting
 * it would silently discard a status someone had already moved, and inserting
 * a second would mean the same business being worked twice.
 *
 * `opportunitySetBy` is left null, which is how a system-detected opportunity
 * is recorded. It is set to a user id only when a person chooses one.
 */
export async function createProspect(input: NewProspectInput): Promise<CreateProspectResult> {
  const existing = await getProspectByDomain(input.domain);
  if (existing) return { status: "duplicate", prospect: existing };

  const rows = await getDb()
    .insert(prospects)
    .values({
      companyName: input.companyName,
      domain: input.domain,
      websiteUrl: websiteUrlForDomain(input.domain),
      industry: input.industry ?? "",
      country: input.country ?? "",
      location: input.location ?? "",
      contactEmail: input.contactEmail ?? "",
      contactPhone: input.contactPhone ?? "",
      opportunity: input.opportunity,
      service: input.service,
      opportunityReason: input.opportunityReason,
      opportunitySetBy: null,
      status: "To Contact",
      createdBy: input.createdBy,
    })
    .onConflictDoNothing({ target: prospects.domain })
    .returning(COLUMNS);

  const created = rows[0] as ProspectRow | undefined;
  if (created) return { status: "created", prospect: created };

  // Lost the race to a concurrent insert. The other row is the prospect.
  const winner = await getProspectByDomain(input.domain);
  if (!winner) throw new Error("The prospect could not be created.");
  return { status: "duplicate", prospect: winner };
}

export type ProspectFilter = {
  /** Matches company name or domain, case-insensitively. */
  search?: string;
  status?: string;
  opportunity?: string;
  page?: number;
};

/**
 * A filter value is a raw query parameter, so it is matched against the
 * vocabulary rather than cast into it. An unrecognised value is ignored,
 * which shows the unfiltered list instead of an empty one built from a
 * nonsense comparison.
 */
function asStatus(raw: string | undefined): ProspectStatus | undefined {
  return raw && (PROSPECT_STATUSES as readonly string[]).includes(raw) ? (raw as ProspectStatus) : undefined;
}

function asOpportunity(raw: string | undefined): Opportunity | undefined {
  return raw && (OPPORTUNITY_VALUES as readonly string[]).includes(raw) ? (raw as Opportunity) : undefined;
}

export function prospectWhere(filter: ProspectFilter) {
  const term = filter.search?.trim();
  const status = asStatus(filter.status);
  const opportunity = asOpportunity(filter.opportunity);
  return and(
    term ? or(ilike(prospects.companyName, `%${term}%`), ilike(prospects.domain, `%${term}%`)) : undefined,
    status ? eq(prospects.status, status) : undefined,
    opportunity ? eq(prospects.opportunity, opportunity) : undefined,
  );
}

/**
 * Most recently touched first — the pipeline's natural working order.
 *
 * One page, with the matching total beside it, so the list can page rather
 * than truncate. A capped list quietly hides work; a paged one does not.
 */
export async function listProspectRows(filter: ProspectFilter = {}): Promise<Paged<ProspectRow>> {
  const page = Math.max(1, filter.page ?? 1);
  const where = prospectWhere(filter);

  const [rows, totals] = await Promise.all([
    getDb()
      .select(COLUMNS)
      .from(prospects)
      .where(where)
      .orderBy(desc(prospects.updatedAt), desc(prospects.id))
      .limit(PAGE_SIZE)
      .offset(offsetFor(page)),
    getDb().select({ n: count() }).from(prospects).where(where),
  ]);

  return paged(rows as ProspectRow[], totals[0]?.n ?? 0, page);
}

/** How many prospects sit at each status. Counts only, no rates or ratios. */
export async function pipelineCounts(): Promise<Record<string, number>> {
  const rows = await getDb()
    .select({ status: prospects.status, total: count() })
    .from(prospects)
    .groupBy(prospects.status)
    .orderBy(asc(prospects.status));
  return Object.fromEntries(rows.map((row) => [row.status, Number(row.total)]));
}

/** Explicit, and the only thing that moves a prospect. Never automatic. */
export async function setStatus(id: number, status: ProspectStatus): Promise<boolean> {
  const rows = await getDb()
    .update(prospects)
    .set({ status, updatedAt: new Date() })
    .where(eq(prospects.id, id))
    .returning({ id: prospects.id });
  return rows.length > 0;
}

/**
 * Records a person's choice of opportunity.
 *
 * `opportunitySetBy` becomes their user id, which is what later marks this
 * prospect as human-decided so a re-scan does not quietly overwrite it.
 */
export async function setOpportunityByUser(
  id: number,
  input: { opportunity: Opportunity; service: ForgelineService | ""; reason: string; userId: number },
): Promise<boolean> {
  const rows = await getDb()
    .update(prospects)
    .set({
      opportunity: input.opportunity,
      service: input.service,
      opportunityReason: input.reason,
      opportunitySetBy: input.userId,
      updatedAt: new Date(),
    })
    .where(eq(prospects.id, id))
    .returning({ id: prospects.id });
  return rows.length > 0;
}

/**
 * Records a fresh system detection.
 *
 * Refuses when a person has already chosen, unless `replaceHumanChoice` says
 * they asked for it. A re-scan must not silently undo a human decision.
 */
export async function setOpportunityBySystem(
  id: number,
  input: { opportunity: Opportunity; service: ForgelineService | ""; reason: string; replaceHumanChoice?: boolean },
): Promise<boolean> {
  const rows = await getDb()
    .update(prospects)
    .set({
      opportunity: input.opportunity,
      service: input.service,
      opportunityReason: input.reason,
      opportunitySetBy: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(prospects.id, id),
        input.replaceHumanChoice ? undefined : sql`${prospects.opportunitySetBy} IS NULL`,
      ),
    )
    .returning({ id: prospects.id });
  return rows.length > 0;
}

/**
 * The opt-out, and only the opt-out.
 *
 * Writes `suppressedAt` and its reason and nothing else — in particular never
 * `status`, which belongs to the person working the pipeline. Passing `null`
 * lifts it.
 */
export async function setSuppression(id: number, reason: string | null): Promise<boolean> {
  const rows = await getDb()
    .update(prospects)
    .set(
      reason === null
        ? { suppressedAt: null, suppressionReason: "", updatedAt: new Date() }
        : { suppressedAt: new Date(), suppressionReason: reason.slice(0, 300), updatedAt: new Date() },
    )
    .where(eq(prospects.id, id))
    .returning({ id: prospects.id });
  return rows.length > 0;
}

/** The service a detected opportunity implies, as `""` where it implies none. */
export function serviceForOpportunity(opportunity: Opportunity): ForgelineService | "" {
  return SERVICE_FOR_OPPORTUNITY[opportunity];
}
