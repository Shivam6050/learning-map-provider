import { callForJson } from "@/lib/ai/client";
import type { SkeletonStage } from "@/lib/ai/skeleton";
import type { SeedResource } from "@/lib/ai/seed-resources";
import type { PathOption, StoredStage } from "@/lib/db/in-memory-paths";

export type AssembledStage = {
  order_index: number;
  selected_resources: { url: string; is_primary: boolean }[];
  practice_check: string;
};

const SYSTEM_PROMPT = `You are assembling a personalized learning path. You will be given:
1. An ordered list of learning stages (title, description, topic hints)
2. A pool of real candidate resources, each with a URL, price, currency, and topic hints
3. The learner's total budget and currency

You must choose 1-3 resources per stage from the candidate pool ONLY —
never invent a resource, never modify a URL, never reference anything not
present in the candidate pool. Match resources to stages using the topic
hints and descriptions provided.

CRITICAL BUDGET ALLOCATION RULES:
- If "Paid Budget Mode" is false (budget <= 1 USD, <= 1 EUR, or <= 100 INR): return ONLY free ($0) resources.
- If "Paid Budget Mode" is true: the learner is READY TO PAY for their learning path. You MUST actively select paid courses (price > 0) as the primary (is_primary: true) resources for key stages in the path until the total cost approaches their budget.
- Combine paid courses with official documentation/guides.
- Do NOT output a path with 0 paid resources when Paid Budget Mode is true.

For each stage, also write one "practice_check": a short (1-2 sentence)
description of a mini-project or quiz questions to self-verify understanding.

Output ONLY valid JSON, no prose, no markdown fences:
{
  "stages": [
    {
      "order_index": 0,
      "selected_resources": [
        { "url": "string, copied exactly from a candidate", "is_primary": true }
      ],
      "practice_check": "string"
    }
  ]
}`;

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

  const user = `Learner Target Budget: ${params.budgetTotal} ${params.currency}
Paid Budget Mode: ${paidBudget}

Stages:
${JSON.stringify(
  params.stages.map((s) => ({
    order_index: s.order_index,
    title: s.title,
    description: s.description,
    search_topics: s.search_topics,
  })),
  null,
  2
)}

Candidate resource pool:
${JSON.stringify(effectivePool, null, 2)}`;

  const result = await callForJson<{ stages: AssembledStage[] }>({
    system: SYSTEM_PROMPT,
    user,
    maxTokens: 3000,
  });

  const urlMap = new Map(params.resourcePool.map((r) => [r.url, r]));
  let assembledStages = result.stages || [];

  if (paidBudget) {
    let currentSpent = 0;
    assembledStages.forEach((s) => {
      (s.selected_resources || []).forEach((r) => {
        const item = urlMap.get(r.url);
        if (item?.price) currentSpent += item.price;
      });
    });

    if (currentSpent === 0) {
      const paidResources = params.resourcePool.filter((r) => r.price > 0);
      let remainingBudget = params.budgetTotal;

      assembledStages = assembledStages.map((stage) => {
        const stageInfo = params.stages.find(
          (st) => st.order_index === stage.order_index
        );
        const stageTitleLower = (stageInfo?.title || "").toLowerCase();
        const stageTopics = (stageInfo?.search_topics || []).map((t) =>
          t.toLowerCase()
        );

        const candidatePaid = paidResources.find((p) => {
          if (p.price > remainingBudget) return false;
          return (
            stageTitleLower.includes(p.title.toLowerCase()) ||
            p.topic_hints.some(
              (hint) =>
                stageTitleLower.includes(hint.toLowerCase()) ||
                stageTopics.some((st) => st.includes(hint.toLowerCase()))
            )
          );
        });

        if (candidatePaid) {
          remainingBudget -= candidatePaid.price;
          const freeResources = (stage.selected_resources || []).filter((r) => {
            const resObj = urlMap.get(r.url);
            return resObj && resObj.price === 0;
          });

          return {
            ...stage,
            selected_resources: [
              { url: candidatePaid.url, is_primary: true },
              ...freeResources.slice(0, 2).map((r) => ({ ...r, is_primary: false })),
            ],
          };
        }

        return stage;
      });
    }
  }

  return assembledStages;
}

