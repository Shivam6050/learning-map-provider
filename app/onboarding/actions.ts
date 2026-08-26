"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateSkeleton } from "@/lib/ai/skeleton";
import { judgeStage } from "@/lib/ai/judge";
import { generatePracticeChecks } from "@/lib/ai/practice-checks";
import { buildPathOptions } from "@/lib/ai/build-options";
import { discoverYoutubeForTopic } from "@/lib/youtube/discover";
import { discoverWebForTopic } from "@/lib/web-discovery/discover";
import { ensureBackendDevField } from "@/lib/db/ensure-seed-data";
import type { DiscoveredResource } from "@/lib/youtube/discover";

export async function generatePath(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const skillLevel = String(formData.get("skillLevel")) as
    | "beginner"
    | "intermediate"
    | "advanced";
  const weeklyHours = Number(formData.get("weeklyHours") || 5);
  const budgetTotal = Number(formData.get("budgetTotal") || 0);
  const currency = String(formData.get("currency") ?? "USD");

  try {
    // --- Field row needed before discovery now, since discovered
    // resources propose trusted_sources scoped to this field ---
    const fieldId = await ensureBackendDevField();

    // --- Stage 1: skeleton (no search) ---
    const skeleton = await generateSkeleton({
      fieldName: "Backend Development",
      skillLevel,
      weeklyHours,
    });

    // --- Stage 2: real discovery, cache-first, per stage's search topics ---
    const resourcesByUrl = new Map<string, DiscoveredResource>();
    const candidatesByStage = new Map<number, DiscoveredResource[]>();

    for (const stage of skeleton) {
      const stageCandidates: DiscoveredResource[] = [];
      for (const topic of stage.search_topics) {
        const [youtubeResults, webResults] = await Promise.all([
          discoverYoutubeForTopic(topic, fieldId),
          discoverWebForTopic(topic, fieldId),
        ]);
        for (const r of [...youtubeResults, ...webResults]) {
          if (!resourcesByUrl.has(r.url)) resourcesByUrl.set(r.url, r);
          if (!stageCandidates.some((c) => c.url === r.url)) stageCandidates.push(r);
        }
      }
      candidatesByStage.set(stage.order_index, stageCandidates);
    }

    // --- Stage 3: real judgment per stage, grounded in real candidates ---
    const judgedStages = await Promise.all(
      skeleton.map((stage) => judgeStage(stage, candidatesByStage.get(stage.order_index) ?? []))
    );

    // --- Practice checks, one Gemini call shared across all 3 options ---
    const practiceChecksByStage = await generatePracticeChecks(skeleton);

    // --- Deterministic option-building (no LLM call) over the REAL,
    // already-vetted candidates — see lib/ai/build-options.ts ---
    const options = buildPathOptions({
      skeleton,
      judgedStages,
      resourcesByUrl,
      budgetTotal,
      practiceChecksByStage,
    });

    // --- Persist the pending option set to the DATABASE, not memory,
    // so it survives across serverless instances until confirmation ---
    const { data: pendingSet, error: pendingError } = await supabase
      .from("pending_path_sets")
      .insert({
        user_id: user.id,
        field_id: fieldId,
        skill_level: skillLevel,
        weekly_hours: weeklyHours,
        budget_total: budgetTotal,
        currency,
        options,
      })
      .select("id")
      .single();

    if (pendingError || !pendingSet) {
      throw new Error(`Failed to save path options: ${pendingError?.message}`);
    }

    redirect(`/onboarding/select?set=${pendingSet.id}`);
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) {
      // Next.js redirect()/notFound() internals throw a special object
      // with a "digest" — rethrow so Next.js can actually handle it,
      // rather than treating it as a real error.
      throw err;
    }
    const message = err instanceof Error ? err.message : "Failed to generate learning path.";
    console.error("[generatePath]", message);
    redirect(`/onboarding?error=${encodeURIComponent(message)}`);
  }
}

export async function confirmSelectedPath(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const setId = String(formData.get("setId"));
  const optionId = String(formData.get("optionId"));

  try {
    // RLS (pending_path_sets_owner_all) already ensures this only
    // returns a row if it belongs to the current user.
    const { data: pathSet, error: fetchError } = await supabase
      .from("pending_path_sets")
      .select("*")
      .eq("id", setId)
      .maybeSingle();

    if (fetchError) throw new Error(`Failed to load path options: ${fetchError.message}`);
    if (!pathSet) throw new Error("Path options not found or expired. Please generate a new path.");

    const options = pathSet.options as { id: string; stages: any[] }[];
    const selectedOption = options.find((opt) => opt.id === optionId) ?? options[0];
    if (!selectedOption) throw new Error("No path option available to confirm.");

    const { data: path, error: pathError } = await supabase
      .from("learning_paths")
      .insert({
        user_id: user.id,
        field_id: pathSet.field_id,
        skill_level: pathSet.skill_level,
        weekly_hours: pathSet.weekly_hours,
        budget_total: pathSet.budget_total,
        currency: pathSet.currency,
        status: "active",
      })
      .select("id")
      .single();

    if (pathError || !path) throw new Error(`Failed to create learning path: ${pathError?.message}`);

    const service = createServiceClient();

    for (const stage of selectedOption.stages) {
      const { data: stageRow, error: stageError } = await service
        .from("stages")
        .insert({
          path_id: path.id,
          title: stage.title,
          order_index: stage.order_index,
          description: stage.description,
          estimated_hours: stage.estimated_hours,
        })
        .select("id")
        .single();

      if (stageError || !stageRow) throw new Error(`Failed to create stage: ${stageError?.message}`);

      if (stage.stage_resources?.length) {
        const rows = stage.stage_resources.map((sr: any) => ({
          stage_id: stageRow.id,
          resource_id: sr.resource_id,
          order_index: sr.order_index,
          is_primary: sr.is_primary,
        }));
        const { error: linkError } = await service.from("stage_resources").insert(rows);
        if (linkError) throw new Error(`Failed to link resources: ${linkError.message}`);
      }

      if (stage.practice_check) {
        const { error: progressError } = await supabase.from("stage_progress").insert({
          stage_id: stageRow.id,
          user_id: user.id,
          status: "not_started",
          practice_check: { description: stage.practice_check },
        });
        if (progressError) {
          throw new Error(`Failed to save practice check: ${progressError.message}`);
        }
      }
    }

    // Clean up — this pending set has been confirmed, no need to keep it.
    await supabase.from("pending_path_sets").delete().eq("id", setId);

    redirect(`/paths/${path.id}`);
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    const message = err instanceof Error ? err.message : "Failed to confirm path.";
    console.error("[confirmSelectedPath]", message);
    redirect(`/onboarding?error=${encodeURIComponent(message)}`);
  }
}
