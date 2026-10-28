"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getLearningUser } from "@/lib/auth/learning-user";
import { requireUuid } from "@/lib/security/validation";
import { parseRoadmapPreferences, type PreferenceState } from "@/lib/paths/preferences";

export async function updateRoadmapPreferences(_previous: PreferenceState, form: FormData): Promise<PreferenceState> {
  const next = parseRoadmapPreferences(form.get("weeklyHours"), form.get("budgetTotal"));
  const expected = parseRoadmapPreferences(form.get("previousWeeklyHours"), form.get("previousBudgetTotal"));
  let id: string;
  try { id = requireUuid(String(form.get("pathId"))); } catch { return { ok: false, message: "This roadmap is unavailable." }; }
  if (!next || !expected) return { ok: false, message: "Choose 1–80 whole hours per week and a budget from 0 to 100,000, with at most two decimal places." };
  const client = await createClient();
  const { data: { user } } = await getLearningUser(client, `/paths/${id}`);
  if (!user) return { ok: false, message: "Your session expired. Sign in again before saving." };
  try {
    // Use the user's session/RLS, never a service client. Only preferences are writable here.
    const { data: path, error } = await client.from("learning_paths").select("weekly_hours, budget_total")
      .eq("id", id).eq("user_id", user.id).maybeSingle();
    if (error) return { ok: false, message: "Could not load your roadmap. Please try again." };
    if (!path) return { ok: false, message: "This roadmap is unavailable." };
    if (Number(path.weekly_hours) !== expected.weeklyHours || Number(path.budget_total ?? 0) !== expected.budgetTotal)
      return { ok: false, message: "Your roadmap changed in another tab. Refresh before editing again." };
    let query = client.from("learning_paths").update({ weekly_hours: next.weeklyHours, budget_total: next.budgetTotal })
      .eq("id", id).eq("user_id", user.id).eq("weekly_hours", path.weekly_hours);
    query = path.budget_total === null ? query.is("budget_total", null) : query.eq("budget_total", path.budget_total);
    const { data: saved, error: saveError } = await query.select("id").maybeSingle();
    if (saveError) return { ok: false, message: "Could not save your changes. Please try again." };
    if (!saved) return { ok: false, message: "Your roadmap changed in another tab. Refresh before editing again." };
  } catch { return { ok: false, message: "Saving is temporarily unavailable. Your changes are still here; please retry." }; }
  revalidatePath(`/paths/${id}`);
  revalidatePath("/dashboard");
  return { ok: true, message: "Roadmap updated. Your courses, notes and progress are preserved." };
}
