import { normalizeDomain, websiteUrlForDomain } from "./domain.ts";
import { classifyContact } from "./contact.ts";

export const MAX_ROWS = 2_000;
export const MAX_BYTES = 1_000_000;

export type ParsedProspect = {
  companyName: string;
  domain: string;
  websiteUrl: string;
  industry: string;
  country: string;
  location: string;
  contactChannel: string;
  contactProvenance: string;
};

export type RowError = { line: number; message: string };

/**
 * RFC 4180 field splitting. Hand-rolled rather than adding a dependency: the
 * whole grammar is quoted fields, doubled quotes, and separators.
 */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let started = false;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;

  const endField = () => {
    row.push(field);
    field = "";
    started = true;
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
    started = false;
  };

  for (; i < text.length; i += 1) {
    const char = text[i]!;
    if (quoted) {
      if (char !== '"') {
        field += char;
      } else if (text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        quoted = false;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      started = true;
    } else if (char === ",") {
      endField();
    } else if (char === "\n") {
      endRow();
    } else if (char !== "\r") {
      field += char;
      started = true;
    }
  }
  if (started || field.length > 0 || row.length > 0) endRow();

  return rows;
}

const REQUIRED_HEADERS = ["company", "website"] as const;

function headerIndex(header: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  header.forEach((name, index) => {
    map[name.trim().toLowerCase()] = index;
  });
  return map;
}

export function parseProspectCsv(text: string): {
  rows: ParsedProspect[];
  errors: RowError[];
} {
  const errors: RowError[] = [];
  if (text.length > MAX_BYTES) {
    return { rows: [], errors: [{ line: 0, message: `The file exceeds the ${MAX_BYTES}-byte limit.` }] };
  }

  const raw = parseCsvRows(text).filter((row) => row.some((cell) => cell.trim() !== ""));
  if (raw.length === 0) return { rows: [], errors: [{ line: 0, message: "The file is empty." }] };

  const columns = headerIndex(raw[0]!);
  const missing = REQUIRED_HEADERS.filter((name) => columns[name] === undefined);
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [{ line: 1, message: `Missing required column(s): ${missing.join(", ")}.` }],
    };
  }

  const cell = (row: string[], name: string): string =>
    columns[name] === undefined ? "" : (row[columns[name]!] ?? "").trim();

  const rows: ParsedProspect[] = [];
  const seen = new Map<string, number>();

  for (let index = 1; index < raw.length; index += 1) {
    const line = index + 1;
    if (rows.length >= MAX_ROWS) {
      errors.push({ line, message: `The file exceeds the ${MAX_ROWS.toLocaleString("en-AU")}-row limit.` });
      break;
    }

    const row = raw[index]!;
    const companyName = cell(row, "company");
    if (!companyName) {
      errors.push({ line, message: "Company name is required." });
      continue;
    }

    const website = cell(row, "website");
    if (!website) {
      errors.push({ line, message: "Website is required." });
      continue;
    }

    const domain = normalizeDomain(website);
    if (!domain) {
      errors.push({ line, message: `"${website}" is not a public web address.` });
      continue;
    }

    const firstSeen = seen.get(domain);
    if (firstSeen !== undefined) {
      errors.push({ line, message: `${domain} already appears on line ${firstSeen}.` });
      continue;
    }

    const rawContact = cell(row, "contact");
    const provenance = cell(row, "contact_source");
    let contactChannel = "";
    if (rawContact) {
      if (!provenance) {
        errors.push({ line, message: "A contact needs provenance; set contact_source." });
        continue;
      }
      const contact = classifyContact(rawContact);
      if (!contact.ok) {
        errors.push({ line, message: contact.reason });
        continue;
      }
      contactChannel = contact.value;
    }

    seen.set(domain, line);
    rows.push({
      companyName,
      domain,
      websiteUrl: websiteUrlForDomain(domain),
      industry: cell(row, "industry"),
      country: cell(row, "country").toUpperCase().slice(0, 2),
      location: cell(row, "location"),
      contactChannel,
      contactProvenance: contactChannel ? provenance : "",
    });
  }

  return { rows, errors };
}
