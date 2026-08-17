"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateSkeleton } from "@/lib/ai/skeleton";
import { assemblePath } from "@/lib/ai/assemble";
import { getAdjustedResourcePool } from "@/lib/ai/seed-resources";
import { inMemoryPaths } from "@/lib/db/in-memory-paths";
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

  let skeleton: any[];
  let assembled: any[];

  const resourcePool = getAdjustedResourcePool(currency);

  try {
    skeleton = await generateSkeleton({
      fieldName: "Backend Development",
      skillLevel,
      weeklyHours,
    });

    assembled = await assemblePath({
      stages: skeleton,
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

  const validUrls = new Set(resourcePool.map((r) => r.url));
  const sanitized = assembled.map((stage: any) => ({
    ...stage,
    selected_resources: (stage.selected_resources || []).filter((r: any) =>
      validUrls.has(r.url)
    ),
  }));

  const urlToResourceMap = new Map(resourcePool.map((r) => [r.url, r]));

  const pathId = "path-" + Math.random().toString(36).substring(2, 9);

  const formattedStages = skeleton.map((stage: any) => {
    const assembledStage = sanitized.find(
      (s) => s.order_index === stage.order_index
    );

    const selectedResources = assembledStage?.selected_resources || [];
    const stageResources = selectedResources.map((r: any, i: number) => {
      const res = urlToResourceMap.get(r.url) || {
        title: "Learning Resource",
        url: r.url,
        platform: "article",
        resource_type: "article",
        price: 0,
        currency,
      };

      return {
        is_primary: r.is_primary ?? i === 0,
        order_index: i,
        resources: res,
      };
    });

    return {
      id: `stage-${stage.order_index}`,
      order_index: stage.order_index,
      title: stage.title,
      description: stage.description,
      estimated_hours: stage.estimated_hours,
      stage_resources: stageResources,
      stage_progress: [
        {
          practice_check: {
            description:
              assembledStage?.practice_check ||
              "Complete the practical exercise for this stage.",
          },
        },
      ],
    };
  });

  // Store in memory for reliable fallback & demo mode
  inMemoryPaths.set(pathId, {
    id: pathId,
    field_name: "Backend Development",
    skill_level: skillLevel,
    weekly_hours: weeklyHours,
    budget_total: budgetTotal,
    currency,
    stages: formattedStages,
  });

  // Also try to persist into Supabase if DB tables exist
  try {
    const fieldId = await ensureBackendDevField();
    const urlToResourceId = await ensureSeedResources();

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
      const dbPathId = path.id;
      const service = createServiceClient();

      for (const stage of skeleton) {
        const assembledStage = sanitized.find(
          (s) => s.order_index === stage.order_index
        );

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

      // If DB insert succeeded, also register dbPathId in inMemoryPaths
      inMemoryPaths.set(dbPathId, {
        id: dbPathId,
        field_name: "Backend Development",
        skill_level: skillLevel,
        weekly_hours: weeklyHours,
        budget_total: budgetTotal,
        currency,
        stages: formattedStages,
      });

      redirect(`/paths/${dbPathId}`);
    }
  } catch {
    // If DB is unconfigured, redirect to pathId backed by inMemoryPaths
  }

  redirect(`/paths/${pathId}`);
}
