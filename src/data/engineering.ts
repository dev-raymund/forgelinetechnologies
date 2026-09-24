/**
 * The difference between being hired to build something and being hired to
 * solve something.
 *
 * This is the site's central argument, so it is written as two sequences
 * rather than two adjectives. One stops at the specification; the other treats
 * the specification as a claim to be checked. Read side by side, the shape of
 * the work is visible before a word of the explanation is.
 *
 * It is deliberately not an attack on developers. Plenty of work genuinely is
 * "build this, to this spec, by then", and a good developer is exactly who you
 * want for it. The argument is about what happens when nobody has established
 * that the spec is the right one — which is most of the time, and is where
 * budgets quietly disappear.
 *
 * Nothing here claims a methodology, a certification or a framework. It
 * describes how the work runs.
 */

/** Where a brief goes when the brief is taken at face value. */
export const executionSteps = [
  "Take the requirement",
  "Build what was asked for",
  "Ship it",
  "Next ticket",
];

/** Where the same brief goes when someone is accountable for the outcome. */
export const engineeringSteps = [
  "Understand the problem",
  "Question the requirement",
  "Choose the approach",
  "Build it",
  "Test it",
  "Improve it",
];

export type Difference = {
  title: string;
  body: string;
};

/**
 * What that difference actually buys, in the client's terms rather than ours.
 * Each one is a consequence of the sequence above, not a separate promise.
 */
export const differences: Difference[] = [
  {
    title: "The brief gets checked, not just followed",
    body: "Most projects arrive described as one thing and turn out to be another. We say so before development starts, while changing direction is still free.",
  },
  {
    title: "You talk to the people building it",
    body: "Technical questions are answered on the call by the people responsible for the work, rather than taken away and returned the following week.",
  },
  {
    title: "Built to be maintained",
    body: "Performance, accessibility and readable code are part of the build. Whoever works on it next — us or anyone else — can follow what is there.",
  },
  {
    title: "One team, several kinds of problem",
    body: "A site, an application, a store, an automation and an integration are not five suppliers. When the answer turns out to be a different one, you are not starting again.",
  },
];
