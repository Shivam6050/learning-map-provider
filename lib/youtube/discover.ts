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
  rating: number | null; // aggregate from resource_ratings, see app/paths/[id]/actions.ts
  link_status: string;
};

async function fetchResourcesByIds(ids: string[]): Promise<DiscoveredResource[]> {
  if (ids.length === 0) return [];
  const service = createServiceClient();
  const { data } = await service
    .from("resources")
    .select(
      "id, title, url, platform, resource_type, price, currency, signals, trust_status, rating, link_status"
    )
    .in("id", ids)
    .neq("link_status", "broken");
  return (data ?? []) as DiscoveredResource[];
}

/**
 * Returns candidate YouTube resources for a topic. Checks the topic
 * cache first — search.list (100 quota units) only runs on a genuine
 * miss or expiry. Gracefully handles 429 rate limits or quota errors
 * by returning empty list so path generation falls back safely to seed pool
 * and web discovery without crashing.
 */
export async function discoverYoutubeForTopic(
  topic: string,
  fieldId: string,
  regionCode?: string
): Promise<DiscoveredResource[]> {
  const cached = await getCachedTopic(topic, "youtube", regionCode);
  if (cached) return fetchResourcesByIds(cached);

  try {
    const searchResults = await searchVideos(topic, { regionCode });
    if (searchResults.length === 0) {
      await saveCachedTopic(topic, "youtube", [], regionCode);
      return [];
    }

    const [videoStats, channelStats] = await Promise.all([
      getVideoStats(searchResults.map((r) => r.videoId)).catch(() => []),
      getChannelStats(searchResults.map((r) => r.channelId)).catch(() => []),
    ]);

    const videoStatsById = new Map(videoStats.map((v) => [v.videoId, v]));
    const channelStatsById = new Map(channelStats.map((c) => [c.channelId, c]));

    const service = createServiceClient();
    const resourceIds: string[] = [];
    const trustedSourceCache = new Map<string, { id: string; approved: boolean }>();

    for (const result of searchResults) {
      const stats = videoStatsById.get(result.videoId);
      const channel = channelStatsById.get(result.channelId);
      const url = `https://www.youtube.com/watch?v=${result.videoId}`;

      if (!stats) {
        const { data: existingDead } = await service
          .from("resources")
          .select("id")
          .eq("url", url)
          .maybeSingle();
        if (existingDead) {
          await service
            .from("resources")
            .update({ link_status: "broken", link_checked_at: new Date().toISOString() })
            .eq("id", existingDead.id);
        }
        continue;
      }

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
        views: stats.viewCount,
        likes: stats.likeCount,
        channel_subscribers: channel?.subscriberCount ?? 0,
        published_at: result.publishedAt,
      };
      const trustStatus = trustedSource.approved ? "allowlisted" : "pending";
      const linkCheckedAt = new Date().toISOString();

      if (existing) {
        await service
          .from("resources")
          .update({
            signals,
            trust_status: trustStatus,
            trusted_source_id: trustedSource.id || null,
            link_status: "ok",
            link_checked_at: linkCheckedAt,
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
          link_status: "ok",
          link_checked_at: linkCheckedAt,
        })
        .select("id")
        .single();

      if (error || !inserted) continue;
      resourceIds.push(inserted.id);
    }

    await saveCachedTopic(topic, "youtube", resourceIds, regionCode);
    return fetchResourcesByIds(resourceIds);
  } catch (err) {
    console.warn(`[discoverYoutubeForTopic] YouTube search failed or quota exceeded: ${err instanceof Error ? err.message : err}`);
    return [];
  }
}
