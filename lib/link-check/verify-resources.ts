import { createServiceClient } from "@/lib/supabase/service";
import { inspectUrl, type LinkStatus } from "@/lib/link-check/check-url";
import { getVideoStats } from "@/lib/youtube/client";

function extractYoutubeVideoId(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

/**
 * Verifies one resource. YouTube gets a special path: videos.list (the
 * same endpoint discovery already uses for stats) tells us definitively
 * whether a video still exists — a deleted/private video simply won't
 * be in the response, which is more reliable than an HTTP status check
 * against a YouTube watch page, since YouTube often still returns 200
 * for a page shell even when the video itself is gone.
 */
async function checkOneResource(resource: {
  id: string;
  url: string;
  platform: string;
}): Promise<LinkStatus> {
  if (resource.platform === "youtube") {
    const videoId = extractYoutubeVideoId(resource.url);
    if (!videoId) return (await inspectUrl(resource.url)).status; // malformed, fall back
    try {
      const stats = await getVideoStats([videoId]);
      return stats.length > 0 ? "ok" : "broken";
    } catch {
      // YouTube API itself failing shouldn't mark every video broken —
      // fall back to a plain HTTP check rather than assuming the worst.
      return "unknown";
    }
  }

  return (await inspectUrl(resource.url)).status;
}

/**
 * Verifies a batch of resources concurrently (capped, so this doesn't
 * fire 50 simultaneous outbound requests) and writes link_status back.
 * Called both at discovery time (new/refreshed resources, before a user
 * ever sees them) and by the maintenance cron (already-served resources
 * coming due for a recheck).
 */
export async function verifyResourceLinks(
  resources: { id: string; url: string; platform: string }[],
  concurrency = 5
): Promise<{ id: string; alive: boolean }[]> {
  concurrency = Math.max(1, Math.min(10, Math.floor(concurrency) || 5));
  const service = createServiceClient();
  const results: { id: string; alive: boolean }[] = [];

  for (let i = 0; i < resources.length; i += concurrency) {
    const batch = resources.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (resource) => {
        const status = await checkOneResource(resource);
        return { id: resource.id, alive: status === "ok", status };
      })
    );
    results.push(...batchResults);

    await Promise.all(
      batchResults.map(({ id, status }) =>
        service
          .from("resources")
          .update({
            link_status: status === "unknown" ? "unchecked" : status,
            link_checked_at: new Date().toISOString(),
          })
          .eq("id", id)
      )
    );
  }

  return results;
}
