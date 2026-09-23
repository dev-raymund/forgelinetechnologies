/**
 * Who ForgeLine is trying to reach.
 *
 * The target markets and industries from the project's CLAUDE.md. Nothing here
 * scores anything: these are facts about ForgeLine's own targeting.
 *
 * Nothing reads them today. They are kept because they encode a business
 * decision rather than an implementation, and the obvious uses — flagging a
 * prospect as in-market, or saying something true about an industry in an
 * email — are a few lines away when wanted.
 */

/** `UK` sits beside `GB`: Phase 2 stores the two letters as typed, and `UK` is what people type. */
export const TARGET_MARKETS: ReadonlyMap<string, string> = new Map([
  ["AU", "Australia"],
  ["GB", "United Kingdom"],
  ["UK", "United Kingdom"],
  ["US", "United States"],
  ["CA", "Canada"],
]);

/**
 * The target industries from CLAUDE.md, each with the exact values accepted
 * after `normalizeIndustry`. Matching is by whole string only: "Rebuild Church
 * Ministries" must never match Construction. Extending the table is a one-line
 * reviewed change.
 */
export const INDUSTRY_SYNONYMS: Readonly<Record<string, readonly string[]>> = {
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

/** Lower-cased, punctuation other than `&` removed, whitespace collapsed and trimmed. */
export function normalizeIndustry(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s&]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The canonical industry for a raw value, or null when it is not a target industry. */
export function targetIndustry(raw: string): string | null {
  return CANONICAL_BY_SYNONYM.get(normalizeIndustry(raw)) ?? null;
}

/** The market name for a stored two-letter country code, or null when it is not a target market. */
export function targetMarket(rawCountry: string): string | null {
  return TARGET_MARKETS.get(rawCountry.trim().toUpperCase()) ?? null;
}
