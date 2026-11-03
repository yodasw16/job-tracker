import type { Activity } from "./activities";
import type { Opportunity } from "./opportunities";

export type NextAction = {
  id: string;
  opportunity_id: string;
  title: string;
  due_on: string | null;
  completed: boolean;
};

export function validateNextAction(value: NextAction) {
  if (typeof value.title !== "string" || !value.title.trim())
    return "Enter an action title.";
  if (typeof value.completed !== "boolean")
    return "Choose a valid completion state.";
  if (typeof value.opportunity_id !== "string" || !value.opportunity_id)
    return "Choose an opportunity.";
  if (value.due_on !== null) {
    const date = new Date(value.due_on + "T12:00:00Z");
    if (
      typeof value.due_on !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value.due_on) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value.due_on
    )
      return "Enter a valid due date or leave it blank.";
  }
  return null;
}

export function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function attentionEntries(
  jobs: Opportunity[],
  activities: Activity[],
  actions: NextAction[],
) {
  const opportunities = new Map(jobs.map((job) => [job.id, job]));
  const interviews = activities
    .filter((a) => a.kind === "Interview" && a.state === "Scheduled")
    .map((a) => ({
      id: a.id,
      opportunity_id: a.opportunity_id,
      title: a.title,
      date: a.occurred_on as string | null,
      kind: "Interview" as const,
    }));
  const pending = actions
    .filter((a) => !a.completed)
    .map((a) => ({
      id: a.id,
      opportunity_id: a.opportunity_id,
      title: a.title,
      date: a.due_on,
      kind: "Next action" as const,
    }));
  return [...interviews, ...pending]
    .flatMap((entry) => {
      const job = opportunities.get(entry.opportunity_id);
      return job ? [{ ...entry, job }] : [];
    })
    .sort((a, b) =>
      a.date === b.date
        ? a.title.localeCompare(b.title)
        : a.date === null
          ? 1
          : b.date === null
            ? -1
            : a.date.localeCompare(b.date),
    );
}
