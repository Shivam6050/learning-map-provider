import { paidSubscriptionQuote } from "@/lib/web-discovery/paid-catalog";
import { fetchImpactCourse } from "@/lib/web-discovery/impact-catalog";
import type { DiscoveredResource } from "@/lib/youtube/discover";
import { checkUrlAlive } from "./check-url";
import { getVideoStats } from "@/lib/youtube/client";
import { fetchRealtimePrice } from "@/lib/web-discovery/price-fetcher";
import { BASE_SEED_RESOURCES } from "@/lib/ai/seed-resources";

/** Revalidate cached and seeded candidates too; compare every price in the learner's currency. */
export async function prepareCandidates(resources: DiscoveredResource[], currency: string): Promise<DiscoveredResource[]> {
  const result: DiscoveredResource[] = [];
  const unique = [...new Map(resources.map(r => [r.url, r])).values()];
  for (let i = 0; i < unique.length; i += 5) {
    const batch = await Promise.all(unique.slice(i, i + 5).map(async resource => {
      try {
        if (resource.signals?.price_source === "scrimba_monthly") {
          const quote = await paidSubscriptionQuote(resource.url, currency);
          return quote ? { ...resource, ...quote, link_status: "ok" } : null;
        }
        if (resource.signals?.price_source === "impact_catalog") {
          if (resource.signals.impact_catalog_id !== process.env.UDEMY_IMPACT_CATALOG_ID?.trim()) return null;
          const itemId = resource.signals.impact_item_id;
          if (typeof itemId !== "string") return null;
          const quote = await fetchImpactCourse(itemId, currency);
          if (!quote || quote.url !== resource.url) return null;
          // A fresh in-stock catalog entry verifies availability without artificial tracking clicks.
          return { ...resource, title: quote.title, price: quote.price, currency, link_status: "ok" };
        }
        if (resource.platform === "youtube") {
          const url = new URL(resource.url);
          const host = url.hostname.replace(/^www\./, "");
          const id = host === "youtu.be" ? url.pathname.slice(1) : host === "youtube.com" ? url.searchParams.get("v") : null;
          if (!id || !/^[\w-]{11}$/.test(id) || !(await getVideoStats([id])).length) return null;
          return { ...resource, price: 0, currency, link_status: "ok" };
        }
        if (!(await checkUrlAlive(resource.url))) return null;
        const curatedFree = BASE_SEED_RESOURCES.some(seed => seed.url === resource.url && seed.price === 0);
        const quote = curatedFree ? { price: 0, currency } : await fetchRealtimePrice(resource.url, currency);
        if (quote.price === null || !Number.isFinite(quote.price) || quote.price < 0) return null;
        return { ...resource, price: quote.price, currency: quote.currency, link_status: "ok" };
      } catch { return null; }
    }));
    result.push(...batch.filter((r): r is DiscoveredResource => r !== null));
  }
  return result;
}
