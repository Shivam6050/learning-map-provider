"use server";
import { loadRoadmapTemplate } from "@/lib/templates/load";
import { getLearningUser } from "@/lib/auth/learning-user";

import { launchLimits } from "@/lib/config/launch";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateSkeleton } from "@/lib/ai/skeleton";
import { judgeStage } from "@/lib/ai/judge";
import { generatePracticeChecks } from "@/lib/ai/practice-checks";
import { savePath } from "@/lib/db/save-path";
import { includePurchased } from "@/lib/ai/include-purchased";
import type { PathOption } from "@/lib/ai/build-options";
import { buildPathOptions } from "@/lib/ai/build-options";
import { discoverYoutubeForTopic } from "@/lib/youtube/discover";
import { discoverUdemyCourses } from "@/lib/web-discovery/discover-udemy";
import { impactConfigured } from "@/lib/web-discovery/impact-catalog";
import { discoverWebForTopic } from "@/lib/web-discovery/discover";
import { cookies } from "next/headers";
import { CURRENCY_COOKIE } from "@/lib/currency/format";
import { currencyToRegion } from "@/lib/youtube/region";
import { ensureField } from "@/lib/db/ensure-seed-data";
import { getFieldBySlug } from "@/lib/fields/catalog";
import { getQuizForField, blendSkillLevel, type SkillLevel } from "@/lib/onboarding/skill-quiz";
import type { DiscoveredResource } from "@/lib/youtube/discover";
import { ensureSeedCandidates } from "@/lib/ai/seed-resources";
import { logError } from "@/lib/monitoring/log-error";

import { prepareCandidates } from "@/lib/link-check/prepare-candidates";

