import type { Opportunity } from "./opportunities";
export type Activity = {
  id: string;
  opportunity_id: string;
  kind: "Interview" | "Contact";
  state: "Scheduled" | "Completed" | "Cancelled";
  occurred_on: string;
  title: string;
  notes: string;
};
export function validateActivity(value: Omit<Activity, "id">) {
  if (
    !["Interview", "Contact"].includes(value.kind) ||
    !["Scheduled", "Completed", "Cancelled"].includes(value.state)
  )
    return "Choose a valid activity and state.";
  if (!value.title.trim()) return "Enter a title.";
  const date = new Date(value.occurred_on + "T12:00:00Z");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value.occurred_on) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value.occurred_on
  )
    return "Enter a valid date.";
  return null;
}
export function reportEntries(
  jobs: Opportunity[],
  activities: Activity[],
  from: string,
  to: string,
) {
  const applications = jobs
    .filter((j) => j.applied_on)
    .map((j) => ({
      id: j.id,
      job: j,
      date: j.applied_on!,
      action: "Application",
    }));
  const interviews = activities
    .filter((a) => a.kind === "Interview" && a.state === "Completed")
    .flatMap((a) => {
      const job = jobs.find((j) => j.id === a.opportunity_id);
      return job
        ? [{ id: a.id, job, date: a.occurred_on, action: "Interview" }]
        : [];
    });
  return [...applications, ...interviews]
    .filter((a) => (!from || a.date >= from) && (!to || a.date <= to))
    .sort((a, b) => b.date.localeCompare(a.date));
}
