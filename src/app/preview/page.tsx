import Tracker from "../tracker";
export default function Preview() {
  return (
    <Tracker
      preview
      initialActivities={[
        {
          id: "preview-overdue",
          opportunity_id: "sample-1",
          kind: "Interview",
          state: "Scheduled",
          occurred_on: "2026-11-02",
          title: "Recruiter conversation",
          notes:
            "Fictional overdue interview. Update its state after the conversation.",
        },
        {
          id: "preview-upcoming",
          opportunity_id: "sample-1",
          kind: "Interview",
          state: "Scheduled",
          occurred_on: "2026-11-06",
          title: "Team interview",
          notes: "Fictional upcoming interview.",
        },
      ]}
      initialNextActions={[
        {
          id: "preview-action",
          opportunity_id: "sample-2",
          title: "Follow up with recruiter",
          due_on: "2026-11-03",
          completed: false,
        },
        {
          id: "preview-undated",
          opportunity_id: "sample-1",
          title: "Prepare leadership examples",
          due_on: null,
          completed: false,
        },
      ]}
      initial={[
        {
          id: "sample-1",
          company: "Northstar Studio",
          role: "UX Engineering Manager",
          job_url: "https://example.com/jobs/northstar",
          salary: "$180,000–$220,000",
          address: "100 Example Avenue, Detroit, MI 48201",
          description:
            "Lead a frontend team building accessible product experiences. Partner with design and product, coach engineers, and guide delivery.",
          status: "Interviewing",
          applied_on: "2026-09-03",
        },
        {
          id: "sample-2",
          company: "Harbor Works",
          role: "Engineering Manager",
          job_url: "https://example.com/jobs/harbor",
          salary: "$175,000–$215,000",
          address: "",
          description: "",
          status: "Applied",
          applied_on: "2026-09-12",
        },
      ]}
    />
  );
}
