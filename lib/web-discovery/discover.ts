import { callForJson } from "@/lib/ai/client";
import { createServiceClient } from "@/lib/supabase/service";
import { getCachedTopic, saveCachedTopic } from "@/lib/db/topic-cache";
import type { DiscoveredResource } from "@/lib/youtube/discover";

type WebCandidate = {
  title: string;
  url: string;
  platform: "mslearn" | "docs" | "article" | "course";
  resource_type: "docs" | "article" | "course";
  price_estimate: number | null;
  currency: string;
};

const SYSTEM_PROMPT = `You are researching real, currently-existing learning resources on the web for a specific topic. Search for official documentation, well-known written tutorials, and reputable paid courses (e.g. Coursera, official platform training) — do NOT search for or return YouTube videos, those come from a separate source.

Only include resources you actually found via search. Never invent a URL. Prefer official sources (official docs, official platform courses) over third-party blogs when both exist.

After searching, respond with ONLY valid JSON, no prose, no markdown fences:
{
  "candidates": [
    {
      "title": "string",
      "url": "string, exact URL from search results",
      "platform": "mslearn | docs | article | course",
      "resource_type": "docs | article | course",
      "price_estimate": number or null (null if free or unknown),
      "currency": "string, e.g. USD"
    }
  ]
}
Return at most 4 candidates.`;

async function fetchResourcesByIds(ids: string[]): Promise<DiscoveredResource[]> {
  if (ids.length === 0) return [];
  const service = createServiceClient();
  const { data } = await service
    .from("resources")
    .select("id, title, url, platform, resource_type, price, currency, signals")
    .in("id", ids);
  return (data ?? []) as DiscoveredResource[];
}

export async function discoverWebForTopic(
  topic: string
): Promise<DiscoveredResource[]> {
  const cached = await getCachedTopic(topic, "web");
  if (cached) return fetchResourcesByIds(cached);

  let candidates: WebCandidate[] = [];
  try {
    const result = await callForJson<{ candidates: WebCandidate[] }>({
      system: SYSTEM_PROMPT,
      user: `Topic: ${topic}`,
      maxTokens: 2000,
    });
    candidates = result.candidates ?? [];
  } catch {
    // Search or parsing failed — cache an empty result briefly rather
    // than retrying on every request and re-spending the search call.
    await saveCachedTopic(topic, "web", []);
    return [];
  }

  const service = createServiceClient();
  const resourceIds: string[] = [];

  for (const candidate of candidates) {
    const { data: existing } = await service
      .from("resources")
      .select("id")
      .eq("url", candidate.url)
      .maybeSingle();

    if (existing) {
      resourceIds.push(existing.id);
      continue;
    }

    const { data: inserted, error } = await service
      .from("resources")
      .insert({
        title: candidate.title,
        url: candidate.url,
        platform: candidate.platform,
        resource_type: candidate.resource_type,
        price: candidate.price_estimate ?? 0,
        currency: candidate.currency ?? "USD",
        trust_status: "pending",
        signals: {},
      })
      .select("id")
      .single();

    if (error || !inserted) continue;
    resourceIds.push(inserted.id);
  }

  await saveCachedTopic(topic, "web", resourceIds);
  return fetchResourcesByIds(resourceIds);
}
