import { describe, expect, it } from "vitest";
import { CURATED_LEARNING_RESOURCES, curatedLearningResource } from "./curated-resources";
import { buildPathOptions } from "@/lib/ai/build-options";
import { courseLink } from "@/lib/affiliates/links";
import type { DiscoveredResource } from "@/lib/youtube/discover";

describe("provider learning resources", () => {
  it("does not treat paid upgrades or lookalike domains as free", () => {
    for (const url of ["https://scrimba.com/pricing", "https://scrimba.com/advanced-react", "https://scrimba.com.evil.test/learn-react-c0e", "https://www.geeksforgeeks.org/courses/python", "https://campus.w3schools.com/products/python-course"]) {
      expect(curatedLearningResource(url)).toBeUndefined();
    }
    expect(curatedLearningResource("https://scrimba.com/learn-react-c0e?via=u4355626")?.price).toBe(0);
  });
  it("includes all three relevant providers without exceeding tier caps", () => {
    const free = CURATED_LEARNING_RESOURCES.filter(r => r.topic_hints.includes("javascript")).map((r,i) => ({...r, id: String(i), signals: {}, trust_status: "allowlisted", rating: null, link_status: "ok"} as DiscoveredResource));
    const paid = {...free[0], id: "paid", url: "https://example.com/course", price: 30};
    const candidates = [...free, paid];
    const options = buildPathOptions({ skeleton: [{order_index: 0,title: "JavaScript",description: "Learn JavaScript",estimated_hours: 10,search_topics: ["javascript"]}], judgedStages: [], candidatesByStage: new Map([[0,candidates]]), resourcesByUrl: new Map(candidates.map(r => [r.url,r])), budgetTotal: 100, currency: "USD", practiceChecksByStage: new Map() });
    for (const option of options) {
      const resources = option.stages[0].stage_resources;
      const hosts = resources.map(r => new URL(r.resources.url).hostname.replace(/^www\./, ""));
      expect(hosts).toEqual(expect.arrayContaining(["scrimba.com", "geeksforgeeks.org", "w3schools.com"]));
      expect(resources.length).toBeLessThanOrEqual(4);
      expect(new Set(resources.map(r => r.resource_id)).size).toBe(resources.length);
      expect(option.total_cost).toBeLessThanOrEqual(option.budget_cap!);
    }
    expect(options[2].stages[0].stage_resources.every(r => r.resources.price === 0)).toBe(true);
    const link = courseLink(free[0].url);
    expect(new URL(link.href).searchParams.get("via")).toBe("u4355626");
    expect(link.affiliate).toBe(true);
  });
});
