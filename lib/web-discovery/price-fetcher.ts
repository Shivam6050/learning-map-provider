import { getConversionRate } from "@/lib/currency/convert";

export type LivePriceResult = {
  price: number;
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

    if (!slug) return null;

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
      const results: any[] = data.results ?? [];
      const course =
        results.find((c) => c.url && c.url.includes(slug)) ||
        results[0];

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
          const converted = Math.round(rawAmount * (rate ?? 1));
          return {
            price: converted,
            currency: currUpper,
            isRealtime: true,
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

/**
 * Fetches real-time price for a course or resource URL.
 * Inspects official Udemy API, open-graph tags, JSON-LD schema metadata, and HTML pricing regex.
 * Degrades gracefully to verified platform market rates if scraping is blocked by anti-bot measures.
 */
export async function fetchRealtimePrice(
  url: string,
  targetCurrency: string = "INR"
): Promise<LivePriceResult> {
  const currUpper = targetCurrency.toUpperCase();
  const host = (() => {
    try {
      return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      return "";
    }
  })();

  // 1. Check official Udemy REST API if credentials exist
  if (host.includes("udemy.com")) {
    const apiResult = await fetchUdemyApiPrice(url, targetCurrency);
    if (apiResult) {
      return apiResult;
    }
  }

  // 2. Free platforms (Docs, YouTube, freeCodeCamp, MDN, GitHub) are always 0
  if (
    host.includes("youtube.com") ||
    host.includes("youtu.be") ||
    host.includes("freecodecamp.org") ||
    host.includes("mozilla.org") ||
    host.includes("github.com") ||
    host.includes("react.dev") ||
    host.includes("nextjs.org") ||
    host.includes("nodejs.org") ||
    host.includes("expressjs.com") ||
    host.includes("postgresql.org") ||
    host.includes("owasp.org") ||
    host.includes("python.org") ||
    host.includes("tailwindcss.com") ||
    host.includes("prisma.io") ||
    host.includes("pytorch.org") ||
    host.includes("pandas.pydata.org") ||
    host.includes("scikit-learn.org") ||
    host.includes("huggingface.co") ||
    host.includes("docker.com") ||
    host.includes("kubernetes.io") ||
    host.includes("vercel.com") ||
    host.includes("testing-library.com") ||
    host.startsWith("docs.") ||
    host.startsWith("developer.") ||
    host.includes("/docs")
  ) {
    return { price: 0, currency: currUpper, isRealtime: true };
  }

  // 2. Live HTTP page fetch attempt with custom browser headers
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": currUpper === "INR" ? "en-IN,en;q=0.9" : "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    }).finally(() => clearTimeout(timeoutId));

    if (response.ok) {
      const html = await response.text();

      // Check Schema.org / JSON-LD Offer price
      const jsonLdMatch = html.match(/"price"\s*:\s*"?(\d+(?:\.\d{1,2})?)"?/i);
      const currencyMatch = html.match(/"priceCurrency"\s*:\s*"([A-Z]{3})"/i);

      if (jsonLdMatch && jsonLdMatch[1]) {
        const rawAmount = parseFloat(jsonLdMatch[1]);
        const rawCurr = currencyMatch ? currencyMatch[1].toUpperCase() : "USD";
        if (rawAmount > 0) {
          const rate = await getConversionRate(rawCurr, currUpper);
          const converted = Math.round(rawAmount * (rate ?? 1));
          return { price: converted, currency: currUpper, isRealtime: true };
        }
      }

      // Check Meta OpenGraph price tags
      const metaAmountMatch = html.match(/meta\s+property=["']og:price:amount["']\s+content=["'](\d+(?:\.\d+)?)/i);
      const metaCurrencyMatch = html.match(/meta\s+property=["']og:price:currency["']\s+content=["']([A-Z]{3})/i);

      if (metaAmountMatch && metaAmountMatch[1]) {
        const rawAmount = parseFloat(metaAmountMatch[1]);
        const rawCurr = metaCurrencyMatch ? metaCurrencyMatch[1].toUpperCase() : "USD";
        if (rawAmount > 0) {
          const rate = await getConversionRate(rawCurr, currUpper);
          const converted = Math.round(rawAmount * (rate ?? 1));
          return { price: converted, currency: currUpper, isRealtime: true };
        }
      }

      // Check regex for INR / USD pricing tags in HTML text
      if (currUpper === "INR") {
        const inrMatch = html.match(/(?:₹|Rs\.?|INR)\s*([\d,]{3,6})/i);
        if (inrMatch && inrMatch[1]) {
          const parsed = parseInt(inrMatch[1].replace(/,/g, ""), 10);
          if (parsed >= 299 && parsed <= 15000) {
            return { price: parsed, currency: "INR", isRealtime: true };
          }
        }
      } else if (currUpper === "USD") {
        const usdMatch = html.match(/\$\s*(\d+(?:\.\d{2})?)/i);
        if (usdMatch && usdMatch[1]) {
          const parsed = parseFloat(usdMatch[1]);
          if (parsed >= 5 && parsed <= 300) {
            return { price: Math.round(parsed), currency: "USD", isRealtime: true };
          }
        }
      }
    }
  } catch {
    // Page fetch blocked or timed out — fallback to verified platform market rates below
  }

  // 3. Verified Platform Market Rates Fallback
  if (host.includes("udemy.com")) {
    const udemyPrice = currUpper === "INR" ? 486 : currUpper === "EUR" ? 13 : 13;
    return { price: udemyPrice, currency: currUpper, isRealtime: false };
  }

  if (host.includes("coursera.org")) {
    const courseraPrice = currUpper === "INR" ? 3999 : currUpper === "EUR" ? 45 : 49;
    return { price: courseraPrice, currency: currUpper, isRealtime: false };
  }

  if (host.includes("pluralsight.com") || host.includes("edx.org")) {
    const coursePrice = currUpper === "INR" ? 2400 : currUpper === "EUR" ? 30 : 35;
    return { price: coursePrice, currency: currUpper, isRealtime: false };
  }

  // Default fallback for unrecognized paid resources
  const defaultPrice = currUpper === "INR" ? 486 : 13;
  return { price: defaultPrice, currency: currUpper, isRealtime: false };
}
