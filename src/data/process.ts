/**
 * The Forgeline Build Method — how a project runs, start to finish.
 *
 * The point of publishing it is the absence of a black box: a client should be
 * able to read four paragraphs and know what happens, in what order, and what
 * they hold at the end of each one.
 *
 * Diagnose comes first on purpose. Quoting before understanding the problem is
 * how projects end up building the wrong thing correctly.
 *
 * Improve is last for the same reason it is optional: a system that is still
 * in use keeps changing, and pretending a launch is the end of the work would
 * be the comfortable lie rather than the true one. It is only ever engaged
 * where ongoing development is actually agreed.
 */

export type ProcessStep = {
  number: string;
  title: string;
  summary: string;
  /** What the client actually has in hand when the step ends. */
  outcome: string;
};

export const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Diagnose",
    summary:
      "Before anything is quoted, we work out what is actually wrong — the business goal, the system you already have, and which part of it is the real constraint. Most projects arrive described as one thing and turn out to be another.",
    outcome: "A clear reading of the problem, and whether building is the answer.",
  },
  {
    number: "02",
    title: "Define",
    summary:
      "Scope, deliverables, technical approach and price, agreed in writing. This is where the engineering decisions get made — what to build, what to reuse, what to leave alone — while reversing them is still cheap.",
    outcome: "A fixed scope and a fixed price, before any code is written.",
  },
  {
    number: "03",
    title: "Build",
    summary:
      "Design, development, integration and testing, with regular check-ins. You see working software as it is built rather than a status report describing it, and you talk to the person writing it.",
    outcome: "Real progress you can open in a browser, every week.",
  },
  {
    number: "04",
    title: "Launch",
    summary:
      "Deployed, tested and handed over clean — code, accounts and documentation. You own all of it, and you are free to take it to any developer.",
    outcome: "A live product, full ownership, and no lock-in.",
  },
  {
    number: "05",
    title: "Improve",
    summary:
      "Systems that stay in use keep changing. Where ongoing development is agreed, we keep the thing working and keep making it better as the business moves — measured against what you actually need next, not a retainer that has to be spent.",
    outcome: "A system that keeps up, with the option to stop whenever you want.",
  },
];

/** The method's name, used wherever the steps appear together. */
export const METHOD_NAME = "The Forgeline Build Method";
