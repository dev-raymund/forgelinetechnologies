import assert from "node:assert/strict";
import test from "node:test";
import { parseCsvRows, parseProspectCsv } from "../src/lib/prospecting/csv.ts";

test("parseCsvRows handles quotes, embedded commas and newlines, CRLF and a BOM", () => {
  const text = '﻿a,b\r\n"x,1","y\nz"\r\n"say ""hi""",2\r\n';
  assert.deepEqual(parseCsvRows(text), [
    ["a", "b"],
    ["x,1", "y\nz"],
    ['say "hi"', "2"],
  ]);
});

test("a valid file produces normalized prospects", () => {
  const text = [
    "company,website,industry,country,location,contact,contact_source",
    "Acme Pty Ltd,https://www.acme.com.au/about,Accounting,AU,Brisbane,info@acme.com.au,website footer",
    "Beta Ltd,beta.co.uk,,GB,,,",
  ].join("\n");

  const { rows, errors } = parseProspectCsv(text);
  assert.deepEqual(errors, []);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    companyName: "Acme Pty Ltd",
    domain: "acme.com.au",
    websiteUrl: "https://acme.com.au/",
    industry: "Accounting",
    country: "AU",
    location: "Brisbane",
    contactChannel: "info@acme.com.au",
    contactProvenance: "website footer",
  });
  assert.equal(rows[1]!.domain, "beta.co.uk");
  assert.equal(rows[1]!.contactChannel, "");
});

test("a bad row is reported with its line number and never aborts the file", () => {
  const text = [
    "company,website",
    "Good Co,good.com",
    ",orphan.com",
    "No Site,",
    "Bad Host,not a domain",
    "Later Co,later.com",
  ].join("\n");

  const { rows, errors } = parseProspectCsv(text);
  assert.deepEqual(rows.map((r) => r.domain), ["good.com", "later.com"]);
  assert.deepEqual(errors.map((e) => e.line), [3, 4, 5]);
});

test("a named contact is rejected on its row, with the rest of the file kept", () => {
  const text = [
    "company,website,contact,contact_source",
    "Acme,acme.com,jane.smith@acme.com,guess",
    "Beta,beta.com,info@beta.com,website",
  ].join("\n");

  const { rows, errors } = parseProspectCsv(text);
  assert.deepEqual(rows.map((r) => r.domain), ["beta.com"]);
  assert.equal(errors.length, 1);
  assert.match(errors[0]!.message, /Named-individual/);
});

test("a contact without provenance is rejected", () => {
  const text = ["company,website,contact", "Acme,acme.com,info@acme.com"].join("\n");
  const { rows, errors } = parseProspectCsv(text);
  assert.deepEqual(rows, []);
  assert.match(errors[0]!.message, /provenance|contact_source/i);
});

test("missing required headers fail the whole file once", () => {
  const { rows, errors } = parseProspectCsv("name,url\nAcme,acme.com");
  assert.deepEqual(rows, []);
  assert.equal(errors.length, 1);
  assert.match(errors[0]!.message, /company/);
});

test("duplicate domains inside one file collapse to the first occurrence", () => {
  const text = [
    "company,website",
    "Acme,acme.com",
    "Acme Duplicate,https://www.acme.com/contact",
  ].join("\n");
  const { rows, errors } = parseProspectCsv(text);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.companyName, "Acme");
  assert.equal(errors.length, 1);
  assert.match(errors[0]!.message, /already appears/i);
});

test("the row cap is enforced", () => {
  const lines = ["company,website"];
  for (let i = 0; i < 2_001; i += 1) lines.push(`Co ${i},co${i}.com`);
  const { errors } = parseProspectCsv(lines.join("\n"));
  assert.match(errors.at(-1)!.message, /2,000/);
});

test("error line numbers survive a blank line earlier in the file", () => {
  const text = [
    "company,website",
    "Good Co,good.com",
    "",
    "Bad Host,not a domain",
    "Later Co,later.com",
  ].join("\n");
  const { rows, errors } = parseProspectCsv(text);
  assert.deepEqual(rows.map((r) => r.domain), ["good.com", "later.com"]);
  assert.deepEqual(errors.map((e) => e.line), [4]);
});

test("error line numbers survive a quoted field spanning several lines", () => {
  const text = 'company,website\n"Good\nCo",good.com\nBad Host,not a domain\n';
  const { rows, errors } = parseProspectCsv(text);
  assert.deepEqual(rows.map((r) => r.domain), ["good.com"]);
  assert.deepEqual(errors.map((e) => e.line), [4]);
});
