import { cache } from "react";
import { getConversionRate } from "@/lib/currency/convert";
import { isSafeHttpUrl } from "@/lib/link-check/url-safety";

export type ImpactItem = {
  Id?: string; CatalogItemId?: string; CatalogId?: string; Name?: string; Description?: string;
  Url?: string; CurrentPrice?: string; Currency?: string; StockAvailability?: string; ExpirationDate?: string;
};
export type CatalogCourse = { itemId: string; title: string; url: string; price: number; currency: string };

export function impactConfigured(): boolean {
  return [process.env.IMPACT_ACCOUNT_SID, process.env.IMPACT_AUTH_TOKEN, process.env.UDEMY_IMPACT_CATALOG_ID].every(value => !!value?.trim());
}

// Requests only the configured partner's catalog. Never follow redirects with credentials.
const requestCatalog = cache(async (suffix: string): Promise<unknown> => {
  if (!impactConfigured()) return null;
  const sid = process.env.IMPACT_ACCOUNT_SID!.trim();
  const catalog = process.env.UDEMY_IMPACT_CATALOG_ID!.trim();
  const response = await fetch(`https://api.impact.com/Mediapartners/${encodeURIComponent(sid)}/Catalogs/${encodeURIComponent(catalog)}${suffix}`, {
    headers: { Accept: "application/json", Authorization: `Basic ${Buffer.from(`${sid}:${process.env.IMPACT_AUTH_TOKEN!.trim()}`).toString("base64")}` },
    redirect: "error", signal: AbortSignal.timeout(12000), cache: "no-store",
  });
  if (!response.ok) throw new Error(`Impact catalog request failed (${response.status}). Check catalog access and credentials.`);
  return response.json();
});

export function parseImpactItem(item: ImpactItem, catalogId: string, now = Date.now()): (Omit<CatalogCourse, "price"> & { amount: number }) | null {
  if (!item || String(item.CatalogId) !== catalogId || !item.Id || !item.Name?.trim() || !item.Url || !isSafeHttpUrl(item.Url)) return null;
  if (new URL(item.Url).protocol !== "https:") return null;
  if (!["instock", "limitedavailability"].includes(String(item.StockAvailability).toLowerCase())) return null;
  if (item.ExpirationDate && (!Number.isFinite(Date.parse(item.ExpirationDate)) || Date.parse(item.ExpirationDate) <= now)) return null;
  const raw = String(item.CurrentPrice ?? "");
  if (!/^\d+(\.\d+)?$/.test(raw) || !/^[A-Z]{3}$/.test(item.Currency ?? "")) return null;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { itemId: item.Id, title: item.Name, url: item.Url, amount, currency: item.Currency! };
}

async function convertItem(item: ImpactItem, currency: string): Promise<CatalogCourse | null> {
  const parsed = parseImpactItem(item, process.env.UDEMY_IMPACT_CATALOG_ID!.trim());
  if (!parsed) return null;
  const rate = await getConversionRate(parsed.currency, currency);
  if (!rate || !Number.isFinite(rate) || rate <= 0) return null;
  return { itemId: parsed.itemId, title: parsed.title, url: parsed.url, price: Math.round(parsed.amount * rate * 100) / 100, currency };
}

export const fetchImpactCourse = cache(async (itemId: string, currency: string): Promise<CatalogCourse | null> => {
  if (!impactConfigured() || !itemId) return null;
  const item = await requestCatalog(`/Items/${encodeURIComponent(itemId)}`) as ImpactItem | null;
  if (!item || item.Id !== itemId) return null;
  return convertItem(item, currency);
});

export function topicTerms(topic: string): string[] {
  const ignored = new Set(["learn", "learning", "course", "courses", "introduction", "beginner", "beginners", "advanced", "fundamentals", "development", "programming", "basics", "with", "and", "for", "the", "using"]);
  return [...new Set(topic.toLowerCase().replace(/[^a-z0-9.+# ]/g, " ").split(/\s+/).filter(term => term.length > 1 && !ignored.has(term)))].slice(0, 3);
}

export async function searchImpactCourses(topic: string, currency: string, budget: number): Promise<CatalogCourse[]> {
  if (!impactConfigured() || budget <= 0) return [];
  const terms = topicTerms(topic);
  if (!terms.length) return [];
  // Terms contain no quotes/operators from user input. Require relevance to multiple topic terms.
  const query = terms.map(term => `(Name ~ '${term}' OR Description ~ '${term}')`).join(" AND ");
  const params = new URLSearchParams({ Query: query, PageSize: "50" });
  const result = await requestCatalog(`/Items?${params}`) as { Items?: ImpactItem[] } | null;
  const items = Array.isArray(result?.Items) ? result.Items : [];
  const candidates = items.filter(item => terms.every(term => `${item.Name ?? ""} ${item.Description ?? ""}`.toLowerCase().includes(term)));
  const quotes = await Promise.all(candidates.slice(0, 50).map(item => convertItem(item, currency)));
  return quotes.filter((quote): quote is CatalogCourse => !!quote && quote.price <= budget);
}