const VALID_SKILL_LEVELS: SkillLevel[] = ["beginner", "intermediate", "advanced"];
const VALID_CURRENCIES = ["USD", "INR", "EUR"];
export async function generatePath(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getLearningUser(supabase);

  if (!user) redirect("/login?next=/onboarding");
  const effectiveUserId = user.id;
  const limits = launchLimits();
  if (limits.paused) redirect("/onboarding?error=New roadmap generation is temporarily paused. Your saved paths are still available.");

  // Every field is attacker-controllable regardless of what the <select>/
  // <input> HTML enforces — a direct POST to this action skips all of
  // it. Validate for real, not just trust the form.
  const field = getFieldBySlug(String(formData.get("fieldSlug")));
  if (!field) {
    redirect("/onboarding?error=Invalid field selection");
  }

  const rawSkillLevel = String(formData.get("skillLevel"));
  if (rawSkillLevel !== "unknown" && !VALID_SKILL_LEVELS.includes(rawSkillLevel as SkillLevel)) {
    redirect("/onboarding?error=Invalid skill level");
  }
  const selfReportedLevel: SkillLevel = rawSkillLevel === "unknown" ? "beginner" : rawSkillLevel as SkillLevel;

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

  (await cookies()).set(CURRENCY_COOKIE, currency, { path: "/", maxAge: 31536000, sameSite: "lax", secure: process.env.NODE_ENV === "production" });

  const service = createServiceClient();

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
  if ((answeredCount > 0 && answeredCount !== fieldQuiz.length) || (rawSkillLevel === "unknown" && answeredCount !== fieldQuiz.length) || quizAnswers.some((answer, i) => answer !== -1 && (!Number.isInteger(answer) || answer < 0 || answer >= fieldQuiz[i].options.length))) {
    redirect("/onboarding?error=Complete every quiz question or choose your level and skip the quiz.");
  }
  if (answeredCount === fieldQuiz.length) {
    const blended = blendSkillLevel(selfReportedLevel, quizAnswers, field!.slug);
    skillLevel = blended.finalLevel;
    quizScore = blended.quizScore;
    quizImpliedLevel = blended.quizImpliedLevel;
  }

  // Validate the entire form before reserving capacity. Fail closed if quotas are unavailable.
  const { data: quota, error: quotaError } = await service.rpc("reserve_launch_generation", { p_user_id: user.id, p_user_limit: limits.userDaily, p_global_limit: limits.globalDaily });
  if (quotaError || !["allowed", "user_limit", "global_limit"].includes(quota)) redirect("/onboarding?error=Generation is temporarily unavailable. Your saved paths remain available.");
  if (quota === "user_limit") redirect("/onboarding?error=You have used today's generation allowance. Please return after midnight UTC; your saved paths remain available.");
  if (quota === "global_limit") redirect("/onboarding?error=Today's shared generation capacity is full. Please return after midnight UTC; your saved paths remain available.");

  try {
    // --- Field row needed before discovery now, since discovered
    // resources propose trusted_sources scoped to this field ---
    const fieldId = await ensureField(field!.name, field!.slug);

    // --- Stage 1: skeleton (no search) ---
    const generationStarted = Date.now();
    const template = await loadRoadmapTemplate(field!.slug, skillLevel, currency);
    const skeleton = template?.stages ?? await generateSkeleton({
      fieldName: field!.name,
      skillLevel,
      weeklyHours,
    });

    // --- Stage 2: real discovery (parallelized for fast performance) ---
    const resourcesByUrl = new Map<string, DiscoveredResource>();
    const candidatesByStage = new Map<number, DiscoveredResource[]>();

    let paidCatalogFailed = false;
    const stageResults = await Promise.all(
      skeleton.map(async (stage) => {
        const stageCandidates: DiscoveredResource[] = [];

        const catalogPromise = budgetTotal === 0 ? Promise.resolve([]) : discoverUdemyCourses(stage.search_topics, currency, budgetTotal).catch(error => {
          paidCatalogFailed = true;
          console.warn("[Udemy catalog]", error instanceof Error ? error.message : "Unavailable");
          return [];
        });
        const seedPromise = ensureSeedCandidates(stage.search_topics, currency, budgetTotal, field!.slug, template ? "paid" : "all").catch(() => []);

        const topicPromises = (template ? [] : stage.search_topics).map(async (topic) => {
          try {
            const [youtubeResults, webResults] = await Promise.all([
              discoverYoutubeForTopic(topic, fieldId, currencyToRegion(currency)).catch(() => []),
              discoverWebForTopic(topic, fieldId, currency, budgetTotal).catch(() => []),
            ]);
            return [...youtubeResults, ...webResults];
          } catch {
            return [];
          }
        });

        const [catalogCandidates, seedCandidates, topicResults] = await Promise.all([
          catalogPromise, seedPromise, Promise.all(topicPromises),
        ]);
        // Preserve catalog-first ordering and existing URL deduplication.
        stageCandidates.push(...catalogCandidates);
        for (const resource of seedCandidates) {
          if (!stageCandidates.some(candidate => candidate.url === resource.url)) stageCandidates.push(resource);
        }
        for (const list of topicResults) {
          for (const r of list) {
            if (!stageCandidates.some((c) => c.url === r.url)) stageCandidates.push(r);
          }
        }

        return { order_index: stage.order_index, candidates: stageCandidates };
      })
    );

    const freshPaidOrFallback = await prepareCandidates(stageResults.flatMap(stage => stage.candidates), currency, user.user_metadata?.country_of_residence);
    const verified = [...freshPaidOrFallback, ...(template?.stages.flatMap(stage => stage.candidates) ?? [])];
    if (template) for (const result of stageResults) result.candidates.push(...(template.stages.find(stage => stage.order_index === result.order_index)?.candidates ?? []));
    const verifiedByUrl = new Map(verified.map(resource => [resource.url, resource]));
    for (const res of stageResults) {
      res.candidates = res.candidates.flatMap(resource => { const valid = verifiedByUrl.get(resource.url); return valid ? [valid] : []; });
      if (!res.candidates.length) throw new Error("We could not verify learning resources for every stage. Please try again shortly or choose another field.");
      if (!res.candidates.some(resource => resource.price === 0)) throw new Error("We could not verify free resources for every stage. Please try again to build all three complete options.");
      candidatesByStage.set(res.order_index, res.candidates);
      for (const r of res.candidates) {
        if (!resourcesByUrl.has(r.url)) {
          resourcesByUrl.set(r.url, r);
        }
      }
    }

    // --- Stage 3: real judgment per stage, grounded in real candidates ---
    const [judgedStages, practiceChecksByStage] = template ? [
      template.stages.map(stage => ({order_index:stage.order_index,selected_resources:stage.candidates.map((r,i)=>({url:r.url,is_primary:i===0,reason:"Curated free roadmap resource"}))})),
      new Map(template.stages.map(stage => [stage.order_index,stage.practice_check])),
    ] as const : await Promise.all([
      Promise.all(skeleton.map((stage) => judgeStage(stage, candidatesByStage.get(stage.order_index) ?? []))),
      generatePracticeChecks(skeleton),
    ]);

    // --- Deterministic option-building (no LLM call) over the REAL,
    // already-vetted candidates — see lib/ai/build-options.ts ---
    const options = buildPathOptions({
      skeleton,
      judgedStages,
      candidatesByStage,
      resourcesByUrl,
      budgetTotal,
      currency,
      weeklyHours,
      practiceChecksByStage,
    });

    if (budgetTotal > 0) for (const option of options.slice(0, 2)) {
      if (option.total_cost === 0) option.availability_note = "No relevant paid course or subscription with a verified cost fits this tier. Free resources remain available; a higher budget may unlock paid options.";
    }
    console.info("[roadmap-generation]", {source:template ? "template" : "discovery",templateVersion:template?.version ?? null,field:field!.slug,level:skillLevel,durationMs:Date.now()-generationStarted});
    // --- Persist the pending option set to the DATABASE ---
    const { data: pendingSet, error: pendingError } = await service
      .from("pending_path_sets")
      .insert({
        user_id: effectiveUserId,
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
      `/onboarding/select?set=${pendingSet.id}&quizScore=${answeredCount ? quizScore : ""}&quizImplied=${quizImpliedLevel}&selfReported=${selfReportedLevel}&finalLevel=${skillLevel}`
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
    redirect(`/onboarding?error=${encodeURIComponent("We could not complete generation. Please try again shortly.")}`);
  }
}

export async function confirmSelectedPath(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getLearningUser(supabase);

  const setId = String(formData.get("setId") ?? "");
  const optionId = String(formData.get("optionId") ?? "");

  if (!user) {
    const nextPath = `/onboarding/select?set=${setId}&optionId=${optionId}&autoConfirm=1`;
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  try {
    const service = createServiceClient();
    const { data: pathSet, error: fetchError } = await service
      .from("pending_path_sets")
      .select("*")
      .eq("id", setId)
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (fetchError) throw new Error(`Failed to load path options: ${fetchError.message}`);
    if (!pathSet) throw new Error("Path options not found or expired. Please generate a new path.");

    const options = pathSet.options as PathOption[];
    const offeredOption = options.find((opt) => opt.id === optionId);
    if (!offeredOption) throw new Error("Choose a valid path option.");
    const selectedOption = includePurchased(offeredOption, formData.getAll("purchasedResourceId").map(String));
    if (!selectedOption) throw new Error("No path option available to confirm.");

    if (selectedOption.stages.some(stage => stage.stage_resources.some(r => r.resources.billing_interval === "month" && r.resources.url.includes("scrimba.com/")))) throw new Error("Refresh outdated Scrimba prices by generating new options.");
    const pathId = await savePath(service, user.id, setId, pathSet, selectedOption);
    // Keep the pending set until its normal expiry so an interrupted response can retry safely.
    redirect(`/paths/${pathId}`);
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    const message = err instanceof Error ? err.message : "Failed to confirm path.";
    await logError("confirmSelectedPath", err);
    const purchased = formData.getAll("purchasedResourceId").map(String).join(",");
    redirect(`/onboarding/select?set=${encodeURIComponent(setId)}&optionId=${encodeURIComponent(optionId)}&purchased=${encodeURIComponent(purchased)}&error=${encodeURIComponent("Saving was interrupted. Please retry or generate a new path if your options expired.")}`);
  }
}
