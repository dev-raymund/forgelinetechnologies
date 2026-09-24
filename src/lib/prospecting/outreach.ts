/**
 * The outreach draft.
 *
 * Turns one detected opportunity into a short permission-based email for a
 * person to read, edit and send themselves. It sends nothing, stores nothing,
 * and asks nothing of the network.
 *
 * Deterministic templates, not AI: the same input always produces the same
 * output, there is no randomness and no timestamp in the copy, and the tool
 * works without an API key or a subscription.
 *
 * The discipline that matters here is what the email may say. Every sentence
 * about the business restates something the scan actually observed. Nothing
 * infers size, revenue, traffic, rankings, competitors, customers or history,
 * and nothing manufactures familiarity — there is no "I love what you're
 * doing" and no "I've followed you for a while", because neither is true.
 *
 * Pure: no database, no network, no authentication, no React, no environment
 * variable, no AI.
 */
import type { Observation } from "./findings-summary.ts";
import type { OpportunityResult } from "./opportunity.ts";
import type { ScanView } from "./scan-view.ts";
import type { ForgelineService, Opportunity } from "./types.ts";

export type OutreachDraft = {
  subject: string;
  body: string;
};

export type OutreachGenerationResult =
  | { kind: "draft"; draft: OutreachDraft }
  | { kind: "skip"; reason: string };

export type OutreachSender = {
  name: string;
  company: string;
  website: string;
};

/**
 * Who the draft is from.
 *
 * Literals rather than an import from `site.ts`, which resolves its origin
 * from the environment at module load — this module is deliberately free of
 * that so it can be reasoned about, and tested, in isolation. The host is the
 * apex domain because `site.ts` states that is the canonical one.
 */
export const FORGELINE_SENDER: OutreachSender = {
  name: "Raymund Hermoso",
  company: "Forgeline Technologies",
  website: "https://forgelinetechnologies.com",
};

/** Only what the draft needs; a full `OpportunityResult` satisfies it. */
export type OutreachOpportunity = Pick<OpportunityResult, "opportunity" | "service" | "evidence">;

export type OutreachInput = {
  /** Already resolved — the site's own title, or its domain. Never invented. */
  companyName: string;
  websiteUrl: string;
  /** A role or company address if one is already known. Never discovered here. */
  contactEmail?: string | null;
  contactPhone?: string | null;
  /**
   * Never set, and a compile error if anyone tries.
   *
   * Phase 1 decided the system does not store a named individual's contact
   * details, so there is no name to greet and the draft opens neutrally.
   * Typing it `never` makes that decision impossible to quietly undo.
   */
  contactName?: never;
  opportunity: OutreachOpportunity;
  /**
   * Everything the scan observed, for choosing one supporting line. Optional:
   * without it the draft cites only the rule's own evidence.
   */
  observations?: readonly Observation[];
  sender?: OutreachSender;
};

/**
 * One observed fact, as it reads mid-sentence.
 *
 * Keyed on the exact lines `findings-summary.ts` produces. Anything absent
 * from this table is still used, verbatim, as its own sentence — an unmapped
 * observation must never be silently dropped from an email that is about to
 * cite it, and must never be reworded into something stronger.
 */
type Issue =
  /** Reads after "the homepage has …", so several merge into one clause. */
  | { scope: "homepage"; text: string }
  /** A complete clause. Gets its own sentence. */
  | { scope: "standalone"; text: string };

const ISSUE_PHRASE: Record<string, Issue> = {
  "No page title detected.": { scope: "homepage", text: "no page title" },
  "No meta description detected.": { scope: "homepage", text: "no meta description" },
  "No H1 detected.": { scope: "homepage", text: "no main heading" },
  "No responsive viewport meta tag detected.": {
    scope: "homepage",
    text: "no responsive viewport tag, which affects how it displays on a phone",
  },
  "A large fixed-width layout was detected.": {
    scope: "homepage",
    text: "a large fixed-width layout, which affects how it displays on a phone",
  },
  "No obvious call to action detected in the page text.": {
    scope: "homepage",
    text: "no obvious next step",
  },
  "A form without a usable submit control was detected.": {
    scope: "homepage",
    text: "a form without an obvious submit control",
  },
  "Images without declared width or height were detected.": {
    scope: "homepage",
    text: "images without declared width or height, which can make the layout move as the page loads",
  },
  "More than one title element detected.": { scope: "homepage", text: "more than one page title" },
  "More than one meta description detected.": {
    scope: "homepage",
    text: "more than one meta description",
  },
  "More than one H1 detected.": { scope: "homepage", text: "more than one main heading" },
  "No canonical URL declared.": { scope: "homepage", text: "no canonical URL" },
  "No JSON-LD structured data detected.": { scope: "homepage", text: "no structured data" },
  "The site is served without HTTPS.": {
    scope: "standalone",
    text: "the site is currently being served without HTTPS",
  },
};

