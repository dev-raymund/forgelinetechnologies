/**
 * The Forgeline Promise.
 *
 * One rule governs every line here: promise the process, never the outcome.
 *
 * Rankings, traffic, leads and revenue all depend on a market nobody in this
 * studio controls, so none of them appear. Scope, communication, build
 * quality, how change is handled and who owns the result are entirely within
 * our control, so those are the five. A promise you cannot keep is worth less
 * than no promise at all — and a buyer who has been burned once can tell the
 * difference immediately.
 *
 * Wording on ownership stays deliberately tied to the agreed project terms
 * rather than making a blanket legal claim.
 */
/** Named ClientPromise, not Promise: the latter shadows the global type and
 *  would quietly break the moment anything in this module went async. */
export type ClientPromise = {
  number: string;
  title: string;
  /** The commitment itself, in one sentence. */
  claim: string;
  /** What it means in practice. */
  detail: string;
};

export const promises: ClientPromise[] = [
  {
    number: "01",
    title: "Clear scope",
    claim: "You know what is being built before development starts.",
    detail:
      "Deliverables, milestones and who is responsible for what, agreed in writing before any code exists — including the assumptions behind them. Unstated assumptions are where most projects quietly go wrong, so they get written down too.",
  },
  {
    number: "02",
    title: "Direct communication",
    claim: "You work with the developer building your project, not a relay.",
    detail:
      "Questions go to the person writing the code and are answered by them. Nobody is carrying a technical decision back and forth on behalf of someone who cannot make it, which is why answers take hours rather than a sprint.",
  },
  {
    number: "03",
    title: "Built for production",
    claim: "We build for launch, not for a demonstration.",
    detail:
      "Responsive, tested, deployed, and written so that whoever works on it next can follow it. Performance and accessibility are part of the build rather than a phase that gets dropped when the schedule tightens.",
  },
  {
    number: "04",
    title: "No surprises",
    claim: "Changes are discussed before they become work.",
    detail:
      "When a requirement shifts or a technical constraint appears, you hear about it when we do — with the trade-off explained and the cost agreed before anything is built. A change never arrives quietly as a line on an invoice.",
  },
  {
    number: "05",
    title: "You own the result",
    claim: "The code, the accounts and the documentation are yours.",
    detail:
      "Everything transfers on handover, under the terms agreed for the project. No proprietary page builder holding your content, and no obligation to stay on a support plan in order to keep what you have already paid for.",
  },
];

/** The promise in one line. Used to close the section. */
export const promiseStatement = "Clear before it starts. Solid when it ships.";
