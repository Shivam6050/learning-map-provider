import { callForJson } from "@/lib/ai/client";
import type { SkeletonStage } from "@/lib/ai/skeleton";
import type { DiscoveredResource } from "@/lib/youtube/discover";

export type JudgedResource = {
  url: string;
  is_primary: boolean;
  reason: string;
};

export type JudgedStage = {
  order_index: number;
  selected_resources: JudgedResource[];
};

const SYSTEM_PROMPT = `You are selecting learning resources for a stage in a learning path. You will be given a JSON array of real candidate resources with their platform signals (views, likes, channel subscriber count for YouTube; on_trusted_allowlist for others). You must choose only from this array — never invent a resource, never modify a URL, never reference anything not present in the input.

Ranking priorities, in order:
1. Resources where on_trusted_allowlist is true
2. Among the rest, higher signal quality (views/likes ratio, channel_subscribers) and recency (published_at)
3. Diversity of format — prefer including at least one video and one written/docs/course resource per stage where candidates allow it

Choose 2-4 resources per stage. If fewer than 2 usable candidates exist, return what's available rather than inventing more — do not pad the list.

Output ONLY valid JSON, no prose, no markdown fences:
{
  "stage_order_index": integer,
  "selected_resources": [
    { "url": "string, copied exactly from the input candidate", "is_primary": boolean, "reason": "string, 1 sentence" }
  ]
}`;

function buildCandidatePayload(candidates: DiscoveredResource[]) {
  return candidates.map((c) => ({
    url: c.url,
    title: c.title,
    platform: c.platform,
    resource_type: c.resource_type,
    price: c.price,
    currency: c.currency,
    signals: c.signals,
    on_trusted_allowlist: c.trust_status === "allowlisted",
  }));
}

/**
 * Judges one stage's candidates. Called once per stage rather than
 * batched, so a bad/empty candidate set for one stage can't affect the
 * model's judgment on another.
 */
export async function judgeStage(
  stage: SkeletonStage,
  candidates: DiscoveredResource[]
): Promise<JudgedStage> {
  if (candidates.length === 0) {
    return { order_index: stage.order_index, selected_resources: [] };
  }

  const user = `Stage: ${stage.title}
Description: ${stage.description}

Candidate resources:
${JSON.stringify(buildCandidatePayload(candidates), null, 2)}`;

  const result = await callForJson<{
    stage_order_index: number;
    selected_resources: JudgedResource[];
  }>({ system: SYSTEM_PROMPT, user, maxTokens: 1500 });

  const validUrls = new Set(candidates.map((c) => c.url));
  const sanitized = (result.selected_resources || []).filter((r) => validUrls.has(r.url));

  return { order_index: stage.order_index, selected_resources: sanitized };
}
