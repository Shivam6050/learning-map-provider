const YT_BASE = "https://www.googleapis.com/youtube/v3";

function key() {
  const k = process.env.YOUTUBE_API_KEY;
  if (!k) throw new Error("YOUTUBE_API_KEY is not set");
  return k;
}

export type YoutubeSearchItem = {
  videoId: string;
  channelId: string;
  title: string;
  publishedAt: string;
};

// Cost: 100 quota units. Only call this on a cache miss — see
// lib/youtube/discover.ts. Returns snippet data only, no stats.
export async function searchVideos(
  query: string,
  maxResults = 8
): Promise<YoutubeSearchItem[]> {
  const url = new URL(`${YT_BASE}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("relevanceLanguage", "en");
  url.searchParams.set("key", key());

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube search.list failed: ${res.status}`);
  const data = await res.json();

  return (data.items ?? []).map((item: any) => ({
    videoId: item.id.videoId,
    channelId: item.snippet.channelId,
    title: item.snippet.title,
    publishedAt: item.snippet.publishedAt,
  }));
}

export type YoutubeVideoStats = {
  videoId: string;
  viewCount: number;
  likeCount: number;
};

// Cost: 1 unit total, regardless of how many IDs (up to 50) are passed.
export async function getVideoStats(
  videoIds: string[]
): Promise<YoutubeVideoStats[]> {
  if (videoIds.length === 0) return [];
  const url = new URL(`${YT_BASE}/videos`);
  url.searchParams.set("part", "statistics");
  url.searchParams.set("id", videoIds.slice(0, 50).join(","));
  url.searchParams.set("key", key());

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube videos.list failed: ${res.status}`);
  const data = await res.json();

  return (data.items ?? []).map((item: any) => ({
    videoId: item.id,
    viewCount: Number(item.statistics?.viewCount ?? 0),
    likeCount: Number(item.statistics?.likeCount ?? 0),
  }));
}

export type YoutubeChannelStats = {
  channelId: string;
  subscriberCount: number;
};

// Cost: 1 unit total, regardless of how many IDs (up to 50) are passed.
export async function getChannelStats(
  channelIds: string[]
): Promise<YoutubeChannelStats[]> {
  if (channelIds.length === 0) return [];
  const url = new URL(`${YT_BASE}/channels`);
  url.searchParams.set("part", "statistics");
  url.searchParams.set("id", [...new Set(channelIds)].slice(0, 50).join(","));
  url.searchParams.set("key", key());

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube channels.list failed: ${res.status}`);
  const data = await res.json();

  return (data.items ?? []).map((item: any) => ({
    channelId: item.id,
    subscriberCount: Number(item.statistics?.subscriberCount ?? 0),
  }));
}
