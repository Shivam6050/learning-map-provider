import { parseW3Product } from "./w3schools-quote";
import { buildPathOptions } from "@/lib/ai/build-options";
import type { DiscoveredResource } from "@/lib/youtube/discover";
import { describe, it, expect, vi } from "vitest";
import { parseScrimbaMonthlyPrice, paidSubscriptionQuote, PAID_CATALOG } from "./paid-catalog";
import { pathCost } from "@/lib/pricing/path-cost";
import { fetchRealtimePrice } from "./price-fetcher";
vi.mock("@/lib/currency/convert", () => ({ getConversionRate: vi.fn(async (from: string, to: string) => from === to ? 1 : 90) }));

describe("paid plan accounting", () => {
  it("reads the actual monthly plan, not an annual monthly equivalent", () => {
    expect(parseScrimbaMonthlyPrice("$24.50 per month on the annual plan ($294/year), or $49 per month on the monthly plan")).toBe(49);
    expect(parseScrimbaMonthlyPrice("$24.50 per month on the annual plan")).toBeNull();
    expect(parseScrimbaMonthlyPrice("$49 per month on the monthly plan and $30 per month on the monthly plan")).toBeNull();
  });
  it("counts shared subscription access once and includes intervening study time", () => {
    const resource = {url: "https://scrimba.com/advanced-react-c02h", price: 49, signals: {price_source: "scrimba_monthly"}};
    const bill = pathCost([{estimated_hours: 20, resources: [resource]}, {estimated_hours: 40, resources: []}, {estimated_hours: 20, resources: [resource]}], 10);
    expect(bill.total).toBe(98);
    expect(bill.subscriptions[0].months).toBe(2);
    expect(pathCost([{estimated_hours: 20, resources: [resource]}], 10).total).toBe(49);
  });
});

describe.skipIf(!process.env.LIVE_PROVIDER_CHECK)("live paid providers", () => {
  it("retrieves a positive Scrimba monthly quote and W3Schools course quotes", async () => {
    const scrimba = await paidSubscriptionQuote("https://scrimba.com/advanced-react-c02h", "USD");
    expect(scrimba?.price).toBeGreaterThan(0);
    console.log("Scrimba monthly USD", scrimba?.price);
    const quotes = await Promise.all(PAID_CATALOG.filter(r => !r.subscription).map(async course => {
      const quote = await fetchRealtimePrice(course.url, "USD");
      return { title: course.title, price: quote.price };
    }));
    console.log(quotes);
    expect(quotes.find(q => q.title.startsWith("SQL"))?.price).toBeGreaterThan(0);
  }, 60000);
});

it("rejects sold-out, ambiguous and recurring W3Schools products", () => {
  const product = {handle: "sql-course", available: true, requires_selling_plan: false, variants: [{available: true, price: 9500}]};
  expect(parseW3Product(product, "sql-course")).toBe(95);
  expect(parseW3Product(product, "python-course")).toBeNull();
  expect(parseW3Product({...product, available: false}, "sql-course")).toBeNull();
  expect(parseW3Product({...product, requires_selling_plan: true}, "sql-course")).toBeNull();
  expect(parseW3Product({...product, variants: [...product.variants, {available:true,price:5000}]}, "sql-course")).toBeNull();
});
it("places a monthly subscription inside the right INR tier and explains higher-cost alternatives", () => {
  const paid: DiscoveredResource = { id: "pro", title: "Advanced React", url: "https://scrimba.com/advanced-react-c02h", platform: "article", resource_type: "course", price: 4410, currency: "INR", signals: {price_source: "scrimba_monthly"}, trust_status: "allowlisted", rating: null, link_status: "ok" };
  const free = {...paid, id: "free",url: "https://react.dev/",price: 0,signals: {}};
  const options = buildPathOptions({skeleton: [{order_index: 0,title: "React",description: "React",estimated_hours: 20,search_topics:["react"]}],judgedStages: [],candidatesByStage: new Map([[0,[paid,free]]]), resourcesByUrl: new Map([[paid.url,paid],[free.url,free]]),budgetTotal: 5000,currency: "INR",weeklyHours: 10,practiceChecksByStage: new Map()});
  expect(options[0].total_cost).toBe(4410);
  expect(options[0].subscriptions?.[0].months).toBe(1);
  expect(options[1].total_cost).toBe(0);
  expect(options[1].paid_alternatives?.[0].cost).toBe(4410);
  expect(options[2].stages[0].stage_resources.every(r => r.resources.price === 0)).toBe(true);
});
