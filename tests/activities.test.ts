import test from "node:test";
import assert from "node:assert/strict";
import {
  reportEntries,
  validateActivity,
  type Activity,
} from "../src/lib/activities";
import type { Opportunity } from "../src/lib/opportunities";
const job: Opportunity = {
  id: "job",
  company: "Example",
  role: "Manager",
  status: "Rejected",
  applied_on: "2026-09-03",
  job_url: "",
  salary: "",
  address: "HQ",
  description: "",
};
const activity: Activity = {
  id: "a",
  opportunity_id: "job",
  kind: "Interview",
  state: "Completed",
  occurred_on: "2026-09-10",
  title: "Recruiter",
  notes: "",
};
test("report includes endpoints and completed interviews despite current rejection", () => {
  const rows = reportEntries(
    [job],
    [activity, { ...activity, id: "b", occurred_on: "2026-09-17" }],
    "2026-09-03",
    "2026-09-10",
  );
  assert.deepEqual(
    rows.map((r) => r.action),
    ["Interview", "Application"],
  );
});
test("scheduled, cancelled, other contact and unknown application dates are excluded", () => {
  assert.equal(
    reportEntries(
      [{ ...job, applied_on: null }],
      [
        { ...activity, state: "Scheduled" },
        { ...activity, state: "Cancelled" },
        { ...activity, kind: "Contact" },
      ],
      "",
      "",
    ).length,
    0,
  );
});
test("invalid dates are rejected, leap dates accepted", () => {
  assert.ok(validateActivity({ ...activity, occurred_on: "2026-02-29" }));
  assert.equal(
    validateActivity({ ...activity, occurred_on: "2028-02-29" }),
    null,
  );
});