export async function generateMultiplePathOptions(params: {
  skeleton: SkeletonStage[];
  resourcePool: SeedResource[];
  budgetTotal: number;
  currency: string;
}): Promise<PathOption[]> {
  const urlMap = new Map(params.resourcePool.map((r) => [r.url, r]));
  const validUrls = new Set(params.resourcePool.map((r) => r.url));
  const paidBudget = isPaidBudget(params.budgetTotal, params.currency);

  const baseAssembled = await assemblePath({
    stages: params.skeleton,
    resourcePool: params.resourcePool,
    budgetTotal: params.budgetTotal,
    currency: params.currency,
  });

  const availablePaid = params.resourcePool.filter((r) => r.price > 0);
  const availableFree = params.resourcePool.filter((r) => r.price === 0);

  const formatOptionStages = (
    assembledList: AssembledStage[],
    paidFilter?: (r: SeedResource) => boolean
  ): { stages: StoredStage[]; totalCost: number; totalHours: number } => {
    let totalHours = 0;
    let accumulatedBudgetSpent = 0;

    const stages: StoredStage[] = params.skeleton.map((stg) => {
      totalHours += stg.estimated_hours;
      const foundAssembled = assembledList.find(
        (s) => s.order_index === stg.order_index
      );

      // STRICT ANTI-HALLUCINATION FILTER: keep ONLY resources present in candidate pool
      let rawSelected = (foundAssembled?.selected_resources || []).filter((r) =>
        validUrls.has(r.url)
      );

      if (paidFilter && paidBudget) {
        const stageTopics = stg.search_topics.map((t) => t.toLowerCase());
        const candidatePaid = availablePaid.find(
          (p) =>
            paidFilter(p) &&
            p.price + accumulatedBudgetSpent <= params.budgetTotal &&
            p.topic_hints.some((h) =>
              stageTopics.some((st) => st.includes(h.toLowerCase()))
            )
        );

        if (candidatePaid) {
          rawSelected = [
            { url: candidatePaid.url, is_primary: true },
            ...rawSelected.filter((r) => r.url !== candidatePaid.url).slice(0, 1),
          ];
        }
      }

      const stageResources = rawSelected.map((r, idx) => {
        let res = urlMap.get(r.url) || {
          title: "Learning Resource",
          url: r.url,
          platform: "article" as const,
          resource_type: "article" as const,
          price: 0,
          currency: params.currency,
        };

        if (res.price > 0) {
          if (accumulatedBudgetSpent + res.price <= params.budgetTotal) {
            accumulatedBudgetSpent += res.price;
          } else {
            // Replace paid resource with free resource if budget limit would be exceeded
            const freeFallback =
              availableFree.find((f) =>
                f.topic_hints.some((h) =>
                  stg.search_topics.some((t) =>
                    t.toLowerCase().includes(h.toLowerCase())
                  )
                )
              ) || availableFree[0];

            res = freeFallback
              ? { ...freeFallback, currency: params.currency }
              : { ...res, price: 0 };
          }
        }

        return {
          is_primary: r.is_primary ?? idx === 0,
          order_index: idx,
          resources: res,
        };
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
              description:
                foundAssembled?.practice_check ||
                "Complete the practical verification exercise for this stage.",
            },
          },
        ],
      };
    });

    // Calculate EXACT total cost as sum of ALL selected resources in the path
    let exactTotalCost = 0;
    stages.forEach((stg) => {
      stg.stage_resources.forEach((sr) => {
        if (sr.resources?.price && sr.resources.price > 0) {
          exactTotalCost += sr.resources.price;
        }
      });
    });

    return { stages, totalCost: exactTotalCost, totalHours };
  };

  // Option 1: Comprehensive Mastery Path (Udemy & Full Bootcamps)
  const opt1Data = formatOptionStages(baseAssembled, (r) => r.platform === "udemy");
  // Option 2: Fast-Track Practical Path (YouTube & Hands-on Video Courses)
  const opt2Data = formatOptionStages(
    baseAssembled,
    (r) => r.resource_type === "course" || r.resource_type === "video"
  );
  // Option 3: Essential & Budget Saver Path (Minimal Cost)
  const opt3Data = formatOptionStages(
    baseAssembled,
    (r) => r.price <= params.budgetTotal * 0.5
  );

  return [
    {
      id: "opt-1",
      name: "Comprehensive Mastery Path",
      tagline: paidBudget
        ? "Blends full-length structured paid courses with official documentation for deep expertise."
        : "Complete foundational roadmap using official documentation and top tutorials.",
      total_cost: Math.min(opt1Data.totalCost, params.budgetTotal),
      total_hours: opt1Data.totalHours,
      stages: opt1Data.stages,
    },
    {
      id: "opt-2",
      name: "Fast-Track Practical Path",
      tagline:
        "Project-driven path emphasizing hands-on video tutorials, exercises, and practice builds.",
      total_cost: Math.min(opt2Data.totalCost, params.budgetTotal),
      total_hours: opt2Data.totalHours,
      stages: opt2Data.stages,
    },
    {
      id: "opt-3",
      name: "Essential & Budget Saver Path",
      tagline:
        "Optimized for maximum value with minimal cost under your budget limit.",
      total_cost: Math.min(opt3Data.totalCost, params.budgetTotal),
      total_hours: opt3Data.totalHours,
      stages: opt3Data.stages,
    },
  ];
}
