import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateOpportunity,
  sortOpportunities,
  displayDate,
  type Opportunity,
} from "../src/lib/opportunities";
const base: Opportunity = {
  id: "1",
  company: "Example",
  role: "Manager",
  job_url: "",
  salary: "",
  address: "",
  description: "",
  status: "Applied",
  applied_on: null,
};
test("historical opportunities can have an unknown application date", () =>
  assert.equal(validateOpportunity(base), null));
test("invalid dates and executable URLs are rejected", () => {
  assert.ok(validateOpportunity({ ...base, applied_on: "2026-02-30" }));
  assert.ok(validateOpportunity({ ...base, job_url: "javascript:alert(1)" }));
  assert.equal(
    validateOpportunity({ ...base, job_url: "https://example.com/job" }),
    null,
  );
});
test("unknown dates stay last in both sort directions", () => {
  const rows = [
    base,
    { ...base, id: "2", applied_on: "2026-09-01" },
    { ...base, id: "3", applied_on: "2026-09-12" },
  ];
  assert.deepEqual(
    sortOpportunities(rows, "oldest").map((x) => x.id),
    ["2", "3", "1"],
  );
  assert.deepEqual(
    sortOpportunities(rows, "newest").map((x) => x.id),
    ["3", "2", "1"],
  );
  assert.equal(rows[0].id, "1");
});
test("date-only display stays on its calendar day", () =>
  assert.equal(displayDate("2026-09-01"), "Sep 1, 2026"));
