import { normalizeDomain, websiteUrlForDomain } from "./domain.ts";
import { classifyContact } from "./contact.ts";

export const MAX_ROWS = 2_000;
export const MAX_BYTES = 1_000_000;
/** Matches `prospects.industry`, which is varchar(80). */
export const MAX_INDUSTRY = 80;

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
 * Internal representation of a parsed row with its physical line number.
 */
type RawRow = { cells: string[]; line: number };

/**
 * RFC 4180 field splitting with physical line number tracking.
 * Hand-rolled rather than adding a dependency: the whole grammar is
 * quoted fields, doubled quotes, and separators.
 * Line numbers are counted from 1 (header is line 1).
 * Each row's line number is the line on which it STARTS.
 */
function tokenize(text: string): RawRow[] {
  const rows: RawRow[] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let started = false;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  let line = 1;
  let rowStartLine = 1;

  const endField = () => {
    row.push(field);
    field = "";
    started = true;
  };
  const endRow = () => {
    endField();
    rows.push({ cells: row, line: rowStartLine });
    row = [];
    started = false;
  };

  for (; i < text.length; i += 1) {
    const char = text[i]!;
    if (quoted) {
      if (char !== '"') {
        field += char;
        if (char === "\n") line += 1;
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
      line += 1;
      rowStartLine = line;
    } else if (char !== "\r") {
      field += char;
      started = true;
    }
  }
  if (started || field.length > 0 || row.length > 0) endRow();

  return rows;
}

/**
 * RFC 4180 field splitting. Hand-rolled rather than adding a dependency: the
 * whole grammar is quoted fields, doubled quotes, and separators.
 */
export function parseCsvRows(text: string): string[][] {
  return tokenize(text).map((r) => r.cells);
}

const REQUIRED_HEADERS = ["company", "website"] as const;

/**
 * `country` is stored as ISO-3166-1 alpha-2 and filtered on exactly, so a value
 * that is not already one is left empty rather than trimmed into one. Taking
 * the first two letters of "New Zealand" produces NE (Niger) and of "United
 * Kingdom" UN — confidently wrong data that then filters a real business out of
 * a real market.
 *
 * The row is still imported: an unusable country is no reason to lose a good
 * prospect. The reviewer is told which value was dropped.
 */
const ISO_ALPHA2 = /^[A-Z]{2}$/;

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

  const rawRows = tokenize(text);
  const raw = rawRows.filter((row) => row.cells.some((cell) => cell.trim() !== ""));
  if (raw.length === 0) return { rows: [], errors: [{ line: 0, message: "The file is empty." }] };

  const columns = headerIndex(raw[0]!.cells);
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
    const line = raw[index]!.line;
    if (rows.length >= MAX_ROWS) {
      errors.push({ line, message: `The file exceeds the ${MAX_ROWS.toLocaleString("en-AU")}-row limit.` });
      break;
    }

    const row = raw[index]!.cells;
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

    const rawCountry = cell(row, "country");
    const country = ISO_ALPHA2.test(rawCountry.toUpperCase()) ? rawCountry.toUpperCase() : "";
    if (rawCountry && !country) {
      errors.push({ line, message: `"${rawCountry}" is not a two-letter ISO country code.` });
    }

    seen.set(domain, line);
    rows.push({
      companyName,
      domain,
      websiteUrl: websiteUrlForDomain(domain),
      // `prospects.industry` is varchar(80). Bounded here so one long cell
      // cannot fail the single atomic INSERT the whole file is written with.
      industry: cell(row, "industry").slice(0, MAX_INDUSTRY),
      country,
      location: cell(row, "location"),
      contactChannel,
      contactProvenance: contactChannel ? provenance : "",
    });
  }

  return { rows, errors };
}