/**
 * One further observation that genuinely strengthens the same opportunity.
 *
 * Keyed by the rule identifiers `analyze.ts` emits, and deliberately narrow:
 * an email that lists everything the scan noticed reads like a report, and
 * an email that reaches across opportunities reads like it was generated.
 * A finding outside this map is never mentioned, however prominent it is in
 * the quick findings.
 *
 * Website Development takes the observations about how the page is laid out
 * and rendered. SEO takes the on-page metadata ones. E-commerce takes the
 * obstacles on the path to buying, which is exactly the set its own rule
 * fires on. The three human-selected opportunities take none: nothing in a
 * homepage fetch evidences them, so nothing here may claim to.
 */
const SUPPORTING_RULES: Record<Opportunity, readonly string[]> = {
  "Website Development": [
    "fixed-width-layout",
    "missing-viewport",
    "missing-image-dimensions",
    "slow-response",
    "oversized-html",
    "form-without-submit-control",
  ],
  SEO: [
    "missing-title",
    "missing-meta-description",
    "missing-h1",
    "duplicate-title",
    "duplicate-meta-description",
    "multiple-h1",
    "missing-canonical",
    "missing-structured-data",
  ],
  "E-commerce": ["missing-primary-cta", "form-without-submit-control", "missing-viewport", "fixed-width-layout"],
  Automation: [],
  "Web Application": [],
  Integration: [],
  "No Clear Opportunity": [],
  "Needs Manual Review": [],
};

/** The service, cased for the middle of a sentence. Never renamed. */
const SERVICE_IN_SENTENCE: Record<ForgelineService, string> = {
  SEO: "SEO",
  "Business websites": "business websites",
  "Custom web applications": "custom web applications",
  "E-commerce": "e-commerce",
  "Business automation": "business automation",
  "API integrations": "API integrations",
  "Website maintenance": "website maintenance",
};

const PLATFORM_PREFIX = "Storefront platform detected: ";

/**
 * Observations that carry a measured number, so their sentence is built rather
 * than looked up.
 *
 * Both are tied to the moment of the scan on purpose. Response time and
 * payload size vary with the network and the server, so "took about six
 * seconds to respond when I checked" is something the scan can stand behind;
 * "your website is slow" is not.
 */
function measuredIssue(line: string): Issue | null {
  const responseMs = /^Response time: ([\d,]+) ms\.$/.exec(line);
  if (responseMs) {
    const ms = Number(responseMs[1]!.replace(/,/g, ""));
    const seconds = ms / 1000;
    const rounded = seconds >= 10 ? Math.round(seconds) : Math.round(seconds * 10) / 10;
    return {
      scope: "standalone",
      text: `the homepage took about ${rounded} seconds to respond when I checked`,
    };
  }

  const htmlBytes = /^HTML size: ([\d,]+) bytes\.$/.exec(line);
  if (htmlBytes) {
    const bytes = Number(htmlBytes[1]!.replace(/,/g, ""));
    const size = bytes >= 1_000_000
      ? `${(bytes / 1_000_000).toFixed(1)} MB`
      : `${Math.round(bytes / 1_000)} KB`;
    return {
      scope: "standalone",
      text: `the homepage returned about ${size} of HTML when I checked`,
    };
  }

  return null;
}

/** The sentence form of one observation, looked up or measured. */
function issueFor(line: string): Issue | undefined {
  return ISSUE_PHRASE[line] ?? measuredIssue(line) ?? undefined;
}

