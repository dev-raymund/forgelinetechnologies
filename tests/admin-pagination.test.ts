/**
 * Admin list paging.
 *
 * Arithmetic, but the kind that is wrong in ways nobody notices until a list
 * grows: an off-by-one offset silently repeats or skips a row, and a zero page
 * count reads as "Page 1 of 0".
 */
import test from "node:test";
import assert from "node:assert/strict";
import { PAGE_SIZE, offsetFor, pageFrom, paged } from "../src/lib/admin/pagination.ts";

test("a missing or unusable page number becomes the first page", () => {
  for (const raw of [undefined, "", "abc", "0", "-3", "1.5", "NaN", "1e99"]) {
    assert.equal(pageFrom(raw), 1, JSON.stringify(raw));
  }
});

test("a real page number is kept", () => {
  assert.equal(pageFrom("1"), 1);
  assert.equal(pageFrom("7"), 7);
  assert.equal(pageFrom("200"), 200);
});

test("the offset skips whole pages and never goes negative", () => {
  assert.equal(offsetFor(1), 0);
  assert.equal(offsetFor(2), PAGE_SIZE);
  assert.equal(offsetFor(4), PAGE_SIZE * 3);
  assert.equal(offsetFor(0), 0, "a bad page must not produce a negative offset");
  assert.equal(offsetFor(-5), 0);
});

test("an empty list still reads as page 1 of 1", () => {
  const result = paged([], 0, 1);
  assert.equal(result.pages, 1);
  assert.equal(result.page, 1);
  assert.equal(result.total, 0);
});

test("a partial last page is counted", () => {
  assert.equal(paged([], PAGE_SIZE, 1).pages, 1);
  assert.equal(paged([], PAGE_SIZE + 1, 1).pages, 2);
  assert.equal(paged([], PAGE_SIZE * 3, 1).pages, 3);
  assert.equal(paged([], PAGE_SIZE * 3 + 1, 1).pages, 4);
});

test("total is the matching count, not the rows on this page", () => {
  const result = paged(["a", "b"], 57, 3);
  assert.equal(result.rows.length, 2);
  assert.equal(result.total, 57);
  assert.equal(result.page, 3);
});

test("pages and offsets agree, so no row is repeated or skipped", () => {
  const total = PAGE_SIZE * 2 + 3;
  const { pages } = paged([], total, 1);
  const seen = new Set<number>();
  for (let page = 1; page <= pages; page += 1) {
    for (let i = offsetFor(page); i < Math.min(offsetFor(page) + PAGE_SIZE, total); i += 1) {
      assert.equal(seen.has(i), false, `row ${i} appears twice`);
      seen.add(i);
    }
  }
  assert.equal(seen.size, total, "every row is reachable exactly once");
});

test("a custom page size is honoured throughout", () => {
  assert.equal(offsetFor(3, 10), 20);
  assert.equal(paged([], 25, 1, 10).pages, 3);
  assert.equal(paged([], 25, 1, 10).pageSize, 10);
});
