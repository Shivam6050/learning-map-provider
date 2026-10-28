import { createServiceClient } from "@/lib/supabase/service";
import { inspectUrl, type LinkStatus } from "@/lib/link-check/check-url";
import { getVideoStats } from "@/lib/youtube/client";

export type LinkCheckResult = { id: string; alive: boolean; status: LinkStatus };

/** Carries only confirmed writes, so maintenance can report partial progress accurately. */
export class LinkCheckPersistenceError extends Error {
  constructor(public readonly results: LinkCheckResult[], public readonly failed: number) {
    super("Could not persist resource link checks");
    this.name = "LinkCheckPersistenceError";
  }
}

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
  concurrency = 5,
  deadline = Infinity
): Promise<LinkCheckResult[]> {
  concurrency = Math.max(1, Math.min(10, Math.floor(concurrency) || 5));
  const service = createServiceClient();
  const results: LinkCheckResult[] = [];

  for (let i = 0; i < resources.length; i += concurrency) {
    if (Date.now() >= deadline) break;
    const batch = resources.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (resource) => {
        const status = await checkOneResource(resource);
        return { id: resource.id, alive: status === "ok", status };
      })
    );
    const writes = await Promise.allSettled(
      batchResults.map(async ({ id, status }) => {
        const {data, error} = await service
          .from("resources")
          .update({
            ...(status === "unknown" ? {} : {link_status: status}),
            link_checked_at: new Date().toISOString(),
          })
          .eq("id", id).select("id").abortSignal(AbortSignal.timeout(5000)).maybeSingle();
        if(error || data?.id !== id) throw new Error("Could not persist resource link check");
      })
    );
    // Wait for every write in this batch before returning a result or reporting failure.
    let failed = 0;
    writes.forEach((write, index) => {
      if (write.status === "fulfilled") results.push(batchResults[index]);
      else failed++;
    });
    if (failed) throw new LinkCheckPersistenceError(results, failed);
  }

  return results;
}