/** Joins with commas and a final "and". */
function sentenceList(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/**
 * Splits the rule's evidence into the platform it named, the observations that
 * have a sentence form, and any it does not recognise.
 *
 * The platform line is context, not a fault: running Shopify is a fact about
 * the site, and the email says so in those terms rather than implying it is a
 * problem.
 */
export function describeEvidence(evidence: readonly string[]): {
  platform: string | null;
  homepage: string[];
  standalone: string[];
  verbatim: string[];
} {
  let platform: string | null = null;
  const homepage: string[] = [];
  const standalone: string[] = [];
  const verbatim: string[] = [];

  for (const line of evidence) {
    if (line.startsWith(PLATFORM_PREFIX)) {
      platform = line.slice(PLATFORM_PREFIX.length).replace(/\.$/, "") || null;
      continue;
    }
    const issue = issueFor(line);
    if (!issue) verbatim.push(line);
    else if (issue.scope === "homepage") homepage.push(issue.text);
    else standalone.push(issue.text);
  }

  return { platform, homepage, standalone, verbatim };
}

export type SelectedEvidence = {
  /** The observations the rule fired on. What the email is actually about. */
  primary: string[];
  /** At most one further observation, from the same opportunity. */
  supporting: string | null;
};

/**
 * Chooses what the email may mention.
 *
 * The primary evidence is the rule's own: `opportunity.ts` already builds it
 * from that rule's finding set, so it is the reason the opportunity was
 * chosen rather than a sample of everything the scan saw.
 *
 * At most one supporting observation is added, and only from
 * `SUPPORTING_RULES` for that same opportunity. So a Website Development
 * email may cite a layout observation; it may not reach for a missing meta
 * description because the scan happened to notice one.
 *
 * Pure, and no ranking: the supporting observation is the first candidate in
 * the scan's own severity order, not the winner of a score.
 */
export function selectOutreachEvidence(
  opportunity: OutreachOpportunity,
  observations: readonly Observation[] = [],
): SelectedEvidence {
  const primary = opportunity.evidence.filter((line) => !line.startsWith(PLATFORM_PREFIX));

  // A supporting line exists to give a single observation some substance. The
  // rule already cited several, so a fourth is padding, and the email starts
  // reading like a report instead of a note from a person.
  if (primary.length > 1) return { primary, supporting: null };

  const allowed = SUPPORTING_RULES[opportunity.opportunity] ?? [];
  const already = new Set(primary);

  // Only a candidate the email can actually phrase; an unmapped one would be
  // pasted in raw, which reads like a report rather than a sentence.
  const supporting =
    observations.find(
      (o) => allowed.includes(o.rule) && !already.has(o.line) && issueFor(o.line) !== undefined,
    )?.line ?? null;

  return { primary, supporting };
}

/**
 * The draft for one opportunity, or a reason not to write one.
 *
 * Two opportunities never produce a draft. No Clear Opportunity means the scan
 * found nothing to point at, and Needs Manual Review means it could not be
 * trusted — in both cases writing an email would mean inventing a reason to
 * contact someone, which is the one thing this tool must not do.
 *
 * An opportunity with no usable observation behind it is skipped for the same
 * reason: without something specific to cite, what is left is a generic cold
 * email.
 */
export function generateOutreach(input: OutreachInput): OutreachGenerationResult {
  const { opportunity, service, evidence } = input.opportunity;

  if (opportunity === "Needs Manual Review") {
    return { kind: "skip", reason: "Manual review required before outreach." };
  }
  if (opportunity === "No Clear Opportunity" || service === null) {
    return {
      kind: "skip",
      reason:
        "The quick scan found no clear opportunity, so there is nothing specific to write about. Skip this one rather than inventing a reason to make contact.",
    };
  }

  const selected = selectOutreachEvidence(input.opportunity, input.observations);
  const { platform, homepage, standalone, verbatim } = describeEvidence([
    ...evidence.filter((line) => line.startsWith(PLATFORM_PREFIX)),
    ...selected.primary,
  ]);
  if (homepage.length === 0 && standalone.length === 0 && verbatim.length === 0) {
    return {
      kind: "skip",
      reason: "There is no specific observation to reference, so there is nothing to write about yet.",
    };
  }

  const sender = input.sender ?? FORGELINE_SENDER;
  const company = input.companyName;

  // Each of these restates an observation. None of them interprets one. The
  // homepage items merge into one clause ("the homepage has no page title, no
  // meta description and no main heading"); anything standalone gets its own
  // sentence, so the two never collide into a double "and".
  const homepageClause = homepage.length ? `the homepage has ${sentenceList(homepage)}` : null;
  const lead = platform ? `I noticed you're running on ${platform}, and that` : "I noticed that";
  const first = homepageClause ?? standalone[0] ?? null;
  // At most one further observation reaches the reader. A rule that fired on
  // three things produced "took about 3 seconds to respond when I checked and
  // returned about 515 KB of HTML when I checked" — accurate, and nobody
  // writes like that. The rest stay on the prospect page where they belong.
  const rest = (homepageClause ? standalone : standalone.slice(1)).slice(0, 1);
  // The supporting observation gets its own sentence rather than joining the
  // primary list. Several of these phrases carry their own "which …" clause,
  // and two of them joined by "and" is a sentence nobody would write.
  const support = selected.supporting ? issueFor(selected.supporting) : undefined;
  const supportSentence = support
    ? `I also noticed that ${support.scope === "homepage" ? `the homepage has ${support.text}` : support.text}.`
    : null;

  const observedSentences = [
    first ? `${lead} ${first}.` : null,
    rest.length ? `I also noticed that ${sentenceList(rest)}.` : null,
    supportSentence,
  ].filter((line): line is string => line !== null);

  const lines = [
    "Hi there,",
    "",
    // No "I came across you while looking at X": nothing was looked at, and a
    // manufactured reason for making contact is exactly what this avoids.
    `I came across ${company} and had a quick look through your website.`,
    "",
    ...observedSentences.flatMap((sentence) => [sentence, ""]),
    ...(verbatim.length ? [verbatim.join(" "), ""] : []),
    `I run ${sender.company}, a small web development studio, and we work on ${SERVICE_IN_SENTENCE[service]}.`,
    "",
    `If it would be useful, I can put together a short, no-obligation review for ${company} — what I would look at first, and what I would leave alone.`,
    "",
    "No hard sell — just a few practical things you could consider.",
    "",
    "Regards,",
    sender.name,
    sender.company,
    sender.website,
  ];

  return {
    kind: "draft",
    draft: { subject: `Quick idea for ${company}`, body: lines.join("\n") },
  };
}

/** The draft for what the prospecting screen is already showing. */
export function outreachFromView(view: ScanView, sender?: OutreachSender): OutreachGenerationResult {
  return generateOutreach({
    companyName: view.siteName,
    websiteUrl: view.finalUrl ?? view.requestedUrl,
    opportunity: { opportunity: view.opportunity, service: view.service, evidence: view.evidence },
    observations: view.observations,
    ...(sender ? { sender } : {}),
  });
}
