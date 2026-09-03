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

const SYSTEM_PROMPT = `You are selecting learning resources for a stage in a learning path. You will be given a JSON array of real candidate resources with their platform signals (views, likes, channel subscriber count for YouTube; on_trusted_allowlist for others) and, where available, a community_rating (1-5, averaged from real user ratings on this platform — this is the strongest signal available, since it reflects actual learners who used the resource, not just discovery-time metadata). You must choose only from this array — never invent a resource, never modify a URL, never reference anything not present in the input.

Ranking priorities, in order:
1. Resources with a community_rating of 4 or higher — these have been validated by real learners and should be preferred over unrated candidates even if their raw signals (views, etc.) are lower
2. Resources where on_trusted_allowlist is true
3. Among the rest, higher signal quality (views/likes ratio, channel_subscribers) and recency (published_at)
4. Diversity of format — prefer including at least one video and one written/docs/course resource per stage where candidates allow it

A resource with no community_rating yet (null) is not penalized — most won't have ratings early on — but a LOW community_rating (2 or below) from real users should outweigh good raw signals; don't select a poorly-rated resource just because it has high views.

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
    community_rating: c.rating ?? null,
  }));
}

export async function judgeStage(
  stage: SkeletonStage,
  candidates: DiscoveredResource[]
): Promise<JudgedStage> {
  if (candidates.length === 0) {
    return { order_index: stage.order_index, selected_resources: [] };
  }

  try {
    const user = `Stage: ${stage.title}
Description: ${stage.description}

Candidate resources:
${JSON.stringify(buildCandidatePayload(candidates), null, 2)}`;

    const result = await callForJson<{
      stage_order_index: number;
      selected_resources: JudgedResource[];
    }>({ system: SYSTEM_PROMPT, user, maxTokens: 1500 });

    const validUrls = new Set(candidates.map((c) => c.url));
    const sanitized = (result?.selected_resources || []).filter((r) => validUrls.has(r.url));
    if (sanitized.length > 0) {
      return { order_index: stage.order_index, selected_resources: sanitized };
    }
  } catch (err) {
    console.warn("[judgeStage AI fallback triggered]", err instanceof Error ? err.message : err);
  }

  // Fallback if AI judgment call hits high demand / quota limit (503/429)
  const fallbackPicks = candidates.slice(0, 3).map((c, i) => ({
    url: c.url,
    is_primary: i === 0,
    reason: `Selected resource for ${stage.title}`,
  }));

  return { order_index: stage.order_index, selected_resources: fallbackPicks };
}
