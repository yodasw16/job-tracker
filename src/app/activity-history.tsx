"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Activity, validateActivity } from "@/lib/activities";
import { displayDate, type Opportunity } from "@/lib/opportunities";
import { saveActivity } from "./actions";
import styles from "./tracker.module.css";
export default function ActivityHistory({
  job,
  activities,
  preview,
  onSaved,
}: {
  job: Opportunity;
  activities: Activity[];
  preview: boolean;
  onSaved: (a: Activity) => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Activity | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section>
      <h3>Activity history</h3>
      {job.applied_on && (
        <article className={styles.card}>
          <strong>Application submitted</strong>
          <p>{displayDate(job.applied_on)}</p>
          <p className={styles.muted}>Change this date in Edit opportunity.</p>
        </article>
      )}
      {activities
        .filter((a) => a.opportunity_id === job.id)
        .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on))
        .map((a) => (
          <article className={styles.card} key={a.id}>
            <strong>{a.title}</strong>
            <p>
              {a.kind} · {a.state} · {displayDate(a.occurred_on)}
            </p>
            <p className={styles.prose}>{a.notes}</p>
            <button
              className={styles.secondary}
              disabled={busy}
              onClick={() => {
                setDraft({ ...a });
                setError("");
              }}
            >
              Edit activity
            </button>
          </article>
        ))}
      {!draft ? (
        <button
          className={styles.secondary}
          onClick={() => {
            setError("");
            setDraft({
              id: crypto.randomUUID(),
              opportunity_id: job.id,
              kind: "Interview",
              state: "Scheduled",
              occurred_on: "",
              title: "",
              notes: "",
            });
          }}
        >
          Add activity
        </button>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const validation = validateActivity(draft);
            if (validation) {
              setError(validation);
              return;
            }
            setBusy(true);
            setError("");
            try {
              if (!preview) {
                const result = await saveActivity(draft);
                if (result.error) {
                  setError(result.error);
                  return;
                }
              }
              onSaved(draft);
              setDraft(null);
              router.refresh();
            } catch {
              setError(
                "Connection failed. Your entries are still here; please retry.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset className={styles.fields} disabled={busy}>
            <legend>
              {activities.some((a) => a.id === draft.id)
                ? "Edit activity"
                : "New activity"}
            </legend>
            <label>
              Activity type
              <select
                value={draft.kind}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    kind: e.target.value as Activity["kind"],
                  })
                }
              >
                <option>Interview</option>
                <option>Contact</option>
              </select>
            </label>
            <label>
              Title
              <input
                required
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Recruiter call"
              />
            </label>
            <div className={styles.formRow}>
              <label>
                Date
                <input
                  type="date"
                  required
                  value={draft.occurred_on}
                  onChange={(e) =>
                    setDraft({ ...draft, occurred_on: e.target.value })
                  }
                />
              </label>
              <label>
                Activity state
                <select
                  value={draft.state}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      state: e.target.value as Activity["state"],
                    })
                  }
                >
                  <option>Scheduled</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </label>
            </div>
            <label>
              Notes or interview summary
              <textarea
                rows={5}
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </label>
          </fieldset>
          <p role="alert" className={styles.error}>
            {error}
          </p>
          <div className={styles.actions}>
            <button className={styles.primary} disabled={busy}>
              {busy ? "Saving…" : "Save activity"}
            </button>
            <button
              type="button"
              className={styles.secondary}
              disabled={busy}
              onClick={() => setDraft(null)}
            >
              Cancel activity
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
