import type { SkeletonStage } from "@/lib/ai/skeleton";
import type { JudgedStage } from "@/lib/ai/judge";
import type { DiscoveredResource } from "@/lib/youtube/discover";

export type OptionStageResource = {
  is_primary: boolean;
  order_index: number;
  resource_id: string; // real resources.id from discovery-time insert
  resources: {
    title: string;
    url: string;
    platform: string;
    resource_type: string;
    price: number;
    currency: string;
  };
};

export type OptionStage = {
  order_index: number;
  title: string;
  description: string;
  estimated_hours: number;
  stage_resources: OptionStageResource[];
  practice_check: string;
};

export type PathOption = {
  id: string;
  name: string;
  tagline: string;
  total_cost: number;
  total_hours: number;
  stages: OptionStage[];
};

type Strategy = "mastery" | "practical" | "saver";

function pickForStrategy(
  judgedCandidates: DiscoveredResource[],
  stageCandidates: DiscoveredResource[],
  strategy: Strategy,
  remainingBudget: number,
  seenUrlsInPath: Set<string>
): DiscoveredResource[] {
  const pool = judgedCandidates.length ? judgedCandidates : stageCandidates;

  const allPaidCandidates = [
    ...pool.filter((c) => c.price > 0),
    ...stageCandidates.filter((c) => c.price > 0 && !pool.some((p) => p.url === c.url)),
  ].sort((a, b) => b.price - a.price);

  const allFreeCandidates = [
    ...pool.filter((c) => c.price === 0),
    ...stageCandidates.filter((c) => c.price === 0 && !pool.some((p) => p.url === c.url)),
  ];

  if (strategy === "saver") {
    // 100% Free Path ($0) -> strictly filter for 100% free resources
    const freePool = stageCandidates.filter((c) => c.price === 0);
    const fallbackFreePool = freePool.length ? freePool : pool.filter((c) => c.price === 0);

    const unseenFreeDocs = fallbackFreePool.filter(
      (c) => (c.resource_type === "docs" || c.platform === "docs" || c.platform === "article") && !seenUrlsInPath.has(c.url)
    );
    const freeDocs = unseenFreeDocs.length ? unseenFreeDocs : fallbackFreePool.filter((c) => c.resource_type === "docs" || c.platform === "docs" || c.platform === "article");

    const unseenFreeVideos = fallbackFreePool.filter(
      (c) => (c.resource_type === "video" || c.platform === "youtube") && !seenUrlsInPath.has(c.url)
    );
    const freeVideos = unseenFreeVideos.length ? unseenFreeVideos : fallbackFreePool.filter((c) => c.resource_type === "video" || c.platform === "youtube");

    const picks: DiscoveredResource[] = [];
    if (freeVideos.length > 0) picks.push(freeVideos[0]);
    if (freeDocs.length > 0 && !picks.some((p) => p.url === freeDocs[0].url)) picks.push(freeDocs[0]);

    if (picks.length < 2) {
      for (const c of fallbackFreePool) {
        if (!picks.some((p) => p.url === c.url)) picks.push(c);
        if (picks.length >= 2) break;
      }
    }

    // Ensure we only return 100% free candidates
    return picks.filter((c) => c.price === 0).slice(0, 2);
  }

  const picks: DiscoveredResource[] = [];

  if (remainingBudget > 0) {
    // Prefer an unseen paid candidate that fits budget
    const unseenPaid = allPaidCandidates.find((p) => !seenUrlsInPath.has(p.url) && p.price <= remainingBudget);
    const affordablePaid = unseenPaid || allPaidCandidates.find((p) => p.price <= remainingBudget);
    if (affordablePaid) {
      picks.push(affordablePaid);
    }
  } else {
    // If remaining budget is 0, but an already-purchased paid course was used in an earlier stage, we can reuse it
    const alreadyPurchasedPaid = allPaidCandidates.find((p) => seenUrlsInPath.has(p.url));
    if (alreadyPurchasedPaid) {
      picks.push(alreadyPurchasedPaid);
    }
  }

  // Next, pick free resources (preferring unseen ones for this stage)
  const unseenDocs = allFreeCandidates.filter(
    (c) => (c.resource_type === "docs" || c.platform === "docs" || c.platform === "article") && !seenUrlsInPath.has(c.url)
  );
  const docs = unseenDocs.length ? unseenDocs : allFreeCandidates.filter((c) => c.resource_type === "docs" || c.platform === "docs" || c.platform === "article");

  const unseenVideos = allFreeCandidates.filter(
    (c) => (c.resource_type === "video" || c.platform === "youtube") && !seenUrlsInPath.has(c.url)
  );
  const freeVideos = unseenVideos.length ? unseenVideos : allFreeCandidates.filter((c) => c.resource_type === "video" || c.platform === "youtube");

  if (strategy === "practical") {
    if (freeVideos.length > 0 && !picks.some((p) => p.url === freeVideos[0].url)) {
      picks.push(freeVideos[0]);
    }
  } else {
    // mastery
    if (docs.length > 0 && !picks.some((p) => p.url === docs[0].url)) {
      picks.push(docs[0]);
    }
  }

  if (picks.length < 2) {
    for (const c of allFreeCandidates) {
      if (!picks.some((p) => p.url === c.url) && !seenUrlsInPath.has(c.url)) {
        picks.push(c);
      }
      if (picks.length >= 2) break;
    }
  }

  if (picks.length < 2) {
    for (const c of allFreeCandidates) {
      if (!picks.some((p) => p.url === c.url)) {
        picks.push(c);
      }
      if (picks.length >= 2) break;
    }
  }

  return picks.slice(0, 2);
}

