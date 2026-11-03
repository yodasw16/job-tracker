"use client";
import { useState } from "react";
import { login } from "../actions";
import styles from "../tracker.module.css";
export default function LoginForm({ ready }: { ready: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className={styles.login}>
      <p className={styles.eyebrow}>JOB TRACKER</p>
      <h1>A little clarity for your next chapter.</h1>
      <p>Sign in to your private workspace.</p>
      <form
        className={styles.panel}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const result = await login(new FormData(e.currentTarget));
            if (result) setError(result.error);
          } catch {
            setError("Connection failed. Please try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Email
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <p role="alert">{error}</p>
        <button className={styles.primary} disabled={busy || !ready}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        {!ready && (
          <p>
            Supabase setup is pending. <a href="/">View the setup page</a>.
          </p>
        )}
      </form>
    </main>
  );
}
