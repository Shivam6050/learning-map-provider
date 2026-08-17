import { callForJson } from "@/lib/ai/client";
import type { SkeletonStage } from "@/lib/ai/skeleton";
import type { SeedResource } from "@/lib/ai/seed-resources";

export type AssembledStage = {
  order_index: number;
  selected_resources: { url: string; is_primary: boolean }[];
  practice_check: string;
};

/**
 * Phase 1 note: this collapses the pipeline's Stage 3 (judgment) and
 * Stage 4 (assembly) into one call, because Phase 1 has no real Stage 2
 * discovery output to judge — it's matching against the static seed
 * pool instead. Once Phase 2 wires up real discovery + judgment, this
 * function's job narrows back down to assembly only, taking Stage 3's
 * already-filtered output as input instead of the raw pool.
 */
const SYSTEM_PROMPT = `You are assembling a personalized learning path. You will be given:
1. An ordered list of learning stages (title, description, topic hints)
2. A pool of real candidate resources, each with a URL and topic hints
3. The learner's total budget

You must choose 1-3 resources per stage from the candidate pool ONLY —
never invent a resource, never modify a URL, never reference anything not
present in the candidate pool. Match resources to stages using the topic
hints and descriptions provided, using your judgment for what's most
relevant to each stage's topic.

Budget rules: the budget is a soft target for the WHOLE path, not a
per-stage cap. Prefer free resources for foundational/early stages.
Reserve paid resources for the 1-2 stages where they add the most
leverage, rather than spreading budget thinly across every stage. It is
fine to go under budget. Do not exceed the total budget across all
selected paid resources.

For each stage, also write one "practice_check": a short (1-2 sentence)
description of a mini-project or a small set of quiz questions a learner
could use to self-verify they understood the stage. This is informal and
ungraded.

If fewer than 2 usable candidates exist for a stage, return what's
available rather than inventing more — do not pad the list.

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

export async function assemblePath(params: {
  stages: SkeletonStage[];
  resourcePool: SeedResource[];
  budgetTotal: number;
  currency: string;
}): Promise<AssembledStage[]> {
  const user = `Budget: ${params.budgetTotal} ${params.currency}

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
${JSON.stringify(params.resourcePool, null, 2)}`;

  const result = await callForJson<{ stages: AssembledStage[] }>({
    system: SYSTEM_PROMPT,
    user,
    maxTokens: 3000,
  });

  return result.stages;
}
