import { createServiceClient } from "@/lib/supabase/service";
import { getCachedTopic, saveCachedTopic } from "@/lib/db/topic-cache";
import { searchVideos, getVideoStats, getChannelStats } from "@/lib/youtube/client";
import { findOrProposeTrustedSource } from "@/lib/db/trusted-sources";

export type DiscoveredResource = {
  id: string; // resources.id
  title: string;
  url: string;
  platform: string;
  resource_type: string;
  price: number;
  currency: string;
  signals: Record<string, unknown>;
  trust_status: string;
};

async function fetchResourcesByIds(ids: string[]): Promise<DiscoveredResource[]> {
  if (ids.length === 0) return [];
  const service = createServiceClient();
  const { data } = await service
    .from("resources")
    .select("id, title, url, platform, resource_type, price, currency, signals, trust_status")
    .in("id", ids);
  return (data ?? []) as DiscoveredResource[];
}

/**
 * Returns candidate YouTube resources for a topic. Checks the topic
 * cache first — search.list (100 quota units) only runs on a genuine
 * miss or expiry. Every other call in this path (videos.list,
 * channels.list) costs 1 unit regardless of batch size, so the real
 * quota spend is entirely gated by cache hits.
 */
export async function discoverYoutubeForTopic(
  topic: string,
  fieldId: string
): Promise<DiscoveredResource[]> {
  const cached = await getCachedTopic(topic, "youtube");
  if (cached) return fetchResourcesByIds(cached);

  const searchResults = await searchVideos(topic);
  if (searchResults.length === 0) {
    await saveCachedTopic(topic, "youtube", []);
    return [];
  }

  const [videoStats, channelStats] = await Promise.all([
    getVideoStats(searchResults.map((r) => r.videoId)),
    getChannelStats(searchResults.map((r) => r.channelId)),
  ]);

  const videoStatsById = new Map(videoStats.map((v) => [v.videoId, v]));
  const channelStatsById = new Map(channelStats.map((c) => [c.channelId, c]));

  const service = createServiceClient();
  const resourceIds: string[] = [];
  // Cache trusted-source lookups within this call — many videos in one
  // search share the same channel, no need to propose it repeatedly.
  const trustedSourceCache = new Map<string, { id: string; approved: boolean }>();

  for (const result of searchResults) {
    const stats = videoStatsById.get(result.videoId);
    const channel = channelStatsById.get(result.channelId);
    const url = `https://www.youtube.com/watch?v=${result.videoId}`;

    let trustedSource = trustedSourceCache.get(result.channelId);
    if (!trustedSource) {
      trustedSource = await findOrProposeTrustedSource({
        fieldId,
        sourceName: result.channelTitle,
        sourceUrl: `https://www.youtube.com/channel/${result.channelId}`,
        platform: "youtube",
      });
      trustedSourceCache.set(result.channelId, trustedSource);
    }

    const { data: existing } = await service
      .from("resources")
      .select("id")
      .eq("url", url)
      .maybeSingle();

    const signals = {
      views: stats?.viewCount ?? 0,
      likes: stats?.likeCount ?? 0,
      channel_subscribers: channel?.subscriberCount ?? 0,
      published_at: result.publishedAt,
    };
    // Refreshed on every non-cached fetch, so a channel approved after
    // a resource was first discovered gets picked up within the topic
    // cache's 7-day TTL, not just at first insert.
    const trustStatus = trustedSource.approved ? "allowlisted" : "pending";

    if (existing) {
      await service
        .from("resources")
        .update({
          signals,
          trust_status: trustStatus,
          trusted_source_id: trustedSource.id || null,
        })
        .eq("id", existing.id);
      resourceIds.push(existing.id);
      continue;
    }

    const { data: inserted, error } = await service
      .from("resources")
      .insert({
        title: result.title,
        url,
        platform: "youtube",
        resource_type: "video",
        price: 0,
        currency: "USD",
        trust_status: trustStatus,
        trusted_source_id: trustedSource.id || null,
        signals,
      })
      .select("id")
      .single();

    if (error || !inserted) continue; // skip, don't fail the whole batch
    resourceIds.push(inserted.id);
  }

  await saveCachedTopic(topic, "youtube", resourceIds);
  return fetchResourcesByIds(resourceIds);
}
