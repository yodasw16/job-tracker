import { redirect } from "next/navigation";
import { configured, supabaseServer } from "@/lib/supabase/server";
import Tracker from "./tracker";
import { logger } from "@/lib/logger";
import styles from "./tracker.module.css";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!configured())
    return (
      <main className={styles.login}>
        <p className={styles.eyebrow}>JOB TRACKER · SETUP</p>
        <h1>Your next chapter, organized.</h1>
        <p>The app foundation is ready to connect to your private database.</p>
        <section className={styles.panel}>
          <h2>Connect Supabase</h2>
          <p>
            Follow the project README to configure the project URL and
            publishable key, apply the reviewed migration, and create your
            email/password account.
          </p>
          <p>No existing Supabase data has been changed.</p>
          <a href="/preview">Explore the interface with sample data →</a>
        </section>
      </main>
    );
  const client = await supabaseServer();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await client
    .from("opportunities")
    .select(
      "id,company,role,job_url,salary,address,description,status,applied_on,created_at",
    )
    .order("created_at", { ascending: false });
  const { data: activities, error: activityError } = await client
    .from("activities")
    .select("id,opportunity_id,kind,state,occurred_on,title,notes");
  const { data: nextActions, error: nextActionError } = await client
    .from("next_actions")
    .select("id,opportunity_id,title,due_on,completed");
  if (error || activityError || nextActionError) {
    logger.error(
      "workspace.load_failed",
      (error || activityError || nextActionError)?.code,
    );
    return (
      <main className={styles.login}>
        <h1>We couldn’t load your opportunities</h1>
        <p>Check your connection and database setup, then try again.</p>
        <a href="/">Retry</a>
      </main>
    );
  }
  return (
    <Tracker
      initial={data || []}
      initialActivities={activities || []}
      initialNextActions={nextActions || []}
    />
  );
}
