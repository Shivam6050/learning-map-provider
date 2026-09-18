import { unstable_cache } from "next/cache";
import { paidSubscriptionQuote, PAID_CATALOG } from "@/lib/web-discovery/paid-catalog";
import { fetchRealtimePrice } from "@/lib/web-discovery/price-fetcher";
import { validCountry } from "@/lib/profile/residence";
/** Public quotes only. Cache identity includes market AND currency, never user records. */
export const currentQuote = unstable_cache(async (url:string, currency:string, country:string) => {
 if (!validCountry(country)) return null;
 try {
  if (PAID_CATALOG.some(c=>c.subscription && c.url===url)) {
   return await paidSubscriptionQuote(url,currency,country);
  }
  const quote=await fetchRealtimePrice(url,currency,country);
  if (quote.price===null || !Number.isFinite(quote.price) || quote.price<0) return null;
  return {...quote, signals:{price_country:country,price_checked_at:new Date().toISOString(),price_estimate:!quote.isRealtime}};
 } catch { return null; }
}, ["regional-public-course-quotes-v1"], {revalidate:300});
