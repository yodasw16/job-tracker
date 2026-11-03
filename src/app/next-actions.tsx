"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { type NextAction, validateNextAction } from "@/lib/next-actions";
import { displayDate } from "@/lib/opportunities";
import { saveNextAction } from "./actions";
import styles from "./tracker.module.css";

export default function NextActions({
  opportunityId,
  actions,
  preview,
  onSaved,
}: {
  opportunityId: string;
  actions: NextAction[];
  preview: boolean;
  onSaved: (action: NextAction) => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<NextAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  return (
    <section aria-label="Next actions">
      <h3>Next actions</h3>
      {actions
        .filter((a) => a.opportunity_id === opportunityId)
        .map((action) => (
          <article className={styles.card} key={action.id}>
            <strong>{action.title}</strong>
            <p>
              {action.completed ? "Completed" : "Pending"} ·{" "}
              {action.due_on
                ? `Due ${displayDate(action.due_on)}`
                : "No due date"}
            </p>
            <button
              className={styles.secondary}
              disabled={busy}
              onClick={() => {
                setDraft({ ...action });
                setError("");
                setNotice("");
              }}
              aria-label={`Edit action: ${action.title}`}
            >
              Edit action
            </button>
          </article>
        ))}
      <p role="status">{notice}</p>
      {!draft ? (
        <button
          className={styles.secondary}
          onClick={() => {
            setDraft({
              id: crypto.randomUUID(),
              opportunity_id: opportunityId,
              title: "",
              due_on: null,
              completed: false,
            });
            setError("");
            setNotice("");
          }}
        >
          Add next action
        </button>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const validation = validateNextAction(draft);
            if (validation) {
              setError(validation);
              return;
            }
            setBusy(true);
            setError("");
            try {
              if (!preview) {
                const result = await saveNextAction(draft);
                if (result.error) {
                  setError(result.error);
                  return;
                }
              }
              onSaved(draft);
              setDraft(null);
              setNotice(
                preview ? "Saved in this preview." : "Next action saved.",
              );
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
              {actions.some((a) => a.id === draft.id)
                ? "Edit next action"
                : "New next action"}
            </legend>
            <label>
              Action title
              <input
                required
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <label>
              Due date (optional)
              <input
                type="date"
                value={draft.due_on || ""}
                onChange={(e) =>
                  setDraft({ ...draft, due_on: e.target.value || null })
                }
              />
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={draft.completed}
                onChange={(e) =>
                  setDraft({ ...draft, completed: e.target.checked })
                }
              />
              Completed
            </label>
          </fieldset>
          <p className={styles.error} role="alert">
            {error}
          </p>
          <div className={styles.actions}>
            <button className={styles.primary} disabled={busy}>
              {busy ? "Saving…" : "Save next action"}
            </button>
            <button
              type="button"
              className={styles.secondary}
              disabled={busy}
              onClick={() => {
                setDraft(null);
                setError("");
              }}
            >
              Cancel next action
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
