import assert from "node:assert/strict";
import test from "node:test";
import { PgDialect } from "drizzle-orm/pg-core";
import { prospectListWhere, type ProspectFilter } from "../src/lib/prospecting/prospects.ts";

function render(filter: ProspectFilter) {
  const where = prospectListWhere(filter);
  assert.ok(where, "expected a where clause");
  return new PgDialect().sqlToQuery(where);
}

test("dismissed prospects are hidden when no decision filter is chosen", () => {
  const query = render({});
  const index = query.params.indexOf("dismissed");
  assert.ok(query.sql.includes(`"prospects"."decision" <> $${index + 1}`), query.sql);
});

test("an unknown decision filter falls back to hiding dismissed prospects", () => {
  assert.match(render({ decision: "maybe" }).sql, /"prospects"\."decision" <> \$\d+/);
});

test("each decision filter selects exactly that decision", () => {
  for (const [decision, value] of [
    ["qualified", "qualified"],
    ["dismissed", "dismissed"],
    ["undecided", ""],
  ] as const) {
    const query = render({ decision });
    const index = query.params.indexOf(value);
    assert.ok(query.sql.includes(`"prospects"."decision" = $${index + 1}`), `${decision}: ${query.sql}`);
    assert.doesNotMatch(query.sql, /"prospects"\."decision" <>/);
  }
});

test("a band filter selects its score range and an unknown band is ignored", () => {
  const limited = render({ band: "limited" });
  assert.match(limited.sql, /"prospects"\."total_score" between \$\d+ and \$\d+/);
  assert.ok(limited.params.includes(25) && limited.params.includes(49));

  assert.doesNotMatch(render({ band: "excellent" }).sql, /between/);
});

test("the existing filters still apply alongside the new ones", () => {
  const query = render({ status: "audited", country: "AU", decision: "qualified", band: "strong" });
  assert.match(query.sql, /"prospects"\."status" = /);
  assert.match(query.sql, /"prospects"\."country" = /);
  assert.ok(query.params.includes("audited") && query.params.includes("AU"));
  assert.ok(query.params.includes(75) && query.params.includes(100));
});
