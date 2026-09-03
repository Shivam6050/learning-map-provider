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
import { currencyToRegion } from "@/lib/youtube/region";
import { ensureField } from "@/lib/db/ensure-seed-data";
import { getFieldBySlug } from "@/lib/fields/catalog";
import { getQuizForField, blendSkillLevel, type SkillLevel } from "@/lib/onboarding/skill-quiz";
import type { DiscoveredResource } from "@/lib/youtube/discover";
import { ensureSeedCandidates } from "@/lib/ai/seed-resources";
import { logError } from "@/lib/monitoring/log-error";

const VALID_SKILL_LEVELS: SkillLevel[] = ["beginner", "intermediate", "advanced"];
const VALID_CURRENCIES = ["USD", "INR", "EUR"];
const MAX_GENERATIONS_PER_DAY = 10;

export async function generatePath(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Every field is attacker-controllable regardless of what the <select>/
  // <input> HTML enforces — a direct POST to this action skips all of
  // it. Validate for real, not just trust the form.
  const field = getFieldBySlug(String(formData.get("fieldSlug")));
  if (!field) {
    redirect("/onboarding?error=Invalid field selection");
  }

  const rawSkillLevel = String(formData.get("skillLevel"));
  if (!VALID_SKILL_LEVELS.includes(rawSkillLevel as SkillLevel)) {
    redirect("/onboarding?error=Invalid skill level");
  }
  const selfReportedLevel = rawSkillLevel as SkillLevel;

  const weeklyHours = Number(formData.get("weeklyHours"));
  if (!Number.isFinite(weeklyHours) || weeklyHours < 1 || weeklyHours > 80) {
    redirect("/onboarding?error=Weekly hours must be between 1 and 80");
  }

  const budgetTotal = Number(formData.get("budgetTotal"));
  if (!Number.isFinite(budgetTotal) || budgetTotal < 0 || budgetTotal > 100000) {
    redirect("/onboarding?error=Budget must be between 0 and 100,000");
  }

  const rawCurrency = String(formData.get("currency") ?? "USD");
  const currency = VALID_CURRENCIES.includes(rawCurrency) ? rawCurrency : "USD";

  // Rate limit: each generation triggers several real Gemini + YouTube
  // API calls, which cost real money and real quota. Without a cap, one
  // careless or malicious user hammering "generate" burns both for
  // everyone else. 10/day is generous for real use, tight enough to
  // stop abuse. Counts pending_path_sets, not learning_paths, since
  // that's created on every generation attempt regardless of whether
  // the user ever confirms an option.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentGenerations } = await supabase
    .from("pending_path_sets")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .gte("created_at", since);

  if ((recentGenerations ?? 0) >= MAX_GENERATIONS_PER_DAY) {
    redirect("/onboarding?error=You've reached today's limit of 10 path generations. Try again tomorrow.");
  }

  // Blend the self-reported level with the quiz — only for fields that
  let skillLevel: SkillLevel = selfReportedLevel;
  let quizScore = 0;
  let quizImpliedLevel: SkillLevel = selfReportedLevel;

  const fieldQuiz = getQuizForField(field!.slug);
  const quizAnswers = fieldQuiz.map((q) => {
    const val = formData.get(`quiz_${q.id}`);
    return val !== null && val !== "" ? Number(val) : -1;
  });

  const answeredCount = quizAnswers.filter((a) => a >= 0).length;
  if (answeredCount > 0) {
    const blended = blendSkillLevel(selfReportedLevel, quizAnswers, field!.slug);
    skillLevel = blended.finalLevel;
    quizScore = blended.quizScore;
    quizImpliedLevel = blended.quizImpliedLevel;
  }

  try {
    // --- Field row needed before discovery now, since discovered
    // resources propose trusted_sources scoped to this field ---
    const fieldId = await ensureField(field!.name, field!.slug);

    // --- Stage 1: skeleton (no search) ---
    const skeleton = await generateSkeleton({
      fieldName: field!.name,
      skillLevel,
      weeklyHours,
    });

    // --- Stage 2: real discovery (parallelized for fast performance) ---
    const resourcesByUrl = new Map<string, DiscoveredResource>();
    const candidatesByStage = new Map<number, DiscoveredResource[]>();

    const stageResults = await Promise.all(
      skeleton.map(async (stage) => {
        const stageCandidates: DiscoveredResource[] = [];

        const seedCandidates = await ensureSeedCandidates(stage.search_topics, currency, budgetTotal).catch(() => []);
        for (const s of seedCandidates) {
          if (!stageCandidates.some((c) => c.url === s.url)) stageCandidates.push(s);
        }

        const topicPromises = stage.search_topics.map(async (topic) => {
          try {
            const [youtubeResults, webResults] = await Promise.all([
              discoverYoutubeForTopic(topic, fieldId, currencyToRegion(currency)).catch(() => []),
              discoverWebForTopic(topic, fieldId).catch(() => []),
            ]);
            return [...youtubeResults, ...webResults];
          } catch {
            return [];
          }
        });

        const topicResults = await Promise.all(topicPromises);
        for (const list of topicResults) {
          for (const r of list) {
            if (!stageCandidates.some((c) => c.url === r.url)) stageCandidates.push(r);
          }
        }

        return { order_index: stage.order_index, candidates: stageCandidates };
      })
    );

    for (const res of stageResults) {
      candidatesByStage.set(res.order_index, res.candidates);
      for (const r of res.candidates) {
        if (!resourcesByUrl.has(r.url)) {
          resourcesByUrl.set(r.url, r);
        }
      }
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

    redirect(
      `/onboarding/select?set=${pendingSet.id}&quizScore=${quizScore}&quizImplied=${quizImpliedLevel}&selfReported=${selfReportedLevel}&finalLevel=${skillLevel}`
    );
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) {
      // Next.js redirect()/notFound() internals throw a special object
      // with a "digest" — rethrow so Next.js can actually handle it,
      // rather than treating it as a real error.
      throw err;
    }
    const message = err instanceof Error ? err.message : "Failed to generate learning path.";
    await logError("generatePath", err);
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
    await logError("confirmSelectedPath", err);
    redirect(`/onboarding?error=${encodeURIComponent(message)}`);
  }
}
