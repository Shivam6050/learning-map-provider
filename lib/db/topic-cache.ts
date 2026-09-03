import { createServiceClient } from "@/lib/supabase/service";

export function normalizeTopicKey(topic: string, region?: string): string {
  const base = topic.trim().toLowerCase().replace(/\s+/g, " ");
  // Region folded into the key itself (not a new column) so a US-region
  // cache entry never gets served to an IN-region request for the same
  // topic — different regions genuinely mean different real results
  // for YouTube. Omitted for platforms that aren't region-parameterized.
  return region ? `${base}::${region}` : base;
}

export async function getCachedTopic(
  topic: string,
  platform: "youtube" | "web",
  region?: string
): Promise<string[] | null> {
  const service = createServiceClient();
  const topicKey = normalizeTopicKey(topic, region);

  const { data } = await service
    .from("topic_search_cache")
    .select("resource_ids, expires_at")
    .eq("topic_key", topicKey)
    .eq("platform", platform)
    .maybeSingle();

  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) return null; // expired

  return data.resource_ids as string[];
}

export async function saveCachedTopic(
  topic: string,
  platform: "youtube" | "web",
  resourceIds: string[],
  region?: string
): Promise<void> {
  const service = createServiceClient();
  const topicKey = normalizeTopicKey(topic, region);

  await service.from("topic_search_cache").upsert(
    {
      topic_key: topicKey,
      platform,
      resource_ids: resourceIds,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: "topic_key,platform" }
  );
}
