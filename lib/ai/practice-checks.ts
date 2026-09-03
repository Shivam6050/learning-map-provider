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
  const map = new Map<number, string>();

  try {
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

    if (result && Array.isArray(result.checks)) {
      for (const c of result.checks) {
        map.set(c.order_index, c.practice_check);
      }
    }
  } catch (err) {
    console.warn("[generatePracticeChecks AI fallback triggered]", err instanceof Error ? err.message : err);
  }

  for (const s of stages) {
    if (!map.has(s.order_index)) {
      map.set(s.order_index, `Build a small hands-on project or code exercise applying: ${s.title}.`);
    }
  }

  return map;
}
