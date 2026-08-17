import { callForJson } from "@/lib/ai/client";
import type { SkeletonStage } from "@/lib/ai/skeleton";
import type { SeedResource } from "@/lib/ai/seed-resources";

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

  // If budget <= 1 USD/EUR or <= 100 INR, restrict candidates strictly to free ($0) resources
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
  let assembledStages = result.stages;

  // Post-processing guarantee: if paid budget mode is true but 0 paid resources were selected,
  // actively inject paid courses into matching stages up to budgetTotal!
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
