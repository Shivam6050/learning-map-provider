import { describe, it, expect, vi } from "vitest";
import { prepareCandidates } from "./prepare-candidates";
import type { DiscoveredResource } from "@/lib/youtube/discover";
const mocks = vi.hoisted(() => ({ quote: vi.fn(), check: vi.fn() }));
vi.mock("@/lib/web-discovery/impact-catalog", () => ({ fetchImpactCourse: mocks.quote }));
vi.mock("./check-url", () => ({ checkUrlAlive: mocks.check }));
vi.mock("@/lib/ai/seed-resources", () => ({ BASE_SEED_RESOURCES: [] }));
describe("catalog candidate verification", () => {
  it("keeps a catalog-verified paid course even when storefront checks are blocked", async () => {
    vi.stubEnv("UDEMY_IMPACT_CATALOG_ID", "7");
    const resource = { id: "r", url: "https://udemy.sjv.io/course", platform: "udemy", price: 0, currency: "INR", signals: { price_source: "impact_catalog", impact_catalog_id: "7", impact_item_id: "7-1", affiliate: true } } as unknown as DiscoveredResource;
    mocks.quote.mockResolvedValue({ title: "JavaScript", url: resource.url, price: 499, currency: "INR" });
    expect((await prepareCandidates([resource], "INR"))[0].price).toBe(499);
    expect(mocks.check).not.toHaveBeenCalled();
    mocks.quote.mockResolvedValue(null);
    expect(await prepareCandidates([resource], "INR")).toEqual([]);
    vi.unstubAllEnvs();
  });
});
