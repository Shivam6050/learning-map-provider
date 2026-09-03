"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const VALID_STATUSES = ["not_started", "in_progress", "completed"] as const;
type Status = (typeof VALID_STATUSES)[number];

export async function updateStageProgress(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const stageId = String(formData.get("stageId"));
  const pathId = String(formData.get("pathId"));
  const status = String(formData.get("status")) as Status;

  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  // RLS's stage_progress_owner_all policy enforces user_id = auth.uid()
  // on this update regardless of what's in the form — a tampered
  // stageId just updates nothing (0 rows match), not someone else's row.
  const updatePayload: Record<string, any> = {
    status,
    completed_at: status === "completed" ? new Date().toISOString() : null,
  };

  let { error, count } = await supabase
    .from("stage_progress")
    .update({ ...updatePayload, updated_at: new Date().toISOString() })
    .eq("stage_id", stageId)
    .eq("user_id", user.id)
    .select("*", { count: "exact", head: true });

  if (error && error.message.includes("updated_at")) {
    const fallback = await supabase
      .from("stage_progress")
      .update(updatePayload)
      .eq("stage_id", stageId)
      .eq("user_id", user.id)
      .select("*", { count: "exact", head: true });
    error = fallback.error;
    count = fallback.count;
  }

  if (error) {
    throw new Error(`Failed to update progress: ${error.message}`);
  }

  if (count === 0) {
    let { error: insertError } = await supabase.from("stage_progress").insert({
      stage_id: stageId,
      user_id: user.id,
      ...updatePayload,
      updated_at: new Date().toISOString(),
    });

    if (insertError && insertError.message.includes("updated_at")) {
      const fallbackInsert = await supabase.from("stage_progress").insert({
        stage_id: stageId,
        user_id: user.id,
        ...updatePayload,
      });
      insertError = fallbackInsert.error;
    }

    if (insertError) {
      throw new Error(`Failed to create progress row: ${insertError.message}`);
    }
  }

  revalidatePath(`/paths/${pathId}`);
  revalidatePath("/dashboard");
}

export async function rateResource(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const resourceId = String(formData.get("resourceId"));
  const pathId = String(formData.get("pathId"));
  const rating = Number(formData.get("rating"));

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error(`Invalid rating: ${rating}`);
  }

  // resource_ratings_owner_write/update policies enforce user_id =
  // auth.uid(); the unique(resource_id, user_id) constraint is what
  // makes upsert-by-that-pair correct instead of creating duplicates.
  const { error } = await supabase
    .from("resource_ratings")
    .upsert(
      { resource_id: resourceId, user_id: user.id, rating },
      { onConflict: "resource_id,user_id" }
    );

  if (error) throw new Error(`Failed to save rating: ${error.message}`);

  // Recompute the aggregate. resources isn't client-writable (see
  // schema.sql — no update policy for authenticated), so this goes
  // through the service role deliberately, not as a workaround.
  const service = createServiceClient();
  const { data: allRatings } = await service
    .from("resource_ratings")
    .select("rating")
    .eq("resource_id", resourceId);

  if (allRatings?.length) {
    const avg = allRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / allRatings.length;
    await service
      .from("resources")
      .update({ rating: Math.round(avg * 100) / 100 })
      .eq("id", resourceId);
  }

  revalidatePath(`/paths/${pathId}`);
}
