/**
 * Contact classification.
 *
 * Phase 2 stores a public business channel and nothing else. A named
 * individual's work address is personal data under UK GDPR and the Australian
 * Privacy Act, which would make this table a personal-data store with
 * subject-access and erasure obligations. Rejecting those at parse time, before
 * any write, keeps that obligation out of the system entirely.
 */

const ROLE_LOCAL_PARTS = new Set([
  "info", "hello", "contact", "contacts", "enquiries", "enquiry",
  "inquiries", "inquiry", "sales", "admin", "office", "support",
  "team", "mail", "general", "reception", "accounts", "hi",
]);

export type ContactKind = "role-email" | "url" | "phone";

export type ContactResult =
  | { ok: true; kind: ContactKind; value: string }
  | { ok: false; reason: string };

export function classifyContact(raw: string): ContactResult {
  const value = raw.trim();
  if (!value) return { ok: false, reason: "Contact is empty." };

  if (value.includes("@")) {
    if (/\s/.test(value)) return { ok: false, reason: "Contact is not a valid email address." };
    const at = value.lastIndexOf("@");
    const local = value.slice(0, at).toLowerCase();
    const domain = value.slice(at + 1).toLowerCase();
    if (!local || !domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) {
      return { ok: false, reason: "Contact is not a valid email address." };
    }
    if (!ROLE_LOCAL_PARTS.has(local)) {
      return {
        ok: false,
        reason: "Named-individual contacts are not accepted; use a public business channel such as info@.",
      };
    }
    return { ok: true, kind: "role-email", value: `${local}@${domain}` };
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      new URL(value);
    } catch {
      return { ok: false, reason: "Contact URL is malformed." };
    }
    return { ok: true, kind: "url", value };
  }

  if (/^[+()\d\s.-]+$/.test(value) && value.replace(/\D/g, "").length >= 6) {
    return { ok: true, kind: "phone", value };
  }

  return {
    ok: false,
    reason: "Contact must be a role-based email, a contact-page URL, or a phone number.",
  };
}
