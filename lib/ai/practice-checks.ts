import { callForJson } from "@/lib/ai/client";
import type { SkeletonStage } from "@/lib/ai/skeleton";

const SYSTEM_PROMPT = `For each learning stage given, write one short (1-2 sentence) "practice_check": a mini-project or small quiz description a learner could use to self-verify they understood the stage. Informal and ungraded.

Output ONLY valid JSON, no prose, no markdown fences:
{
  "checks": [
    { "order_index": 0, "practice_check": "string" }
  ]
}`;

export async function generatePracticeChecks(
  stages: SkeletonStage[]
): Promise<Map<number, string>> {
  const user = JSON.stringify(
    stages.map((s) => ({ order_index: s.order_index, title: s.title, description: s.description })),
    null,
    2
  );

  const result = await callForJson<{ checks: { order_index: number; practice_check: string }[] }>({
    system: SYSTEM_PROMPT,
    user,
    maxTokens: 1500,
  });

  return new Map(result.checks.map((c) => [c.order_index, c.practice_check]));
}
