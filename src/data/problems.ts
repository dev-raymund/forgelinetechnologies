/**
 * Situations a visitor should recognise as their own.
 *
 * This section exists to do one thing: let someone arrive thinking "we need a
 * new website" and realise the actual problem is three systems that do not
 * talk to each other. Recognition first, capability second — a buyer who has
 * not named their problem cannot judge whether your service list solves it.
 *
 * Every line is a real situation, written the way a client describes it rather
 * than the way a developer would classify it. No invented statistics, no
 * "did you know that 73% of businesses…".
 */
export type Problem = {
  /** How the client says it. */
  situation: string;
  /** What it usually turns out to be. Plain, never condescending. */
  reading: string;
};

export const problems: Problem[] = [
  {
    situation: "The site looks dated and is awkward on a phone.",
    reading:
      "Usually a build that predates how people actually browse, rather than a design taste problem.",
  },
  {
    situation: "Nobody finds us in search.",
    reading:
      "Often technical — pages search engines cannot read properly, or a migration that lost its redirects.",
  },
  {
    situation: "The same information gets typed into two systems every week.",
    reading:
      "Two tools that do not talk to each other. The fix is usually an integration, not more discipline.",
  },
  {
    situation: "Half the business runs on a spreadsheet nobody trusts.",
    reading:
      "A process that outgrew the tool. Worth building properly at the point the workaround costs more than the build.",
  },
  {
    situation: "The site is slow and we do not know why.",
    reading:
      "Almost always measurable, and almost always fixable without starting again.",
  },
  {
    situation: "We have an application, but it is holding the team back.",
    reading:
      "Improving what exists is often cheaper and less disruptive than replacing it.",
  },
  {
    situation: "The store cannot do what we now need it to do.",
    reading:
      "Either the platform has been outgrown, or it was never configured for how you actually sell.",
  },
  {
    situation: "We are not sure what we need built.",
    reading:
      "The most honest starting point there is, and the reason the first step is a diagnosis rather than a quote.",
  },
];
