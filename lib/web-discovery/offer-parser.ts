type RecordValue = Record<string, unknown>;
const record = (value: unknown): value is RecordValue => !!value && typeof value === "object" && !Array.isArray(value);
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : value ? [value] : [];
function samePage(value: unknown, page: string): boolean {
  if (typeof value !== "string") return false;
  try {
    const a = new URL(value, page), b = new URL(page);
    return a.hostname.replace(/^www\./, "") === b.hostname.replace(/^www\./, "") && a.pathname.replace(/\/$/, "") === b.pathname.replace(/\/$/, "");
  } catch { return false; }
}

/** Only an unambiguous, in-stock offer belonging to this course may set its price.
 * Ignore recommendation carousels, aggregate ranges, trials, instalments and subscriptions.
 */
export function parseCourseOffer(html: string, page: string, now = Date.now()): { amount: number; currency: string; title?: string } | null {
  const nodes: RecordValue[] = [];
  for (const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed: unknown = JSON.parse(match[1]);
      for (const value of list(parsed)) {
        if (!record(value)) continue;
        nodes.push(value);
        for (const child of list(value["@graph"])) if (record(child)) nodes.push(child);
      }
    } catch { /* Invalid provider metadata is not a quote. */ }
  }
  const quotes: { amount: number; currency: string; title?: string }[] = [];
  for (const course of nodes) {
    if (!list(course["@type"]).some(t => t === "Course" || t === "Product")) continue;
    const identity = course.url ?? course["@id"] ?? course.mainEntityOfPage;
    for (const offer of list(course.offers)) {
      if (!record(offer) || offer["@type"] !== "Offer") continue;
      if (!samePage(identity, page) && !samePage(offer.url, page)) continue;
      if (offer.url && !samePage(offer.url, page)) continue;
      const availability = String(offer.availability ?? "");
      if (!/\b(InStock|OnlineOnly|LimitedAvailability)$/.test(availability)) continue;
      const validUntil = offer.priceValidUntil ?? offer.validThrough;
      if (validUntil && (!Number.isFinite(Date.parse(String(validUntil))) || Date.parse(String(validUntil)) < now)) continue;
      if (offer.validFrom && Date.parse(String(offer.validFrom)) > now) continue;
      const terms = JSON.stringify({ offer, description: course.description, name: course.name });
      if (/subscription|monthly|annually|per month|per year|\/month|\/year|installment|instalment|EMI|free trial|billingDuration|billingIncrement|membership/i.test(terms)) continue;
      // Coursera's zero-cost enrolment and monthly subscriptions are not full-course quotes.
      if (new URL(page).hostname.endsWith("coursera.org") && !/one.time|single payment/i.test(terms)) continue;
      const raw = offer.price;
      if (!(typeof raw === "number" || typeof raw === "string" && /^\d+(\.\d{1,2})?$/.test(raw))) continue;
      const amount = Number(raw), currency = String(offer.priceCurrency ?? "").toUpperCase();
      if (!Number.isFinite(amount) || amount <= 0 || !/^[A-Z]{3}$/.test(currency)) continue;
      quotes.push({ amount, currency, title: typeof course.name === "string" ? course.name : undefined });
    }
  }
  const unique = new Map(quotes.map(q => [`${q.amount}:${q.currency}`, q]));
  return unique.size === 1 ? [...unique.values()][0] : null;
}
