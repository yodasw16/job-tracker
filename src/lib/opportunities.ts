export const statuses = [
  "Interested",
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
  "Withdrawn",
  "Closed",
] as const;
export type Status = (typeof statuses)[number];
export type Opportunity = {
  id: string;
  company: string;
  role: string;
  job_url: string;
  salary: string;
  address: string;
  description: string;
  status: Status;
  applied_on: string | null;
  created_at?: string;
};
export function validateOpportunity(
  value: Omit<Opportunity, "id">,
): string | null {
  if (!value.company.trim() || !value.role.trim())
    return "Enter a company and role.";
  if (!statuses.includes(value.status)) return "Choose a valid status.";
  if (value.job_url) {
    try {
      const url = new URL(value.job_url);
      if (!["https:", "http:"].includes(url.protocol))
        return "Use an http or https job link.";
    } catch {
      return "Enter a complete job URL, including https://.";
    }
  }
  if (value.applied_on) {
    const date = new Date(value.applied_on + "T12:00:00Z");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value.applied_on) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value.applied_on
    )
      return "Enter a valid application date.";
  }
  return null;
}
export function sortOpportunities(items: Opportunity[], order: string) {
  return [...items].sort((a, b) => {
    if (!a.applied_on && !b.applied_on)
      return a.company.localeCompare(b.company);
    if (!a.applied_on) return 1;
    if (!b.applied_on) return -1;
    return order === "oldest"
      ? a.applied_on.localeCompare(b.applied_on)
      : b.applied_on.localeCompare(a.applied_on);
  });
}
export function displayDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(value + "T12:00:00Z"))
    : "Application date not recorded";
}
