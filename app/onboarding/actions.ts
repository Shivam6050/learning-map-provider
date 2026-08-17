"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateSkeleton } from "@/lib/ai/skeleton";
import { generateMultiplePathOptions } from "@/lib/ai/assemble";
import { getAdjustedResourcePool } from "@/lib/ai/seed-resources";
import { inMemoryPaths, inMemoryPathSets } from "@/lib/db/in-memory-paths";
import {
  ensureBackendDevField,
  ensureSeedResources,
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
  const weeklyHours = Number(formData.get("weeklyHours") || 5);
  const budgetTotal = Number(formData.get("budgetTotal") || 0);
  const currency = String(formData.get("currency") ?? "USD");

  const resourcePool = getAdjustedResourcePool(currency);
  let options: any[] = [];

  try {
    const skeleton = await generateSkeleton({
      fieldName: "Backend Development",
      skillLevel,
      weeklyHours,
    });

    options = await generateMultiplePathOptions({
      skeleton,
      resourcePool,
      budgetTotal,
      currency,
    });
  } catch (err: any) {
    const errorMsg =
      err?.message ||
      "Failed to generate learning path. Check your GEMINI_API_KEY in .env.local.";
    redirect(`/onboarding?error=${encodeURIComponent(errorMsg)}`);
  }

  const setId = "set-" + Math.random().toString(36).substring(2, 9);

  // Store the generated path options set so the user can select and confirm one
  inMemoryPathSets.set(setId, {
    setId,
    field_name: "Backend Development",
    skill_level: skillLevel,
    weekly_hours: weeklyHours,
    budget_total: budgetTotal,
    currency,
    options,
  });

  redirect(`/onboarding/select?set=${setId}`);
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

  const pathSet = inMemoryPathSets.get(setId);
  if (!pathSet) {
    redirect("/onboarding?error=Path session expired. Please generate a new path.");
  }

  const selectedOption = pathSet.options.find((opt) => opt.id === optionId) || pathSet.options[0];

  const pathId = "path-" + Math.random().toString(36).substring(2, 9);

  // Register confirmed path in memory store
  inMemoryPaths.set(pathId, {
    id: pathId,
    field_name: pathSet.field_name,
    skill_level: pathSet.skill_level,
    weekly_hours: pathSet.weekly_hours,
    budget_total: pathSet.budget_total,
    currency: pathSet.currency,
    stages: selectedOption.stages,
  });

  // Attempt Supabase DB insertion
  try {
    const fieldId = await ensureBackendDevField();
    const urlToResourceId = await ensureSeedResources();

    const { data: path } = await supabase
      .from("learning_paths")
      .insert({
        user_id: user?.id ?? "demo-user-id",
        field_id: fieldId,
        skill_level: pathSet.skill_level,
        weekly_hours: pathSet.weekly_hours,
        budget_total: pathSet.budget_total,
        currency: pathSet.currency,
        status: "active",
      })
      .select("id")
      .single();

    if (path?.id) {
      const dbPathId = path.id;
      const service = createServiceClient();

      for (const stage of selectedOption.stages) {
        const { data: stageRow } = await service
          .from("stages")
          .insert({
            path_id: dbPathId,
            title: stage.title,
            order_index: stage.order_index,
            description: stage.description,
            estimated_hours: stage.estimated_hours,
          })
          .select("id")
          .single();

        if (stageRow?.id && stage.stage_resources?.length) {
          const rows = stage.stage_resources
            .map((sr: any) => {
              const resourceId = urlToResourceId.get(sr.resources.url);
              if (!resourceId) return null;
              return {
                stage_id: stageRow.id,
                resource_id: resourceId,
                order_index: sr.order_index,
                is_primary: sr.is_primary,
              };
            })
            .filter((r: any): r is NonNullable<typeof r> => r !== null);

          if (rows.length) {
            await service.from("stage_resources").insert(rows);
          }
        }

        if (stageRow?.id && stage.stage_progress?.[0]?.practice_check) {
          await supabase.from("stage_progress").insert({
            stage_id: stageRow.id,
            user_id: user?.id ?? "demo-user-id",
            status: "not_started",
            practice_check: stage.stage_progress[0].practice_check,
          });
        }
      }

      inMemoryPaths.set(dbPathId, {
        id: dbPathId,
        field_name: pathSet.field_name,
        skill_level: pathSet.skill_level,
        weekly_hours: pathSet.weekly_hours,
        budget_total: pathSet.budget_total,
        currency: pathSet.currency,
        stages: selectedOption.stages,
      });

      redirect(`/paths/${dbPathId}`);
    }
  } catch {
    // If DB is unconfigured, fallback to inMemoryPaths
  }

  redirect(`/paths/${pathId}`);
}
