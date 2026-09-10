import { isPaidCourseUrl } from "./providers";
import { callWithGoogleSearch } from "@/lib/ai/client";
import { createServiceClient } from "@/lib/supabase/service";
import { getCachedTopic, saveCachedTopic } from "@/lib/db/topic-cache";
import { findOrProposeTrustedSource } from "@/lib/db/trusted-sources";
import { inspectUrl } from "@/lib/link-check/check-url";
import { isSafeHttpUrl } from "@/lib/link-check/url-safety";
import type { DiscoveredResource } from "@/lib/youtube/discover";
import { fetchRealtimePrice } from "@/lib/web-discovery/price-fetcher";

const PROMPT_TEMPLATE = (topic: string, currency: string, budget: number) =>
  `Find relevant individual courses and free tutorials for "${topic}". For a total learning budget of ${budget} ${currency}, include course detail pages from several of Udemy, Coursera, pwskills.com (Physics Wallah), GeeksforGeeks and campus.w3schools.com when relevant. Include free official documentation and w3schools.com tutorials. Prioritize currently purchasable courses with explicit one-time total prices, not monthly fees or EMI. Do not include search listings, blog roundups, subscription landing pages or YouTube. Never invent a URL or price.`;

// Best-effort classification from the URL alone. Deliberately simple:
// this is a courtesy label for the UI, not something judgment logic
// depends on for correctness — trust_status and price come from real
// data (trusted_sources approval, manual review), not this guess.
function classifyByDomain(url: string): {
  platform: "mslearn" | "docs" | "article" | "course" | "udemy" | "coursera";
  resource_type: "docs" | "article" | "course";

} {
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();

  if (isPaidCourseUrl(url) && !["udemy.com", "coursera.org"].includes(host)) return { platform: "course", resource_type: "course" };
  if (host === "learn.microsoft.com") return { platform: "mslearn", resource_type: "docs" };
  if (host === "udemy.com") return { platform: "udemy", resource_type: "course" };
  if (host === "coursera.org") return { platform: "coursera", resource_type: "course" };
  if (host.includes("pluralsight.com") || host.includes("edx.org")) return { platform: "course", resource_type: "course" };
  if (host.includes("developer.mozilla.org") || host.endsWith(".dev") || host.includes("docs."))
    return { platform: "docs", resource_type: "docs" };
  return { platform: "article", resource_type: "article" };
}

async function fetchResourcesByIds(ids: string[]): Promise<DiscoveredResource[]> {
  if (ids.length === 0) return [];
  const service = createServiceClient();
  const { data } = await service
    .from("resources")
    .select("*")
    .in("id", ids);
  return (data ?? []).filter((resource: DiscoveredResource) => resource.link_status !== "broken").map((resource: DiscoveredResource) => ({ ...resource, link_status: resource.link_status ?? "unchecked" })) as DiscoveredResource[];
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
  fieldId: string,
  currency = "USD",
  budget = 0
): Promise<DiscoveredResource[]> {
  const cacheTopic = `${topic} [offers-v2 ${currency} ${budget > 0 ? "paid" : "free"}]`;
  const cached = await getCachedTopic(cacheTopic, "web");
  if (cached) return fetchResourcesByIds(cached);

  let chunks: { url: string; title: string }[] = [];
  try {
    const result = await callWithGoogleSearch({ prompt: PROMPT_TEMPLATE(topic, currency, budget) });
    chunks = result.chunks;
  } catch (err) {
    console.error("[discoverWebForTopic]", err instanceof Error ? err.message : err);
    return [];
  }

  const service = createServiceClient();
  const { error: healthSchemaError } = await service.from("resources").select("link_status").limit(0);
  const supportsLinkHealth = !healthSchemaError;
  const resourceIds: string[] = [];
  const seenUrls = new Set<string>();
  const trustedSourceCache = new Map<string, { id: string; approved: boolean }>();

  for (const chunk of chunks.slice(0, 12)) {
    if (seenUrls.has(chunk.url)) continue;
    seenUrls.add(chunk.url);

    // Reject anything that isn't a genuine http(s) URL before it's
    // trusted with anything else — a javascript:/data: URI must never
    // reach the database or an <a href>, regardless of how unlikely
    // that seems from a search-grounded source.
    if (!isSafeHttpUrl(chunk.url)) continue;

    // Grounded search can return a redirect URL. Classify the verified destination.
    const resolved = await inspectUrl(chunk.url);
    if (resolved.status !== "ok") continue;
    chunk.url = resolved.url;
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
    const inspection = resolved;
    const alive = inspection.status === "ok";
    const linkCheckedAt = new Date().toISOString();
    if (!alive) {
      const { data: existingDead } = await service
        .from("resources")
        .select("id")
        .eq("url", chunk.url)
        .maybeSingle();
      if (existingDead && supportsLinkHealth) {
        await service
          .from("resources")
          .update({ link_status: inspection.status === "broken" ? "broken" : "unchecked", link_checked_at: linkCheckedAt })
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
      const livePrice = await fetchRealtimePrice(chunk.url, currency);
      if (livePrice.price === null) continue;
      await service
        .from("resources")
        .update({
          price: livePrice.price,
          currency: livePrice.currency,
          trust_status: trustStatus,
          trusted_source_id: trustedSource.id || null,
          ...(supportsLinkHealth ? { link_status: "ok", link_checked_at: linkCheckedAt } : {}),
        })
        .eq("id", existing.id);
      resourceIds.push(existing.id);
      continue;
    }

    const livePrice = await fetchRealtimePrice(chunk.url, currency);

    if (livePrice.price === null) continue;
    const { data: inserted, error } = await service
      .from("resources")
      .insert({
        title: chunk.title,
        url: chunk.url,
        platform: classification.platform,
        resource_type: classification.resource_type,
        price: livePrice.price,
        currency: livePrice.currency,
        trust_status: trustStatus,
        trusted_source_id: trustedSource.id || null,
        signals: {},
        ...(supportsLinkHealth ? { link_status: "ok", link_checked_at: linkCheckedAt } : {}),
      })
      .select("id")
      .single();

    if (error || !inserted) continue;
    resourceIds.push(inserted.id);
  }

  if (resourceIds.length) await saveCachedTopic(cacheTopic, "web", resourceIds);
  return fetchResourcesByIds(resourceIds);
}
