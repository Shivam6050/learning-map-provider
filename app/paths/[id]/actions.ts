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

export async function savePracticeNote(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const stageId = String(formData.get("stageId"));
  const pathId = String(formData.get("pathId"));
  const userSubmission = String(formData.get("submissionNote") ?? "").trim();

  // Fetch current progress row to merge with existing practice_check JSON
  const { data: existingProgress } = await supabase
    .from("stage_progress")
    .select("practice_check")
    .eq("stage_id", stageId)
    .eq("user_id", user.id)
    .maybeSingle();

  const currentCheck = (existingProgress?.practice_check as Record<string, any>) ?? {};
  const updatedCheck = {
    ...currentCheck,
    user_submission: userSubmission,
    submitted_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("stage_progress")
    .update({ practice_check: updatedCheck, updated_at: new Date().toISOString() })
    .eq("stage_id", stageId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Failed to save practice note: ${error.message}`);
  }

  revalidatePath(`/paths/${pathId}`);
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

  const { error } = await supabase
    .from("resource_ratings")
    .upsert(
      { resource_id: resourceId, user_id: user.id, rating },
      { onConflict: "resource_id,user_id" }
    );

  if (error) throw new Error(`Failed to save rating: ${error.message}`);

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
