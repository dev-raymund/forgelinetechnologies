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
    text: "a form with no working submit control",
  },
  "The site is served without HTTPS.": {
    scope: "standalone",
    text: "the site is currently being served without HTTPS",
  },
};

/** What the email says the conversation would be about. */
const TOPIC: Record<Opportunity, string> = {
  SEO: "the on-page basics",
  "Website Development": "how the site is built",
  "E-commerce": "the store setup",
  Automation: "that process",
  "Web Application": "that",
  Integration: "those integrations",
  "No Clear Opportunity": "",
  "Needs Manual Review": "",
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
    const issue = ISSUE_PHRASE[line];
    if (!issue) verbatim.push(line);
    else if (issue.scope === "homepage") homepage.push(issue.text);
    else standalone.push(issue.text);
  }

  return { platform, homepage, standalone, verbatim };
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

  const { platform, homepage, standalone, verbatim } = describeEvidence(evidence);
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
  const rest = homepageClause ? standalone : standalone.slice(1);
  const observedSentences = [
    first ? `${lead} ${first}.` : null,
    rest.length ? `I also noticed that ${sentenceList(rest)}.` : null,
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
    `There may be a few things worth looking at around ${TOPIC[opportunity]}. If it would be useful, I can put together a short, no-obligation review for ${company} and send it over.`,
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
    ...(sender ? { sender } : {}),
  });
}
