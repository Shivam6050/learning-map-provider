import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchImpactCourse, parseImpactItem, searchImpactCourses, type ImpactItem } from "./impact-catalog";
vi.mock("@/lib/currency/convert", () => ({ getConversionRate: async (from: string, to: string) => from === to ? 1 : to === "INR" ? 85 : null }));
const item: ImpactItem = { Id: "7-101", CatalogId: "7", CatalogItemId: "101", Name: "JavaScript projects", Description: "Build JavaScript projects", Url: "https://udemy.sjv.io/example?u=https%3A%2F%2Fwww.udemy.com%2Fcourse%2Fjavascript%2F", CurrentPrice: "499", Currency: "INR", StockAvailability: "InStock" };
function configure() { vi.stubEnv("IMPACT_ACCOUNT_SID", "test-sid"); vi.stubEnv("IMPACT_AUTH_TOKEN", "test-token"); vi.stubEnv("UDEMY_IMPACT_CATALOG_ID", "7"); }
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
describe("Impact course catalog", () => {
  it("preserves partner tracking URLs and real prices", () => {
    expect(parseImpactItem(item, "7")).toMatchObject({ amount: 499, url: item.Url, itemId: "7-101", currency: "INR" });
  });
  it("rejects wrong catalogs, unavailable items, missing prices and expired offers", () => {
    for (const change of [{ CatalogId: "8" }, { StockAvailability: "OutOfStock" }, { CurrentPrice: "" }, { CurrentPrice: "-5" }, { Currency: "" }, { ExpirationDate: "2000-01-01" }, { Url: "http://127.0.0.1/private" }]) {
      expect(parseImpactItem({ ...item, ...change }, "7")).toBeNull();
    }
  });
  it("does not contact the catalog without credentials or for a free budget", async () => {
    vi.stubEnv("IMPACT_AUTH_TOKEN", "");
    const fetcher = vi.spyOn(global, "fetch");
    expect(await searchImpactCourses("JavaScript", "INR", 5000)).toEqual([]);
    configure();
    expect(await searchImpactCourses("JavaScript", "INR", 0)).toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("searches relevant courses, converts currency and respects the cap", async () => {
    configure();
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ Items: [item, { ...item, Id: "7-102", CurrentPrice: "10", Currency: "USD" }, { ...item, Id: "7-103", CurrentPrice: "9999" }, { ...item, Id: "7-104", Name: "Photography", Description: "Camera basics" }] })));
    const courses = await searchImpactCourses("JavaScript projects", "INR", 5000);
    expect(courses.map(course => course.price)).toEqual([499, 850]);
    expect(courses.every(course => course.currency === "INR")).toBe(true);
  });
  it("revalidates the exact item through the authenticated API, not its tracking link", async () => {
    configure();
    const fetcher = vi.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify(item)));
    expect(await fetchImpactCourse("7-101", "INR")).toMatchObject({ price: 499, url: item.Url });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0][0])).toBe("https://api.impact.com/Mediapartners/test-sid/Catalogs/7/Items/7-101");
    expect(fetcher.mock.calls[0][1]?.redirect).toBe("error");
  });
  it("does not substitute another course or hide catalog permission errors", async () => {
    configure();
    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ ...item, Id: "7-other" }))).mockResolvedValueOnce(new Response("", { status: 403 }));
    expect(await fetchImpactCourse("7-101", "INR")).toBeNull();
    await expect(searchImpactCourses("JavaScript", "INR", 5000)).rejects.toThrow("403");
  });
});
