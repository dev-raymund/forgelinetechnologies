/**
 * Validation for everything a reviewer submits.
 *
 * It runs on the server, inside each action. The admin forms check the same
 * things only to save a round trip. Phase 2's review found a reason check
 * that existed only in the browser, which a direct call to the action skips.
 */
import { COMPONENTS } from "./qualify.ts";
import { OPPORTUNITIES, type ComponentKey, type Opportunity } from "./types.ts";

export const REASON_MAX = 300;

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

function validateReason(raw: unknown, required: boolean, purpose: string): Validated<string> {
  const reason = typeof raw === "string" ? raw.trim() : "";
  if (required && !reason) return { ok: false, error: `Give a reason for ${purpose}.` };
  if (reason.length > REASON_MAX) {
    return { ok: false, error: `Keep the reason to ${REASON_MAX} characters.` };
  }
  return { ok: true, value: reason };
}

function isOpportunity(value: unknown): value is Opportunity {
  return typeof value === "string" && (OPPORTUNITIES as readonly string[]).includes(value);
}

export function validateProspectId(raw: unknown): Validated<number> {
  return typeof raw === "number" && Number.isSafeInteger(raw) && raw > 0
    ? { ok: true, value: raw }
    : { ok: false, error: "That prospect could not be found." };
}

export function validateComponentKey(raw: unknown): Validated<ComponentKey> {
  const definition = COMPONENTS.find((component) => component.key === raw);
  return definition ? { ok: true, value: definition.key } : { ok: false, error: "Unknown score component." };
}

export function validateAdjustment(input: {
  component: unknown;
  points: unknown;
  reason: unknown;
}): Validated<{ component: ComponentKey; points: number; reason: string }> {
  const definition = COMPONENTS.find((component) => component.key === input.component);
  if (!definition) return { ok: false, error: "Unknown score component." };

  const { points } = input;
  if (typeof points !== "number" || !Number.isInteger(points) || points < 0 || points > definition.cap) {
    return { ok: false, error: `${definition.label} must be a whole number from 0 to ${definition.cap}.` };
  }

  const reason = validateReason(input.reason, true, "this adjustment");
  if (!reason.ok) return reason;

  return { ok: true, value: { component: definition.key, points, reason: reason.value } };
}

export function validateOverride(input: {
  primary: unknown;
  secondary: unknown;
  reason: unknown;
}): Validated<{ primary: Opportunity; secondary: Opportunity[]; reason: string }> {
  const { primary, secondary } = input;
  if (!isOpportunity(primary)) return { ok: false, error: "Choose a primary opportunity from the list." };
  if (!Array.isArray(secondary) || !secondary.every(isOpportunity)) {
    return { ok: false, error: "Secondary opportunities must come from the list." };
  }
  if (new Set(secondary).size !== secondary.length) {
    return { ok: false, error: "List each secondary opportunity once." };
  }
  if (secondary.includes(primary)) {
    return { ok: false, error: "The primary opportunity cannot also be a secondary one." };
  }

  const reason = validateReason(input.reason, true, "this override");
  if (!reason.ok) return reason;

  return { ok: true, value: { primary, secondary, reason: reason.value } };
}

export function validateDecision(input: {
  decision: unknown;
  reason: unknown;
}): Validated<{ decision: "qualified" | "dismissed"; reason: string }> {
  const { decision } = input;
  if (decision !== "qualified" && decision !== "dismissed") return { ok: false, error: "Unknown decision." };

  const reason = validateReason(input.reason, decision === "dismissed", "dismissing this prospect");
  if (!reason.ok) return reason;

  return { ok: true, value: { decision, reason: reason.value } };
}
