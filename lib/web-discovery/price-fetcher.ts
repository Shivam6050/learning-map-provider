import { inspectUrl } from "@/lib/link-check/check-url";
import { isPaidCourseUrl } from "./providers";
import { parseCourseOffer } from "./offer-parser";
import { isSafeHttpUrl } from "@/lib/link-check/url-safety";

type UdemyCourse = { url?: string; title?: string; headline?: string; rating?: number; discount_price?: { amount?: number; currency?: string }; price_detail?: { amount?: number; currency?: string }; visible_instructors?: { title?: string }[] };

import { getConversionRate } from "@/lib/currency/convert";

export type LivePriceResult = {
  price: number | null;
  currency: string;
  isRealtime: boolean;
  title?: string;
  headline?: string;
  rating?: number;
  instructor?: string;
};

function getUdemyCredentials(): { clientId: string; clientSecret: string } | null {
  let clientId = process.env.UDEMY_CLIENT_ID?.trim() || "";
  let clientSecret = process.env.UDEMY_CLIENT_SECRET?.trim() || "";
  const apiKey = process.env.UDEMY_API_KEY?.trim() || "";

  if ((!clientId || !clientSecret) && apiKey) {
    if (apiKey.includes(":")) {
      const parts = apiKey.split(":");
      clientId = parts[0].trim();
      clientSecret = parts[1].trim();
    }
  }

  if (clientId && clientSecret) {
    return { clientId, clientSecret };
  }
  return null;
}

/**
 * Official Udemy API Client Integration
 * Uses UDEMY_CLIENT_ID & UDEMY_CLIENT_SECRET (or UDEMY_API_KEY="id:secret") to query Udemy REST API v2.0
 * Endpoint: https://www.udemy.com/api-2.0/courses/
 * Header: Authorization: Basic Base64(CLIENT_ID:CLIENT_SECRET)
 */
export async function fetchUdemyApiPrice(
  url: string,
  targetCurrency: string = "INR"
): Promise<LivePriceResult | null> {
  const creds = getUdemyCredentials();
  if (!creds) {
    return null;
  }

  try {
    const currUpper = targetCurrency.toUpperCase();
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    const courseIndex = pathParts.indexOf("course");
    const slug = courseIndex !== -1 && pathParts[courseIndex + 1] ? pathParts[courseIndex + 1] : pathParts[0] || "";

    if (!slug || urlObj.hostname.replace(/^www\./, "") !== "udemy.com" || courseIndex < 0) return null;

    const authHeader = `Basic ${Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64")}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const apiUrl = `https://www.udemy.com/api-2.0/courses/?search=${encodeURIComponent(slug)}&fields[course]=title,headline,price,price_detail,discount_price,rating,visible_instructors,url&page_size=5`;
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        Authorization: authHeader,
        Accept: "application/json, text/plain, */*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    }).finally(() => clearTimeout(timeoutId));

    if (response.ok) {
      const data = await response.json();
      const results: UdemyCourse[] = data.results ?? [];
      const course =
        results.find((c) => c.url && new URL(c.url, "https://www.udemy.com").pathname.replace(/\/$/, "") === `/course/${slug}`);

      if (course) {
        const discountPrice = course.discount_price?.amount;
        const priceDetail = course.price_detail?.amount;
        const rawAmount = discountPrice ?? priceDetail;
        const rawCurrency = course.discount_price?.currency || course.price_detail?.currency || "USD";

        const title = course.title;
        const headline = course.headline;
        const rating = typeof course.rating === "number" ? Math.round(course.rating * 10) / 10 : undefined;
        const instructor = Array.isArray(course.visible_instructors) && course.visible_instructors[0]?.title
          ? course.visible_instructors[0].title
          : undefined;

        if (typeof rawAmount === "number" && rawAmount >= 0) {
          const rate = await getConversionRate(rawCurrency.toUpperCase(), currUpper);
          if (!rate || !Number.isFinite(rate)) return null;
          const converted = Math.round(rawAmount * rate * 100) / 100;
          return {
            price: converted,
            currency: currUpper,
            isRealtime: rawCurrency.toUpperCase() === currUpper,
            title,
            headline,
            rating,
            instructor,
          };
        }
      }
    }
  } catch (err) {
    console.warn("[Udemy API Price Fetch Failed]", err instanceof Error ? err.message : err);
  }

  return null;
}

/** Unknown prices stay unknown. Converted prices are estimates, not regional checkout quotes. */
export async function fetchRealtimePrice(url: string, targetCurrency = "INR"): Promise<LivePriceResult> {
  const currency = targetCurrency.toUpperCase();
  const unknown: LivePriceResult = { price: null, currency, isRealtime: false };
  if (!isSafeHttpUrl(url)) return unknown;
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./, "");
  // Paid discovery uses Impact; do not call the retired Udemy Affiliate API.
  if (isPaidCourseUrl(url)) {
    const page = await inspectUrl(url);
    if (page.status !== "ok" || !page.html || !isPaidCourseUrl(page.url)) return unknown;
    const offer = parseCourseOffer(page.html, page.url);
    if (!offer) return unknown;
    const rate = await getConversionRate(offer.currency, currency);
    if (!rate || !Number.isFinite(rate)) return unknown;
    return { price: Math.round(offer.amount * rate * 100) / 100, currency, isRealtime: offer.currency === currency, title: offer.title };
  }
  // Free tutorial access is separate from paid certificates.
  const freeHosts = ["youtube.com", "youtu.be", "freecodecamp.org", "developer.mozilla.org", "react.dev", "nextjs.org", "nodejs.org", "expressjs.com", "postgresql.org", "docs.python.org", "learn.microsoft.com", "pandas.pydata.org", "scikit-learn.org", "kubernetes.io", "testing-library.com", "w3schools.com"];
  if ((freeHosts.includes(host) && !(host === "w3schools.com" && /certificate|certification|spaces|plus/i.test(parsed.pathname))) || (host === "github.com" && parsed.pathname.split("/").filter(Boolean).length >= 2)) {
    return { price: 0, currency, isRealtime: false };
  }
  return unknown;
}
