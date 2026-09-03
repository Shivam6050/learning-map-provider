import { callWithGoogleSearch } from "@/lib/ai/client";
import { createServiceClient } from "@/lib/supabase/service";
import { getCachedTopic, saveCachedTopic } from "@/lib/db/topic-cache";
import { findOrProposeTrustedSource } from "@/lib/db/trusted-sources";
import { checkUrlAlive } from "@/lib/link-check/check-url";
import { isSafeHttpUrl } from "@/lib/link-check/url-safety";
import type { DiscoveredResource } from "@/lib/youtube/discover";

const PROMPT_TEMPLATE = (topic: string) =>
  `Find official documentation, well-known written tutorials, and reputable paid courses (e.g. Coursera, official platform training) for: "${topic}". Do not include YouTube — that's covered separately.`;

// Best-effort classification from the URL alone. Deliberately simple:
// this is a courtesy label for the UI, not something judgment logic
// depends on for correctness — trust_status and price come from real
// data (trusted_sources approval, manual review), not this guess.
function classifyByDomain(url: string): {
  platform: "mslearn" | "docs" | "article" | "course";
  resource_type: "docs" | "article" | "course";
  price: number;
} {
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();

  if (host.includes("learn.microsoft.com")) return { platform: "mslearn", resource_type: "docs", price: 0 };
  if (host.includes("coursera.org")) return { platform: "course", resource_type: "course", price: 0 };
  if (host.includes("developer.mozilla.org") || host.endsWith(".dev") || host.includes("docs."))
    return { platform: "docs", resource_type: "docs", price: 0 };
  return { platform: "article", resource_type: "article", price: 0 };
}

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
 * Discovers candidate web resources for a topic using Gemini's REAL
 * Google Search grounding. Trusts the API's groundingChunks (actual
 * search results the model consulted) for URLs, not the model's
 * free-text claims — Gemini can't combine search grounding with forced
 * JSON output for these models, so self-reported JSON URLs would carry
 * no more guarantee of being real than an ungrounded call. See
 * lib/ai/client.ts's callWithGoogleSearch for the detail.
 */
export async function discoverWebForTopic(
  topic: string,
  fieldId: string
): Promise<DiscoveredResource[]> {
  const cached = await getCachedTopic(topic, "web");
  if (cached) return fetchResourcesByIds(cached);

  let chunks: { url: string; title: string }[] = [];
  try {
    const result = await callWithGoogleSearch({ prompt: PROMPT_TEMPLATE(topic) });
    chunks = result.chunks;
  } catch (err) {
    console.error("[discoverWebForTopic]", err instanceof Error ? err.message : err);
    await saveCachedTopic(topic, "web", []);
    return [];
  }

  const service = createServiceClient();
  const resourceIds: string[] = [];
  const seenUrls = new Set<string>();
  const trustedSourceCache = new Map<string, { id: string; approved: boolean }>();

  for (const chunk of chunks.slice(0, 4)) {
    if (seenUrls.has(chunk.url)) continue;
    seenUrls.add(chunk.url);

    // Reject anything that isn't a genuine http(s) URL before it's
    // trusted with anything else — a javascript:/data: URI must never
    // reach the database or an <a href>, regardless of how unlikely
    // that seems from a search-grounded source.
    if (!isSafeHttpUrl(chunk.url)) continue;

    const classification = classifyByDomain(chunk.url);
    let host = "";
    try {
      host = new URL(chunk.url).hostname.replace(/^www\./, "");
    } catch {
      continue; // not a real URL — skip rather than insert garbage
    }

    // Real search grounding means the URL is genuinely a search result,
    // but that doesn't mean it still resolves right now — check before
    // ever offering it as a candidate. This is what actually prevents
    // the "clicked it, page is gone" problem, not the search step.
    const alive = await checkUrlAlive(chunk.url);
    const linkCheckedAt = new Date().toISOString();
    if (!alive) {
      const { data: existingDead } = await service
        .from("resources")
        .select("id")
        .eq("url", chunk.url)
        .maybeSingle();
      if (existingDead) {
        await service
          .from("resources")
          .update({ link_status: "broken", link_checked_at: linkCheckedAt })
          .eq("id", existingDead.id);
      }
      continue;
    }

    let trustedSource = trustedSourceCache.get(host);
    if (!trustedSource) {
      trustedSource = await findOrProposeTrustedSource({
        fieldId,
        sourceName: host,
        sourceUrl: `https://${host}`,
        platform: "web",
      });
      trustedSourceCache.set(host, trustedSource);
    }
    const trustStatus = trustedSource.approved ? "allowlisted" : "pending";

    const { data: existing } = await service
      .from("resources")
      .select("id")
      .eq("url", chunk.url)
      .maybeSingle();

    if (existing) {
      await service
        .from("resources")
        .update({
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
        title: chunk.title,
        url: chunk.url,
        platform: classification.platform,
        resource_type: classification.resource_type,
        price: classification.price,
        currency: "USD",
        trust_status: trustStatus,
        trusted_source_id: trustedSource.id || null,
        signals: {},
        link_status: "ok",
        link_checked_at: linkCheckedAt,
      })
      .select("id")
      .single();

    if (error || !inserted) continue;
    resourceIds.push(inserted.id);
  }

  await saveCachedTopic(topic, "web", resourceIds);
  return fetchResourcesByIds(resourceIds);
}
