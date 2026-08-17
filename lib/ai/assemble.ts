import { callForJson } from "@/lib/ai/client";
import type { SkeletonStage } from "@/lib/ai/skeleton";
import type { SeedResource } from "@/lib/ai/seed-resources";
import type { PathOption, StoredStage, StoredStageResource } from "@/lib/db/in-memory-paths";

export type AssembledStage = {
  order_index: number;
  selected_resources: { url: string; is_primary: boolean }[];
  practice_check: string;
};

export function isPaidBudget(budget: number, currency: string = "USD"): boolean {
  const curr = currency.toUpperCase();
  if (curr === "INR") return budget > 100;
  if (curr === "EUR") return budget > 1;
  return budget > 1;
}

export async function assemblePath(params: {
  stages: SkeletonStage[];
  resourcePool: SeedResource[];
  budgetTotal: number;
  currency: string;
}): Promise<AssembledStage[]> {
  const paidBudget = isPaidBudget(params.budgetTotal, params.currency);

  const effectivePool = paidBudget
    ? params.resourcePool
    : params.resourcePool.filter((r) => r.price === 0);

  const system = `You are assembling a personalized learning path. Match candidate resources from the provided pool to the learning stages. Output JSON only.`;

  const user = `Learner Target Budget: ${params.budgetTotal} ${params.currency}
Paid Budget Mode: ${paidBudget}

Stages:
${JSON.stringify(
  params.stages.map((s) => ({
    order_index: s.order_index,
    title: s.title,
    search_topics: s.search_topics,
  })),
  null,
  2
)}

Candidate resource pool:
${JSON.stringify(effectivePool, null, 2)}`;

  try {
    const result = await callForJson<{ stages: AssembledStage[] }>({
      system,
      user,
      maxTokens: 3000,
    });
    return result.stages || [];
  } catch {
    return [];
  }
}

function buildPathOption(
  optionId: string,
  optionName: string,
  tagline: string,
  skeleton: SkeletonStage[],
  resourcePool: SeedResource[],
  budgetTotal: number,
  currency: string,
  paidStrategy: "mastery" | "practical" | "saver"
): PathOption {
  const paidBudget = isPaidBudget(budgetTotal, currency);
  const paidPool = resourcePool.filter((r) => r.price > 0);
  const freePool = resourcePool.filter((r) => r.price === 0);

  let remainingBudget = budgetTotal;
  let totalCost = 0;
  let totalHours = 0;

  let targetPaidList = [...paidPool];
  if (paidStrategy === "mastery") {
    targetPaidList.sort((a, b) => a.price - b.price);
  } else if (paidStrategy === "practical") {
    targetPaidList.sort((a, b) => b.price - a.price);
  } else if (paidStrategy === "saver") {
    targetPaidList = paidPool
      .filter((r) => r.price <= budgetTotal * 0.6)
      .sort((a, b) => a.price - b.price);
    if (!targetPaidList.length) targetPaidList = [...paidPool].sort((a, b) => a.price - b.price);
  }

  const usedPaidUrls = new Set<string>();

  const stages: StoredStage[] = skeleton.map((stg) => {
    totalHours += stg.estimated_hours;
    const stageTopics = stg.search_topics.map((t) => t.toLowerCase());
    const stageTitle = stg.title.toLowerCase();

    const stageResources: StoredStageResource[] = [];

    // If paid budget is available, allocate matching paid courses as primary resources
    if (paidBudget && remainingBudget > 0) {
      let matchingPaid = targetPaidList.find((p) => {
        if (usedPaidUrls.has(p.url)) return false;
        if (p.price > remainingBudget) return false;

        return p.topic_hints.some(
          (hint) =>
            stageTitle.includes(hint.toLowerCase()) ||
            stageTopics.some(
              (t) => t.includes(hint.toLowerCase()) || hint.toLowerCase().includes(t)
            )
        );
      });

      // Fallback: if no strict topic match, pick the next available paid course fitting the remaining budget
      if (!matchingPaid) {
        matchingPaid = targetPaidList.find(
          (p) => !usedPaidUrls.has(p.url) && p.price <= remainingBudget
        );
      }

      if (matchingPaid) {
        usedPaidUrls.add(matchingPaid.url);
        remainingBudget -= matchingPaid.price;
        totalCost += matchingPaid.price;

        stageResources.push({
          is_primary: true,
          order_index: 0,
          resources: matchingPaid,
        });
      }
    }

    // Fill remaining slots with free docs/tutorials
    const matchingFree = freePool.filter((f) =>
      f.topic_hints.some(
        (hint) =>
          stageTitle.includes(hint.toLowerCase()) ||
          stageTopics.some(
            (t) => t.includes(hint.toLowerCase()) || hint.toLowerCase().includes(t)
          )
      )
    );

    const selectFree = matchingFree.length ? matchingFree : freePool;
    const slotsNeeded = stageResources.length === 0 ? 2 : 1;

    selectFree.slice(0, slotsNeeded).forEach((freeRes) => {
      stageResources.push({
        is_primary: stageResources.length === 0,
        order_index: stageResources.length,
        resources: freeRes,
      });
    });

    return {
      id: `stage-${stg.order_index}`,
      order_index: stg.order_index,
      title: stg.title,
      description: stg.description,
      estimated_hours: stg.estimated_hours,
      stage_resources: stageResources,
      stage_progress: [
        {
          practice_check: {
            description: `Build a practical ${stg.title} project exercise and verify core concepts.`,
          },
        },
      ],
    };
  });

  return {
    id: optionId,
    name: optionName,
    tagline,
    total_cost: totalCost,
    total_hours: totalHours,
    stages,
  };
}

export async function generateMultiplePathOptions(params: {
  skeleton: SkeletonStage[];
  resourcePool: SeedResource[];
  budgetTotal: number;
  currency: string;
}): Promise<PathOption[]> {
  const paidBudget = isPaidBudget(params.budgetTotal, params.currency);

  const opt1 = buildPathOption(
    "opt-1",
    "Comprehensive Mastery Path",
    paidBudget
      ? "Combines structured paid courses with official documentation for deep expertise."
      : "Complete foundational roadmap using official documentation and top free tutorials.",
    params.skeleton,
    params.resourcePool,
    params.budgetTotal,
    params.currency,
    "mastery"
  );

  const opt2 = buildPathOption(
    "opt-2",
    "Fast-Track Practical Path",
    paidBudget
      ? "Project-driven path with video courses and hands-on exercises tailored to your budget."
      : "Hands-on roadmap emphasizing practical video tutorials and build exercises.",
    params.skeleton,
    params.resourcePool,
    params.budgetTotal,
    params.currency,
    "practical"
  );

  const opt3 = buildPathOption(
    "opt-3",
    "Essential & Budget Saver Path",
    paidBudget
      ? "Picks high-value core courses while maximizing free documentation to save budget."
      : "Lightweight, essential tutorial path for quick entry.",
    params.skeleton,
    params.resourcePool,
    params.budgetTotal,
    params.currency,
    "saver"
  );

  return [opt1, opt2, opt3];
}
