/**
 * Server-side validation for every prospect write.
 *
 * It runs inside each action, not in the browser. The admin forms check the
 * same things only to save a round trip — Phase 2's review found a check that
 * existed only in the browser, which a direct call to the action skips
 * entirely, and nothing client-side is a security boundary.
 *
 * Pure: no database, no network.
 */
import { classifyContact } from "./contact.ts";
import { normalizeDomain } from "./domain.ts";
import {
  OPPORTUNITY_VALUES,
  PROSPECT_STATUSES,
  SERVICE_FOR_OPPORTUNITY,
  type ForgelineService,
  type Opportunity,
  type ProspectStatus,
} from "./types.ts";

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

export const COMPANY_MAX = 200;
export const REASON_MAX = 600;
export const LOCATION_MAX = 200;
export const INDUSTRY_MAX = 80;
export const PHONE_MAX = 40;

const ok = <T>(value: T): Validated<T> => ({ ok: true, value });
const bad = <T>(error: string): Validated<T> => ({ ok: false, error });

export function validateProspectId(raw: unknown): Validated<number> {
  return typeof raw === "number" && Number.isSafeInteger(raw) && raw > 0
    ? ok(raw)
    : bad("That prospect could not be found.");
}

export function validateStatus(raw: unknown): Validated<ProspectStatus> {
  return typeof raw === "string" && (PROSPECT_STATUSES as readonly string[]).includes(raw)
    ? ok(raw as ProspectStatus)
    : bad("That is not a prospect status.");
}

export function validateOpportunity(raw: unknown): Validated<Opportunity> {
  return typeof raw === "string" && (OPPORTUNITY_VALUES as readonly string[]).includes(raw)
    ? ok(raw as Opportunity)
    : bad("That is not an opportunity.");
}

/**
 * A service the studio actually offers, or none.
 *
 * `""` is accepted and means no service, which is the honest answer for the
 * two outcome opportunities and for a human-selected one the vocabulary does
 * not map. A service is never manufactured to fill the gap.
 */
export function validateService(raw: unknown): Validated<ForgelineService | ""> {
  if (raw === "" || raw === null || raw === undefined) return ok("");
  const services = new Set(Object.values(SERVICE_FOR_OPPORTUNITY).filter((s) => s !== ""));
  return typeof raw === "string" && services.has(raw as ForgelineService)
    ? ok(raw as ForgelineService)
    : bad("That is not a Forgeline service.");
}

export function validateCompanyName(raw: unknown): Validated<string> {
  const name = typeof raw === "string" ? raw.trim() : "";
  if (!name) return bad("Give the business a name.");
  if (name.length > COMPANY_MAX) return bad(`Keep the name to ${COMPANY_MAX} characters.`);
  return ok(name);
}

/** The canonical domain, through the same normaliser the scanner uses. */
export function validateDomain(raw: unknown): Validated<string> {
  const domain = typeof raw === "string" ? normalizeDomain(raw) : null;
  return domain ? ok(domain) : bad("That is not a website address. Try something like example.com.");
}

/**
 * A role or company address only.
 *
 * Re-classified through `classifyContact` on every write, so a named
 * individual's address cannot reach the table even if a client sends one.
 * Empty is allowed: a prospect with no recorded address is normal.
 */
export function validateContactEmail(raw: unknown): Validated<string> {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return ok("");
  if (!value.includes("@")) return bad("That is not an email address.");
  const classified = classifyContact(value);
  if (!classified.ok) return bad(classified.reason);
  if (classified.kind !== "role-email") return bad("Enter a role or company email address.");
  return ok(classified.value);
}

export function validateContactPhone(raw: unknown): Validated<string> {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return ok("");
  if (value.length > PHONE_MAX) return bad(`Keep the phone number to ${PHONE_MAX} characters.`);
  const classified = classifyContact(value);
  return classified.ok && classified.kind === "phone" ? ok(classified.value) : bad("That is not a phone number.");
}

/** Bounded free text. Empty is fine; over-long is not. */
export function validateText(raw: unknown, max: number, label: string): Validated<string> {
  const value = typeof raw === "string" ? raw.trim() : "";
  return value.length > max ? bad(`Keep ${label} to ${max} characters.`) : ok(value);
}

/** Two letters, upper-cased, matching how the column stores and filters them. */
export function validateCountry(raw: unknown): Validated<string> {
  const value = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  if (!value) return ok("");
  return /^[A-Z]{2}$/.test(value) ? ok(value) : bad("Use a two-letter country code, such as AU.");
}
