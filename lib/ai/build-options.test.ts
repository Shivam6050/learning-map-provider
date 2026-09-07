import { describe, it, expect } from "vitest";
import { buildPathOptions } from "@/lib/ai/build-options";
import type { SkeletonStage } from "@/lib/ai/skeleton";
import type { JudgedStage } from "@/lib/ai/judge";
import type { DiscoveredResource } from "@/lib/youtube/discover";

function resource(overrides: Partial<DiscoveredResource>): DiscoveredResource {
  return {
    id: overrides.id ?? "r1",
    title: overrides.title ?? "Resource",
    url: overrides.url ?? "https://example.com/r1",
    platform: overrides.platform ?? "youtube",
    resource_type: overrides.resource_type ?? "video",
    price: overrides.price ?? 0,
    currency: overrides.currency ?? "USD",
    signals: {},
    trust_status: "pending",
    rating: null,
    link_status: "ok",
    ...overrides,
  };
}

const stages: SkeletonStage[] = [
  { order_index: 0, title: "Stage 1", description: "d", estimated_hours: 5, search_topics: ["t1"] },
  { order_index: 1, title: "Stage 2", description: "d", estimated_hours: 5, search_topics: ["t2"] },
];

const freeVideo = resource({ id: "free-1", url: "https://example.com/free", price: 0 });
const paidCourse = resource({
  id: "paid-1",
  url: "https://example.com/paid",
  price: 40,
  resource_type: "course",
});

const judgedStages: JudgedStage[] = [
  {
    order_index: 0,
    selected_resources: [
      { url: freeVideo.url, is_primary: true, reason: "good" },
      { url: paidCourse.url, is_primary: false, reason: "deeper" },
    ],
  },
  {
    order_index: 1,
    selected_resources: [{ url: freeVideo.url, is_primary: true, reason: "good" }],
  },
];

const resourcesByUrl = new Map<string, DiscoveredResource>([
  [freeVideo.url, freeVideo],
  [paidCourse.url, paidCourse],
]);

const practiceChecksByStage = new Map<number, string>([
  [0, "Build a small thing"],
  [1, "Build another small thing"],
]);

describe("buildPathOptions", () => {
  it("produces exactly three options with the expected identities", () => {
    const options = buildPathOptions({
      skeleton: stages,
      judgedStages,
      resourcesByUrl,
      budgetTotal: 100,
      practiceChecksByStage,
    });
    expect(options).toHaveLength(3);
    expect(options.map((o) => o.id)).toEqual(["opt-1", "opt-2", "opt-3"]);
  });

  it("the saver option never includes a paid resource, regardless of budget", () => {
    const options = buildPathOptions({
      skeleton: stages,
      judgedStages,
      resourcesByUrl,
      budgetTotal: 1000, // budget is not the constraint here — strategy is
      practiceChecksByStage,
    });
    const saver = options.find((o) => o.id === "opt-3")!;
    const anyPaid = saver.stages.some((s) =>
      s.stage_resources.some((r) => r.resources.price > 0)
    );
    expect(anyPaid).toBe(false);
  });

  it("never selects a resource that wasn't actually offered to that stage", () => {
    const options = buildPathOptions({
      skeleton: stages,
      judgedStages,
      resourcesByUrl,
      budgetTotal: 100,
      practiceChecksByStage,
    });
    for (const option of options) {
      for (const stage of option.stages) {
        const judged = judgedStages.find((j) => j.order_index === stage.order_index)!;
        const offeredIds = judged.selected_resources.map((r) => resourcesByUrl.get(r.url)?.id);
        for (const sr of stage.stage_resources) {
          expect(offeredIds).toContain(sr.resource_id);
        }
      }
    }
  });

  it("does not exceed the given budget within the mastery option", () => {
    const tightBudget = 10; // less than paidCourse's price of 40
    const options = buildPathOptions({
      skeleton: stages,
      judgedStages,
      resourcesByUrl,
      budgetTotal: tightBudget,
      practiceChecksByStage,
    });
    const mastery = options.find((o) => o.id === "opt-1")!;
    expect(mastery.total_cost).toBeLessThanOrEqual(tightBudget);
  });

  it("selects paid courses for mastery and practical options according to user budget", () => {
    const candidatesByStage = new Map<number, DiscoveredResource[]>([
      [0, [freeVideo, paidCourse]],
      [1, [freeVideo, resource({ id: "paid-2", url: "https://example.com/paid2", price: 30, resource_type: "course" })]],
    ]);

    const fullResourcesByUrl = new Map<string, DiscoveredResource>([
      [freeVideo.url, freeVideo],
      [paidCourse.url, paidCourse],
      ["https://example.com/paid2", resource({ id: "paid-2", url: "https://example.com/paid2", price: 30, resource_type: "course" })],
    ]);

    const options = buildPathOptions({
      skeleton: stages,
      judgedStages,
      candidatesByStage,
      resourcesByUrl: fullResourcesByUrl,
      budgetTotal: 100,
      practiceChecksByStage,
    });

    const mastery = options.find((o) => o.id === "opt-1")!;
    const practical = options.find((o) => o.id === "opt-2")!;
    const saver = options.find((o) => o.id === "opt-3")!;

    expect(mastery.total_cost).toBeGreaterThan(0);
    expect(mastery.total_cost).toBeLessThanOrEqual(100);
    expect(practical.total_cost).toBeGreaterThan(0);
    expect(saver.total_cost).toBe(0);
  });

  it("scales total hours based on path strategy depth (Mastery > Practical > Saver)", () => {
    const options = buildPathOptions({
      skeleton: stages,
      judgedStages,
      resourcesByUrl,
      budgetTotal: 100,
      practiceChecksByStage,
    });

    const mastery = options.find((o) => o.id === "opt-1")!;
    const practical = options.find((o) => o.id === "opt-2")!;
    const saver = options.find((o) => o.id === "opt-3")!;

    expect(mastery.total_hours).toBeGreaterThan(practical.total_hours);
    expect(practical.total_hours).toBeGreaterThan(saver.total_hours);
  });
});
