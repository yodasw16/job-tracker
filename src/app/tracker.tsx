"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import {
  statuses,
  sortOpportunities,
  displayDate,
  validateOpportunity,
  type Opportunity,
  type Status,
} from "@/lib/opportunities";
import { saveOpportunity, logout } from "./actions";
import ActivityHistory from "./activity-history";
import NextActions from "./next-actions";
import {
  attentionEntries,
  localDate,
  type NextAction,
} from "@/lib/next-actions";
import { reportEntries, type Activity } from "@/lib/activities";
import styles from "./tracker.module.css";
const blank: Omit<Opportunity, "id"> = {
  company: "",
  role: "",
  job_url: "",
  salary: "",
  address: "",
  description: "",
  status: "Interested",
  applied_on: null,
};
function JobLink({ job }: { job: Opportunity }) {
  let valid = false;
  try {
    valid = ["https:", "http:"].includes(new URL(job.job_url).protocol);
  } catch {}
  return valid ? (
    <a
      className={styles.jobLink}
      href={job.job_url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open job post for ${job.company} (new tab)`}
    >
      Open job post ↗
    </a>
  ) : (
    <span className={styles.muted}>No job link saved</span>
  );
}
export default function Tracker({
  initial,
  preview = false,
  initialActivities = [],
  initialNextActions = [],
}: {
  initial: Opportunity[];
  initialActivities?: Activity[];
  initialNextActions?: NextAction[];
  preview?: boolean;
}) {
  const router = useRouter();
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const updateDate = () => setToday(localDate(new Date()));
    updateDate();
    const timer = window.setInterval(updateDate, 60_000);
    window.addEventListener("focus", updateDate);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", updateDate);
    };
  }, []);
  const [nextActionEdits, setNextActionEdits] = useState<NextAction[]>([]);
  const nextActions = [
    ...initialNextActions.filter(
      (a) => !nextActionEdits.some((b) => a.id === b.id),
    ),
    ...nextActionEdits,
  ];
  const [activityEdits, setActivityEdits] = useState<Activity[]>([]);
  const activities = [
    ...initialActivities.filter(
      (a) => !activityEdits.some((b) => a.id === b.id),
    ),
    ...activityEdits,
  ];
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [samples, setSamples] = useState(initial);
  const jobs = preview ? samples : initial;
  const [order, setOrder] = useState("status");
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...blank });
  const [editId, setEditId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  function edit(job?: Opportunity) {
    setDraft(job ? { ...job } : { ...blank });
    setEditId(job?.id);
    setError("");
    setEditing(true);
  }
  const attention = attentionEntries(jobs, activities, nextActions);
  const sorted = sortOpportunities(jobs, order);
  const groups =
    order === "status"
      ? statuses
          .map((status) => ({
            title: status,
            items: sorted.filter((j) => j.status === status),
          }))
          .filter((g) => g.items.length)
      : [{ title: "All opportunities", items: sorted }];
  return (
    <>
      <a className={styles.skip} href="#main">
        Skip to opportunities
      </a>
      <header className={styles.header}>
        <a className={styles.brand} href={preview ? "/preview" : "/"}>
          job tracker<span>Your next chapter</span>
        </a>
        <div>
          {preview ? (
            <span className={styles.pill}>Sample workspace</span>
          ) : (
            <form action={logout}>
              <button className={styles.secondary}>Sign out</button>
            </form>
          )}
        </div>
      </header>
      <main id="main" className={styles.main}>
        {preview && (
          <p className={styles.preview}>
            Fictional examples · Changes stay in this preview until you reload.{" "}
            <a href="/">Connection setup</a>
          </p>
        )}
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>YOUR SEARCH</p>
            <h1>Opportunities</h1>
            <p className={styles.muted}>Keep the possibilities in view.</p>
          </div>
          <button className={styles.primary} onClick={() => edit()}>
            + Add opportunity
          </button>
        </div>
        <section className={styles.panel} aria-labelledby="attention-heading">
          <h2 id="attention-heading">Upcoming interviews & next actions</h2>
          <p className={styles.muted}>
            Scheduled interviews stay here until you mark them completed or
            cancelled.
          </p>
          {!attention.length ? (
            <p>
              No scheduled interviews or pending next actions. Add them from an
              opportunity.
            </p>
          ) : (
            <div className={styles.grid}>
              {attention.map((entry) => (
                <article
                  className={styles.card}
                  key={`${entry.kind}-${entry.id}`}
                >
                  <span className={styles.pill}>{entry.kind}</span>
                  <h3>{entry.title}</h3>
                  <p>
                    {entry.job.company} · {entry.job.role}
                  </p>
                  <p
                    className={
                      today && entry.date && entry.date < today
                        ? styles.overdue
                        : undefined
                    }
                  >
                    {entry.date ? (
                      <>
                        <time dateTime={entry.date}>
                          {displayDate(entry.date)}
                        </time>
                        {today &&
                          (entry.date < today
                            ? " · Overdue — review status"
                            : entry.date === today
                              ? " · Today"
                              : " · Upcoming")}
                      </>
                    ) : (
                      "No due date"
                    )}
                  </p>
                  <button
                    className={styles.secondary}
                    onClick={() => setSelected(entry.job)}
                    aria-label={`Open ${entry.job.company}: ${entry.title}`}
                  >
                    Open opportunity
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
        <div className={styles.toolbar}>
          <span>
            {jobs.length} {jobs.length === 1 ? "opportunity" : "opportunities"}
          </span>
          <label>
            Arrange by{" "}
            <select value={order} onChange={(e) => setOrder(e.target.value)}>
              <option value="status">Status</option>
              <option value="newest">Applied · newest first</option>
              <option value="oldest">Applied · oldest first</option>
            </select>
          </label>
        </div>
        <p role="status">{notice}</p>
        {!jobs.length && (
          <section className={styles.empty}>
            <h2>A place for your next possibility.</h2>
            <p>
              Add a role you’re considering or an application you’ve already
              sent.
            </p>
            <button className={styles.primary} onClick={() => edit()}>
              Add your first opportunity
            </button>
          </section>
        )}
        <details className={styles.panel}>
          <summary>Activity reporting</summary>
          <p>
            Applications and completed interviews, including both dates below.
          </p>
          <div className={styles.formRow}>
            <label>
              From
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label>
              Through
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
          {from && to && from > to ? (
            <p role="alert">Choose an end date on or after the start date.</p>
          ) : (
            <>
              <p>
                {reportEntries(jobs, activities, from, to).length} reportable
                activities
              </p>
              <div className={styles.grid}>
                {reportEntries(jobs, activities, from, to).map((entry) => (
                  <article className={styles.card} key={entry.id}>
                    <h3>{entry.job.company}</h3>
                    <p>
                      {displayDate(entry.date)} · {entry.action}
                    </p>
                    <p className={styles.prose}>
                      {entry.job.address || "Address not recorded"}
                    </p>
                  </article>
                ))}
              </div>
            </>
          )}
        </details>
        {groups.map((group) => (
          <section key={group.title} className={styles.group}>
            <h2>
              {group.title} <span>{group.items.length}</span>
            </h2>
            <div className={styles.grid}>
              {group.items.map((job) => (
                <article className={styles.card} key={job.id}>
                  <span className={styles.pill}>{job.status}</span>
                  <h3>
                    <button
                      className={styles.titleButton}
                      onClick={() => setSelected(job)}
                    >
                      {job.company}
                    </button>
                  </h3>
                  <p>{job.role}</p>
                  <p className={styles.salary}>
                    {job.salary || "Salary not recorded"}
                  </p>
                  <p className={styles.muted}>
                    {job.applied_on
                      ? `Applied ${displayDate(job.applied_on)}`
                      : job.status === "Interested"
                        ? "Not yet applied"
                        : "Application date not recorded"}
                  </p>
                  <div className={styles.cardActions}>
                    <JobLink job={job} />
                    <button
                      className={styles.secondary}
                      aria-label={`View ${job.company} opportunity`}
                      onClick={() => setSelected(job)}
                    >
                      View details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
      <Dialog.Root
        open={Boolean(selected) && !editing}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.backdrop} />
          <Dialog.Popup className={styles.dialog}>
            <Dialog.Title>{selected?.company}</Dialog.Title>
            <Dialog.Description>{selected?.role}</Dialog.Description>
            {selected && (
              <>
                <span className={styles.pill}>{selected.status}</span>
                <p>{selected.salary || "Salary not recorded"}</p>
                <p>{displayDate(selected.applied_on)}</p>
                <JobLink job={selected} />
                <ActivityHistory
                  key={selected.id}
                  job={selected}
                  activities={activities}
                  preview={preview}
                  onSaved={(activity) =>
                    setActivityEdits((current) => [
                      ...current.filter((a) => a.id !== activity.id),
                      activity,
                    ])
                  }
                />
                <NextActions
                  opportunityId={selected.id}
                  actions={nextActions}
                  preview={preview}
                  onSaved={(action) =>
                    setNextActionEdits((current) => [
                      ...current.filter((a) => a.id !== action.id),
                      action,
                    ])
                  }
                />
                <h3>Headquarters address</h3>
                <p className={styles.prose}>
                  {selected.address || "No address recorded"}
                </p>
                <h3>Saved job description</h3>
                <p className={styles.prose}>
                  {selected.description || "No description saved yet."}
                </p>
                <div className={styles.actions}>
                  <button
                    className={styles.primary}
                    onClick={() => edit(selected)}
                  >
                    Edit opportunity
                  </button>
                  <Dialog.Close className={styles.secondary}>
                    Close
                  </Dialog.Close>
                </div>
              </>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root
        open={editing}
        onOpenChange={(open) => {
          if (!busy) setEditing(open);
        }}
        disablePointerDismissal
      >
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.backdrop} />
          <Dialog.Popup className={styles.dialog}>
            <Dialog.Title>
              {editId ? "Edit opportunity" : "Add opportunity"}
            </Dialog.Title>
            <Dialog.Description>
              Start with a company and role. Add other details whenever you have
              them.
            </Dialog.Description>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                const message = validateOpportunity(draft);
                if (message) {
                  setError(message);
                  return;
                }
                setBusy(true);
                try {
                  if (preview) {
                    const job = { ...draft, id: editId || crypto.randomUUID() };
                    setSamples((current) =>
                      editId
                        ? current.map((j) => (j.id === editId ? job : j))
                        : [job, ...current],
                    );
                    setNotice("Saved in this preview.");
                  } else {
                    const result = await saveOpportunity(draft, editId);
                    if (result.error) {
                      setError(result.error);
                      return;
                    }
                    setNotice("Opportunity saved.");
                    router.refresh();
                  }
                  setEditing(false);
                  setSelected(null);
                } catch {
                  setError(
                    "Connection failed. Your entries are still here; please retry.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <fieldset disabled={busy} className={styles.fields}>
                <label>
                  Company <span>(required)</span>
                  <input
                    required
                    value={draft.company}
                    onChange={(e) =>
                      setDraft({ ...draft, company: e.target.value })
                    }
                  />
                </label>
                <label>
                  Role <span>(required)</span>
                  <input
                    required
                    value={draft.role}
                    onChange={(e) =>
                      setDraft({ ...draft, role: e.target.value })
                    }
                  />
                </label>
                <label>
                  Job post URL
                  <input
                    type="url"
                    placeholder="https://…"
                    value={draft.job_url}
                    onChange={(e) =>
                      setDraft({ ...draft, job_url: e.target.value })
                    }
                  />
                </label>
                <label>
                  Salary range
                  <input
                    value={draft.salary}
                    onChange={(e) =>
                      setDraft({ ...draft, salary: e.target.value })
                    }
                  />
                </label>
                <div className={styles.formRow}>
                  <label>
                    Status
                    <select
                      value={draft.status}
                      onChange={(e) =>
                        setDraft({ ...draft, status: e.target.value as Status })
                      }
                    >
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Date applied
                    <input
                      type="date"
                      value={draft.applied_on || ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          applied_on: e.target.value || null,
                        })
                      }
                    />
                  </label>
                </div>
                <label>
                  Headquarters address
                  <textarea
                    rows={2}
                    value={draft.address}
                    onChange={(e) =>
                      setDraft({ ...draft, address: e.target.value })
                    }
                  />
                </label>
                <label>
                  Saved job description
                  <textarea
                    rows={6}
                    value={draft.description}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                  />
                </label>
              </fieldset>
              <p role="alert" className={styles.error}>
                {error}
              </p>
              <div className={styles.actions}>
                <button className={styles.primary} disabled={busy}>
                  {busy ? "Saving…" : "Save opportunity"}
                </button>
                <Dialog.Close
                  disabled={busy}
                  type="button"
                  className={styles.secondary}
                >
                  Cancel
                </Dialog.Close>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
