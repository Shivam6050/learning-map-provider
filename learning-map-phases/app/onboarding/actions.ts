"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateSkeleton } from "@/lib/ai/skeleton";
import { assemblePath } from "@/lib/ai/assemble";
import {
  ensureBackendDevField,
  ensureSeedResources,
  getSeedResourcePool,
} from "@/lib/db/ensure-seed-data";

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
  const weeklyHours = Number(formData.get("weeklyHours"));
  const budgetTotal = Number(formData.get("budgetTotal"));
  const currency = String(formData.get("currency") ?? "USD");

  let skeleton: any[];
  let assembled: any[];

  try {
    // --- Stage 1: skeleton (no search, per the pipeline design) ---
    skeleton = await generateSkeleton({
      fieldName: "Backend Development",
      skillLevel,
      weeklyHours,
    });

    // --- Stages 2/3 stand-in for Phase 1: hardcoded resource pool ---
    const resourcePool = getSeedResourcePool();

    // --- Combined selection + assembly (Phase 1 simplification) ---
    assembled = await assemblePath({
      stages: skeleton,
      resourcePool,
      budgetTotal,
      currency,
    });
  } catch (err: any) {
    const errorMsg = err?.message || "Failed to generate learning path. Check your Groq API key in .env.local.";
    redirect(`/onboarding?error=${encodeURIComponent(errorMsg)}`);
  }

  const resourcePool = getSeedResourcePool();

  // --- Guardrail: drop any URL the model returned that isn't actually
  // in the candidate pool we gave it. This is the enforcement that
  // matters, not the prompt instruction alone. ---
  const validUrls = new Set(resourcePool.map((r) => r.url));
  const sanitized = assembled.map((stage: any) => ({
    ...stage,
    selected_resources: stage.selected_resources.filter((r: any) =>
      validUrls.has(r.url)
    ),
  }));

  // --- Ensure field + resource rows exist (service role — these
  // tables have no client write policy) ---
  const fieldId = await ensureBackendDevField();
  const urlToResourceId = await ensureSeedResources();

  let pathId = "demo-path-" + Math.random().toString(36).substring(2, 9);

  try {
    const { data: path } = await supabase
      .from("learning_paths")
      .insert({
        user_id: user?.id ?? "demo-user-id",
        field_id: fieldId,
        skill_level: skillLevel,
        weekly_hours: weeklyHours,
        budget_total: budgetTotal,
        currency,
        status: "active",
      })
      .select("id")
      .single();

    if (path?.id) {
      pathId = path.id;

      const service = createServiceClient();
      for (const stage of skeleton) {
        const assembledStage = sanitized.find(
          (s) => s.order_index === stage.order_index
        );

        const { data: stageRow } = await service
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

        if (stageRow?.id && assembledStage?.selected_resources.length) {
          const rows = assembledStage.selected_resources
            .map((r: any, i: number) => {
              const resourceId = urlToResourceId.get(r.url);
              if (!resourceId) return null;
              return {
                stage_id: stageRow.id,
                resource_id: resourceId,
                order_index: i,
                is_primary: r.is_primary,
              };
            })
            .filter((r: any): r is NonNullable<typeof r> => r !== null);

          if (rows.length) {
            await service.from("stage_resources").insert(rows);
          }
        }

        if (stageRow?.id && assembledStage?.practice_check) {
          await supabase.from("stage_progress").insert({
            stage_id: stageRow.id,
            user_id: user?.id ?? "demo-user-id",
            status: "not_started",
            practice_check: { description: assembledStage.practice_check },
          });
        }
      }
    }
  } catch {
    // If DB is unconfigured or in fallback mode, redirect to path view with fallback ID
  }

  redirect(`/paths/${pathId}`);
}
