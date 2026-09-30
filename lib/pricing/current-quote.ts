import { unstable_cache } from "next/cache";
import { paidSubscriptionQuote, PAID_CATALOG } from "@/lib/web-discovery/paid-catalog";
import { fetchRealtimePrice } from "@/lib/web-discovery/price-fetcher";
import { validCountry } from "@/lib/profile/residence";
/** Public quotes only. Cache identity includes market AND currency, never user records. */
const cachedQuote = unstable_cache(async (url:string, currency:string, country:string) => {
 if (!validCountry(country)) return null;
 try {
  if (PAID_CATALOG.some(c=>c.subscription && c.url===url)) {
   return await paidSubscriptionQuote(url,currency,country);
  }
  const quote=await fetchRealtimePrice(url,currency,country);
  if (quote.price===null || !Number.isFinite(quote.price) || quote.price<0) return null;
  return {...quote, signals:{price_country:country,price_checked_at:new Date().toISOString(),price_estimate:!quote.isRealtime}};
 } catch { return null; }
}, ["regional-public-course-quotes-v2"], {revalidate:300});

export async function currentQuote(url:string,currency:string,country:string) {
 const quote=await cachedQuote(url,currency.toUpperCase(),country.toUpperCase());
 if(!quote)return null;
 // A fresh FX estimate is still not a verified regional checkout price.
 if(typeof quote.price !== "number" || !Number.isFinite(quote.price) || quote.price < 0 || quote.currency !== currency.toUpperCase())return null;
 if(quote.signals.price_country !== country.toUpperCase())return null;
 if("price_estimate" in quote.signals && quote.signals.price_estimate)return null;
 const checked=Date.parse(String(quote.signals.price_checked_at));
 // Next cache revalidation can serve stale data: never budget an expired quote.
 if(!Number.isFinite(checked)||Date.now()-checked>300000||checked>Date.now())return null;
 return quote;
}
