import { createServiceClient } from "@/lib/supabase/service";
import type { DiscoveredResource } from "@/lib/youtube/discover";
import { searchImpactCourses } from "./impact-catalog";

/** Impact's Url already contains the publisher's tracking link. Preserve it exactly. */
export async function discoverUdemyCourses(topics: string[], currency: string, budget: number): Promise<DiscoveredResource[]> {
  const quotes = (await Promise.all(topics.slice(0, 2).map(topic => searchImpactCourses(topic, currency, budget)))).flat();
  const unique = [...new Map(quotes.map(quote => [quote.url, quote])).values()];
  if (!unique.length) return [];
  const service = createServiceClient();
  const { data, error } = await service.from("resources").upsert(unique.map(quote => ({
    title: quote.title, url: quote.url, platform: "udemy", resource_type: "course",
    price: quote.price, currency: quote.currency, trust_status: "allowlisted",
    signals: { impact_item_id: quote.itemId, impact_catalog_id: process.env.UDEMY_IMPACT_CATALOG_ID!.trim(), price_source: "impact_catalog", price_checked_at: new Date().toISOString(), affiliate: true },
  })), { onConflict: "url" }).select("*");
  if (error) throw new Error("Could not save the Udemy catalog courses.");
  return (data ?? []).map((resource: DiscoveredResource) => ({ ...resource, link_status: "unchecked" }));
}
