import { getConversionRate } from "@/lib/currency/convert";

export function parseW3Product(product: any, handle: string): number | null {
  if (product?.handle !== handle || product.available !== true || product.requires_selling_plan || product.selling_plan_groups?.length || !Array.isArray(product.variants)) return null;
  const prices = [...new Set<number>(product.variants.filter((v: any) => v.available === true && !v.requires_selling_plan).map((v: any) => v.price))];
  return prices.length === 1 && Number.isInteger(prices[0]) && prices[0] > 0 ? prices[0] / 100 : null;
}

/** Public Shopify product and currency endpoints; no cart changes or checkout calls. */
export async function w3schoolsQuote(url: string, currency: string) {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/(?:([a-z]{2}-[a-z]{2})\/)?products\/([a-z0-9-]+)\/?$/);
    if (parsed.hostname !== "campus.w3schools.com" || !match) return null;
    const prefix = "https://campus.w3schools.com/" + (match[1] ? match[1] + "/" : "");
    const responses = await Promise.all(["products/" + match[2] + ".js", "cart.js"].map(path => fetch(prefix + path, { signal: AbortSignal.timeout(8000), cache: "no-store" })));
    if (responses.some(response => !response.ok || new URL(response.url).hostname !== "campus.w3schools.com")) return null;
    const [product, cart] = await Promise.all(responses.map(response => response.json()));
    const amount = parseW3Product(product, match[2]);
    if (!amount || !["USD", "INR", "EUR", "GBP", "CAD", "AUD"].includes(cart.currency)) return null;
    const rate = await getConversionRate(cart.currency, currency);
    return rate ? { price: Math.round(amount * rate * 100) / 100, currency, isRealtime: cart.currency === currency, title: product.title } : null;
  } catch { return null; }
}
