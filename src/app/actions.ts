"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { configured, supabaseServer } from "@/lib/supabase/server";
import { validateOpportunity, type Opportunity } from "@/lib/opportunities";
export async function login(form: FormData) {
  if (!configured()) return { error: "Connect Supabase before signing in." };
  const client = await supabaseServer();
  const { error } = await client.auth.signInWithPassword({
    email: String(form.get("email") || "").trim(),
    password: String(form.get("password") || ""),
  });
  if (error)
    return {
      error: "Could not sign in. Check your email and password and try again.",
    };
  redirect("/");
}
export async function logout() {
  const client = await supabaseServer();
  const { error } = await client.auth.signOut();
  if (error) throw new Error("Could not sign out. Please retry.");
  redirect("/login");
}
export async function saveOpportunity(
  value: Omit<Opportunity, "id">,
  id?: string,
) {
  const validation = validateOpportunity(value);
  if (validation) return { error: validation };
  if (!configured()) return { error: "Supabase is not connected." };
  const client = await supabaseServer();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user)
    return { error: "Your session has expired. Sign in again before saving." };
  const payload = {
    company: value.company.trim(),
    role: value.role.trim(),
    job_url: value.job_url.trim(),
    salary: value.salary.trim(),
    address: value.address.trim(),
    description: value.description,
    status: value.status,
    applied_on: value.applied_on || null,
  };
  const query = id
    ? client
        .from("opportunities")
        .update(payload)
        .eq("id", id)
        .eq("user_id", user.id)
    : client.from("opportunities").insert({ ...payload, user_id: user.id });
  const { data, error } = await query.select("id").single();
  if (error)
    return {
      error: "Unable to save. Your entries are still here; please retry.",
    };
  revalidatePath("/");
  return { id: data.id as string };
}

export async function saveActivity(value: import("@/lib/activities").Activity) {
  const { validateActivity } = await import("@/lib/activities");
  const validation = validateActivity(value);
  if (validation) return { error: validation };
  const client = await supabaseServer();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { error: "Sign in again before saving." };
  const { error } = await client
    .from("activities")
    .upsert({
      id: value.id,
      opportunity_id: value.opportunity_id,
      user_id: user.id,
      kind: value.kind,
      state: value.state,
      occurred_on: value.occurred_on,
      title: value.title.trim(),
      notes: value.notes,
    })
    .select("id")
    .single();
  if (error)
    return {
      error: "Unable to save. Your entries are still here; please retry.",
    };
  revalidatePath("/");
  return {};
}

export async function saveNextAction(
  value: import("@/lib/next-actions").NextAction,
) {
  const { validateNextAction } = await import("@/lib/next-actions");
  const { logger } = await import("@/lib/logger");
  const validation = validateNextAction(value);
  if (validation) return { error: validation };
  if (!configured()) return { error: "Supabase is not connected." };
  const client = await supabaseServer();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) {
    logger.error("next_action.session_unavailable", authError?.code);
    return { error: "Your session has expired. Sign in again before saving." };
  }
  const { error } = await client
    .from("next_actions")
    .upsert({
      id: value.id,
      opportunity_id: value.opportunity_id,
      user_id: user.id,
      title: value.title.trim(),
      due_on: value.due_on,
      completed: value.completed,
    })
    .select("id")
    .single();
  if (error) {
    logger.error("next_action.save_failed", error.code);
    return {
      error: "Unable to save. Your entries are still here; please retry.",
    };
  }
  logger.info("next_action.saved");
  revalidatePath("/");
  return {};
}
