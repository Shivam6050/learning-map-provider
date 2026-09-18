import { cache } from "react";
import { inspectUrl } from "@/lib/link-check/check-url";


export const SCRIMBA_PRICE_SOURCE = "https://scrimba.com/our-pricing";
export const PAID_CATALOG = [
  { title: "Placement 360 — GeeksforGeeks", url: "https://www.geeksforgeeks.org/courses/placement-360-cip-complete-tech-interview", topics: ["dsa", "data structures", "algorithms", "sql", "interview", "low level design"], subscription: false },
  { title: "MERN Full Stack — GeeksforGeeks", url: "https://www.geeksforgeeks.org/courses/mern-full-stack-live-course-ibm-certifications", topics: ["node", "nodejs", "express", "react", "mongodb", "mern", "fullstack", "full stack", "javascript"], subscription: false },
  { title: "Backend Developer Path — Scrimba Pro (stage-relevant modules)", url: "https://scrimba.com/the-backend-developer-path-c0tbi0l98f", topics: ["node", "nodejs", "node.js", "express", "nestjs", "sql", "postgresql", "backend architecture", "backend security", "backend deployment"], subscription: true },
  { title: "Fullstack Developer Path — Scrimba Pro (stage-relevant modules)", url: "https://scrimba.com/fullstack-path-c0fullstack", topics: ["fullstack", "full stack", "full-stack"], subscription: true },
  { title: "Advanced React — Scrimba Pro", url: "https://scrimba.com/advanced-react-c02h", topics: ["react", "jsx"], subscription: true },
  ...["html", "css", "javascript", "python", "sql", "react", "typescript", "git"].map(topic => ({ title: topic.toUpperCase() + " Certification Course — W3Schools", url: "https://campus.w3schools.com/products/" + topic + "-course", topics: [topic], subscription: false })),
];

export function parseScrimbaMonthlyPrice(html: string): number | null {
  const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  // Read the explicit monthly plan, never the annual plan's per-month equivalent.
  const prices = [...text.matchAll(/\$(\d+(?:\.\d{1,2})?)\s*(?:per\s+month|\/month)\s+(?:on the monthly plan|if you pay monthly)/gi)].map(m => Number(m[1]));
  const unique = [...new Set(prices)];
  return unique.length === 1 && unique[0] > 0 ? unique[0] : null;
}

// Parse the upfront billing amount. Currency alone does not establish a regional offer.
export function parseScrimbaPlan(html: string, currency: string) {
 const text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
 const symbol = currency === "INR" ? "₹" : currency === "USD" ? "USD\\s*" : currency === "EUR" ? "€" : null;
 if (!symbol) return null;
 const annual = [...text.matchAll(new RegExp("billed annually for\\s*" + symbol + "([0-9][0-9,]*(?:\\.[0-9]{1,2})?)", "gi"))].map(m=>Number(m[1].replace(/,/g,"")));
 const prices = [...new Set(annual)];
 if (prices.length === 1 && prices[0] > 0) return {price: prices[0], currency, interval: "year" as const};
 return null;
}
export const scrimbaPlanQuote = cache(async (currency: string, country?: string) => {
 const response = await fetch(SCRIMBA_PRICE_SOURCE, { signal: AbortSignal.timeout(8000), cache: "no-store" }).catch(()=>null);
 if (!response?.ok) return null;
 const html = await response.text();
 // The public page can differ from a signed-in, geolocated checkout.
 // Only accept a market when the page explicitly identifies that market.
 if (country && !scrimbaMatchesMarket(html, country)) return null;
 return parseScrimbaPlan(html, currency);
});

export async function paidSubscriptionQuote(url: string, currency: string, country?: string) {
  if (!PAID_CATALOG.some(course => course.subscription && course.url === url)) return null;
  const page = await inspectUrl(url);
  if (page.status !== "ok" || page.url.replace(/\/$/, "") !== url) return null;
  const quote = await scrimbaPlanQuote(currency, country);
  return quote ? { ...quote, signals: { price_source: "scrimba_regional_plan", billing_group: "scrimba-pro", billing_interval: quote.interval, price_source_url: SCRIMBA_PRICE_SOURCE, price_country: country ?? null, price_checked_at: new Date().toISOString(), affiliate: true } } : null;
}

export function scrimbaMatchesMarket(html: string, country: string): boolean {
 if (!/^[A-Z]{2}$/.test(country)) return false;
 const text=html.replace(/<[^>]*>/g," ").replace(/\s+/g," ");
 return new RegExp("\\b"+country+"\\s+Price discounted based on your region", "i").test(text);
}
