/**
 * How a project runs, start to finish.
 *
 * The point of publishing this is the absence of a black box: a client should
 * be able to read four paragraphs and know what happens, in what order, and
 * what they get at the end of each one.
 *
 * Descriptions are carried forward from the previous site, which described
 * the real process accurately.
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
    title: "Scope",
    summary:
      "A free call to understand the goal, the constraints and what the project has to do to be worth doing. No obligation and no pitch deck.",
    outcome: "A fixed plan and a fixed price, before any code is written.",
  },
  {
    number: "02",
    title: "Plan",
    summary:
      "We map out what gets built, in what order, and which decisions would be expensive to change later. You see the plan and the price in writing before anything is made.",
    outcome: "An agreed scope, a technical approach and visible milestones.",
  },
  {
    number: "03",
    title: "Build",
    summary:
      "Focused development with regular check-ins. You see working software as it is built rather than a status report describing it, and you talk to the person writing it.",
    outcome: "Real progress you can open in a browser, every week.",
  },
  {
    number: "04",
    title: "Launch & Support",
    summary:
      "Deployed, tested and handed over clean — code, accounts and documentation. You own all of it. Ongoing support is available if you want it, not assumed.",
    outcome: "A live product, full ownership, and no lock-in.",
  },
];
