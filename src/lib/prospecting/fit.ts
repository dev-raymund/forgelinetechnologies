/**
 * Business fit and decision-maker availability.
 *
 * Both are scored by fixed rules over the prospect's own record, never by
 * inference from free text. Anything a rule cannot match scores 0 and says
 * why, so a reviewer can award it with a reason instead.
 */
import { classifyContact, type ContactKind } from "./contact.ts";

export type RuleScore = { points: number; evidence: string[] };

/** `UK` sits beside `GB`: Phase 2 stores the two letters as typed, and `UK` is what people type. */
const TARGET_MARKETS = new Map([
  ["AU", "Australia"],
  ["GB", "United Kingdom"],
  ["UK", "United Kingdom"],
  ["US", "United States"],
  ["CA", "Canada"],
]);

/**
 * The target industries from the project's CLAUDE.md, each with the exact
 * values accepted after `normalizeIndustry`. Matching is by whole string only:
 * "Rebuild Church Ministries" must never score as Construction. Extending the
 * table is a one-line reviewed change.
 */
const INDUSTRY_SYNONYMS: Record<string, readonly string[]> = {
  Accounting: ["accounting", "accountant", "accountants", "accountancy", "bookkeeping", "tax accounting"],
  "Real estate": ["real estate", "property", "property management", "realty", "estate agents", "real estate agency"],
  Recruitment: ["recruitment", "recruiting", "recruitment agency", "staffing", "employment agency"],
  Consulting: ["consulting", "consultancy", "management consulting"],
  "Professional services": ["professional services"],
  Construction: ["construction", "builders", "building contractors", "civil construction"],
  Healthcare: ["healthcare", "health care", "medical", "medical practice", "dental", "allied health"],
  Education: ["education", "training", "tutoring", "schools", "higher education"],
};

const CANONICAL_BY_SYNONYM = new Map(
  Object.entries(INDUSTRY_SYNONYMS).flatMap(([canonical, synonyms]) =>
    synonyms.map((synonym) => [synonym, canonical] as const),
  ),
);

const CONTACT_LABEL: Record<ContactKind, string> = {
  "role-email": "role email",
  url: "contact page",
  phone: "phone",
};

/** Why contact can never reach 10 on its own. */
export const REVIEWER_ONLY_ROLE = "the other 5 need a reviewer to confirm a published decision-making role";

/** Lower-cased, punctuation other than `&` removed, whitespace collapsed and trimmed. */
export function normalizeIndustry(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s&]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function targetIndustry(raw: string): string | null {
  return CANONICAL_BY_SYNONYM.get(normalizeIndustry(raw)) ?? null;
}

export function scoreBusinessFit(prospect: { country: string; industry: string }): RuleScore {
  const evidence: string[] = [];
  let points = 0;

  const country = prospect.country.trim().toUpperCase();
  const market = TARGET_MARKETS.get(country);
  if (!country) {
    evidence.push("no country recorded");
  } else if (market) {
    points += 5;
    evidence.push(`${country} — target market (${market})`);
  } else {
    evidence.push(`${country} — not a target market`);
  }

  const industry = prospect.industry.trim();
  const canonical = industry ? targetIndustry(industry) : null;
  if (!industry) {
    evidence.push("no industry recorded");
  } else if (canonical) {
    points += 5;
    evidence.push(`'${industry}' → ${canonical}`);
  } else {
    evidence.push(`'${industry}' — industry not recognised`);
  }

  return { points, evidence };
}

/**
 * A public business channel earns 5. The channel is re-classified at read
 * time, so a bad value that somehow reached the database earns nothing. The
 * other 5 are never automatic: a generic `info@` must not pretend to reach a
 * decision-maker.
 */
export function scoreContact(prospect: { contactChannel: string; contactProvenance: string }): RuleScore {
  const channel = prospect.contactChannel.trim();
  const provenance = prospect.contactProvenance.trim();

  if (!channel) return { points: 0, evidence: ["no public contact channel recorded", REVIEWER_ONLY_ROLE] };
  if (!provenance) {
    return { points: 0, evidence: ["contact channel has no recorded provenance", REVIEWER_ONLY_ROLE] };
  }

  const classified = classifyContact(channel);
  if (!classified.ok) {
    // `reason` describes the rule and never echoes the stored value.
    return {
      points: 0,
      evidence: [`stored contact no longer qualifies: ${classified.reason}`, REVIEWER_ONLY_ROLE],
    };
  }

  return {
    points: 5,
    evidence: [`${CONTACT_LABEL[classified.kind]} ${classified.value} — ${provenance}`, REVIEWER_ONLY_ROLE],
  };
}
