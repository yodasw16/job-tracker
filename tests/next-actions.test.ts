import test from "node:test";
import assert from "node:assert/strict";
import {
  attentionEntries,
  localDate,
  validateNextAction,
  type NextAction,
} from "../src/lib/next-actions";
import type { Opportunity } from "../src/lib/opportunities";
import type { Activity } from "../src/lib/activities";
const job: Opportunity = {
  id: "job",
  company: "Example",
  role: "Manager",
  status: "Rejected",
  applied_on: null,
  job_url: "",
  salary: "",
  address: "",
  description: "",
};
const action: NextAction = {
  id: "action",
  opportunity_id: "job",
  title: "Follow up",
  due_on: null,
  completed: false,
};
const interview: Activity = {
  id: "interview",
  opportunity_id: "job",
  title: "Recruiter",
  kind: "Interview",
  state: "Scheduled",
  occurred_on: "2026-11-02",
  notes: "",
};
test("overview keeps overdue scheduled interviews even for closed opportunities; excludes resolved interviews and contacts", () => {
  const entries = attentionEntries(
    [job],
    [
      interview,
      { ...interview, id: "done", state: "Completed" },
      { ...interview, id: "cancelled", state: "Cancelled" },
      { ...interview, id: "contact", kind: "Contact" },
      { ...interview, id: "orphan", opportunity_id: "missing" },
    ],
    [],
  );
  assert.deepEqual(
    entries.map((e) => e.id),
    ["interview"],
  );
});
test("overview orders overdue, today, future, then undated actions; hides completed and orphan actions", () => {
  const entries = attentionEntries(
    [job],
    [interview],
    [
      action,
      { ...action, id: "today", due_on: "2026-11-03" },
      { ...action, id: "future", due_on: "2026-11-06" },
      { ...action, id: "done", completed: true },
      { ...action, id: "orphan", opportunity_id: "missing" },
    ],
  );
  assert.deepEqual(
    entries.map((e) => e.id),
    ["interview", "today", "future", "action"],
  );
  assert.equal(action.due_on, null);
});
test("next action accepts optional dates and validates real calendar dates and completion state", () => {
  assert.equal(validateNextAction(action), null);
  assert.equal(validateNextAction({ ...action, due_on: "2028-02-29" }), null);
  for (const due_on of ["2026-02-29", "2026-13-01", "", "2026-2-03"])
    assert.ok(validateNextAction({ ...action, due_on }));
  assert.ok(validateNextAction({ ...action, title: "  " }));
  assert.ok(
    validateNextAction({ ...action, completed: "false" as unknown as boolean }),
  );
});
test("calendar date uses local calendar components near UTC day boundaries", () => {
  const date = new Date(2026, 10, 3, 0, 1);
  assert.equal(localDate(date), "2026-11-03");
  assert.equal(localDate(new Date(2026, 10, 3, 23, 59)), "2026-11-03");
});
