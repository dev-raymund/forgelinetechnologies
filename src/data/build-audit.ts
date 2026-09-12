/**
 * The Build Audit — the entry point for people who know something is wrong but
 * not what to build.
 *
 * The commercial idea is simply that a diagnosis precedes a quote. Anyone can
 * quote a website; working out whether a website is the answer is the part
 * that saves money.
 *
 * Nothing here invents a price. The conversation is free, which is already
 * true of the existing process, and anything deeper is scoped like other work.
 */
export type AuditArea = {
  title: string;
  detail: string;
};

export const auditAreas: AuditArea[] = [
  {
    title: "What you already have",
    detail:
      "How the current site or application is actually built, what condition it is in, and which parts are worth keeping. Rebuilding something that works is the most common way to waste a budget.",
  },
  {
    title: "Where it slows people down",
    detail:
      "Load times and Core Web Vitals measured rather than guessed, plus the places the interface gets in a visitor's way on a phone.",
  },
  {
    title: "Whether search can read it",
    detail:
      "Technical SEO: structure, metadata, indexability, internal linking, and whether an earlier migration quietly lost its redirects.",
  },
  {
    title: "What is being done by hand",
    detail:
      "The tasks repeated every week that a system could do — re-keying enquiries, chasing the same follow-up, moving data between two tools.",
  },
  {
    title: "What is not connected",
    detail:
      "Where your site, CRM, payment provider and internal tools should be talking to each other and are not.",
  },
  {
    title: "What is worth doing first",
    detail:
      "Ordered by what it costs against what it changes — not by what would be most interesting to build.",
  },
];

export const auditOutcomes: string[] = [
  "A written summary of what is working and what is not",
  "The specific technical problems, named",
  "What is worth keeping, improving or replacing",
  "A recommended order of work",
  "A fixed price for whatever you decide to do next",
];