function buildOption(
  optionId: string,
  name: string,
  tagline: string,
  strategy: Strategy,
  skeleton: SkeletonStage[],
  judgedStages: JudgedStage[],
  candidatesByStage: Map<number, DiscoveredResource[]> | undefined,
  resourcesByUrl: Map<string, DiscoveredResource>,
  budgetTotal: number,
  practiceChecksByStage: Map<number, string>
): PathOption {
  // Strategy budget caps: Option 1 = full budget, Option 2 = slightly less than budget (~60%), Option 3 = $0
  let remainingBudget = budgetTotal;
  if (strategy === "practical") {
    remainingBudget = Math.round(budgetTotal * 0.60);
  } else if (strategy === "saver") {
    remainingBudget = 0;
  }

  // Hour scaling factor based on path strategy depth
  const hourMultiplier = strategy === "mastery" ? 1.25 : strategy === "practical" ? 1.0 : 0.75;

  let totalCost = 0;
  let totalHours = 0;
  const seenUrlsInPath = new Set<string>();

  const stages: OptionStage[] = skeleton.map((stg) => {
    const stageHours = Math.max(4, Math.round(stg.estimated_hours * hourMultiplier));
    totalHours += stageHours;

    const judged = judgedStages.find((j) => j.order_index === stg.order_index);
    const judgedCandidates = (judged?.selected_resources ?? [])
      .map((r) => resourcesByUrl.get(r.url))
      .filter((r): r is DiscoveredResource => !!r);

    const rawStageCandidates = candidatesByStage?.get(stg.order_index) ?? [];
    const stageCandidates = rawStageCandidates.length
      ? rawStageCandidates
      : judgedCandidates.length
      ? judgedCandidates
      : Array.from(candidatesByStage?.values() ?? []).flat();

    const picked = pickForStrategy(judgedCandidates, stageCandidates, strategy, remainingBudget, seenUrlsInPath);

    const stageResources: OptionStageResource[] = picked.map((resource, i) => {
      const alreadyPurchased = seenUrlsInPath.has(resource.url);
      let priceForOptionCost = resource.price;

      if (alreadyPurchased) {
        priceForOptionCost = 0;
      } else if (priceForOptionCost > 0) {
        if (priceForOptionCost <= remainingBudget) {
          remainingBudget -= priceForOptionCost;
          totalCost += priceForOptionCost;
          seenUrlsInPath.add(resource.url);
        } else {
          totalCost += priceForOptionCost;
          seenUrlsInPath.add(resource.url);
        }
      } else {
        seenUrlsInPath.add(resource.url);
      }

      return {
        is_primary: i === 0,
        order_index: i,
        resource_id: resource.id,
        resources: {
          title: resource.title,
          url: resource.url,
          platform: resource.platform,
          resource_type: resource.resource_type,
          price: resource.price,
          currency: resource.currency,
        },
      };
    });

    return {
      order_index: stg.order_index,
      title: stg.title,
      description: stg.description,
      estimated_hours: stageHours,
      stage_resources: stageResources,
      practice_check:
        practiceChecksByStage.get(stg.order_index) ??
        `Build a small project or quiz yourself on: ${stg.title}.`,
    };
  });

  return { id: optionId, name, tagline, total_cost: totalCost, total_hours: totalHours, stages };
}

export function buildPathOptions(params: {
  skeleton: SkeletonStage[];
  judgedStages: JudgedStage[];
  candidatesByStage?: Map<number, DiscoveredResource[]>;
  resourcesByUrl: Map<string, DiscoveredResource>;
  budgetTotal: number;
  practiceChecksByStage: Map<number, string>;
}): PathOption[] {
  const { skeleton, judgedStages, candidatesByStage, resourcesByUrl, budgetTotal, practiceChecksByStage } = params;

  return [
    buildOption(
      "opt-1",
      "Option 1: Full Budget Path (Mastery)",
      "Full budget path featuring top-tier paid bootcamps and deep-dive courses up to your budget limit.",
      "mastery",
      skeleton,
      judgedStages,
      candidatesByStage,
      resourcesByUrl,
      budgetTotal,
      practiceChecksByStage
    ),
    buildOption(
      "opt-2",
      "Option 2: Moderate Path (Slightly Below Budget)",
      "Combines hands-on video tutorials with targeted mid-range courses, spending slightly less than your budget.",
      "practical",
      skeleton,
      judgedStages,
      candidatesByStage,
      resourcesByUrl,
      budgetTotal,
      practiceChecksByStage
    ),
    buildOption(
      "opt-3",
      "Option 3: 100% Free Path (Budget Saver)",
      "100% Free, high-quality videos and official documentation — no spending required ($0).",
      "saver",
      skeleton,
      judgedStages,
      candidatesByStage,
      resourcesByUrl,
      budgetTotal,
      practiceChecksByStage
    ),
  ];
}
