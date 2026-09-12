import { cache } from "react";
import { inspectUrl } from "@/lib/link-check/check-url";
import { getConversionRate } from "@/lib/currency/convert";

export const SCRIMBA_PRICE_SOURCE = "https://scrimba.com/articles/scrimba-vs-udemy-for-learning-to-code-which-platform-is-right-for-you/";
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

export const scrimbaMonthlyQuote = cache(async (currency: string) => {
  const response = await fetch(SCRIMBA_PRICE_SOURCE, { signal: AbortSignal.timeout(8000), cache: "no-store" }).catch(() => null);
  if (!response?.ok) return null;
  const amount = parseScrimbaMonthlyPrice(await response.text());
  if (!amount) return null;
  const rate = await getConversionRate("USD", currency);
  return rate ? { price: Math.round(amount * rate * 100) / 100, currency } : null;
});

export async function paidSubscriptionQuote(url: string, currency: string) {
  if (!PAID_CATALOG.some(course => course.subscription && course.url === url)) return null;
  const page = await inspectUrl(url);
  if (page.status !== "ok" || page.url.replace(/\/$/, "") !== url) return null;
  const quote = await scrimbaMonthlyQuote(currency);
  return quote ? { ...quote, signals: { price_source: "scrimba_monthly", billing_group: "scrimba-pro", billing_interval: "month", price_checked_at: new Date().toISOString(), affiliate: true } } : null;
}
