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
  candidates: DiscoveredResource[],
  strategy: Strategy,
  remainingBudget: number
): DiscoveredResource[] {
  const free = candidates.filter((c) => c.price === 0);
  const paid = candidates.filter((c) => c.price > 0);

  if (strategy === "saver") {
    // 100% Free Path ($0)
    return free.length
      ? free.slice(0, 2)
      : candidates.slice(0, 1).map((c) => ({ ...c, price: 0 }));
  }

  if (strategy === "practical") {
    // Mid-Range Path: Include 1 paid course if budget permits, balanced with videos & docs
    const picks: DiscoveredResource[] = [];
    const videos = candidates.filter((c) => c.resource_type === "video");

    const midPaid = paid.find((p) => p.price <= remainingBudget);
    if (midPaid && remainingBudget > 0) {
      picks.push(midPaid);
    }
    if (videos.length && !picks.some((p) => p.url === videos[0].url)) {
      picks.push(videos[0]);
    }
    if (free.length && !picks.some((p) => p.url === free[0].url)) {
      picks.push(free[0]);
    }
    return picks.length ? picks.slice(0, 2) : (free.length ? free.slice(0, 2) : candidates.slice(0, 2));
  }

  // Mastery Path (Upper-Range): Prioritize premium paid courses for depth across stages
  const picks: DiscoveredResource[] = [];
  const affordablePaid = paid.find((p) => p.price <= remainingBudget);
  if (affordablePaid && remainingBudget > 0) {
    picks.push(affordablePaid);
  }
  if (free.length && !picks.some((p) => p.url === free[0].url)) {
    picks.push(free[0]);
  }
  return picks.length ? picks.slice(0, 2) : (candidates.length ? candidates.slice(0, 2) : []);
}

function buildOption(
  optionId: string,
  name: string,
  tagline: string,
  strategy: Strategy,
  skeleton: SkeletonStage[],
  judgedStages: JudgedStage[],
  resourcesByUrl: Map<string, DiscoveredResource>,
  budgetTotal: number,
  practiceChecksByStage: Map<number, string>
): PathOption {
  let remainingBudget = budgetTotal;
  let totalCost = 0;
  let totalHours = 0;
  const allResources = Array.from(resourcesByUrl.values());

  const stages: OptionStage[] = skeleton.map((stg) => {
    totalHours += stg.estimated_hours;
    const judged = judgedStages.find((j) => j.order_index === stg.order_index);
    let candidates = (judged?.selected_resources ?? [])
      .map((r) => resourcesByUrl.get(r.url))
      .filter((r): r is DiscoveredResource => !!r);

    if (candidates.length === 0) {
      candidates = allResources;
    }

    const picked = pickForStrategy(candidates, strategy, remainingBudget);

    const stageResources: OptionStageResource[] = picked.map((resource, i) => {
      const finalPrice = strategy === "saver" ? 0 : resource.price;
      if (finalPrice > 0) {
        remainingBudget -= finalPrice;
        totalCost += finalPrice;
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
          price: finalPrice,
          currency: resource.currency,
        },
      };
    });

    return {
      order_index: stg.order_index,
      title: stg.title,
      description: stg.description,
      estimated_hours: stg.estimated_hours,
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
  resourcesByUrl: Map<string, DiscoveredResource>;
  budgetTotal: number;
  practiceChecksByStage: Map<number, string>;
}): PathOption[] {
  const { skeleton, judgedStages, resourcesByUrl, budgetTotal, practiceChecksByStage } = params;

  return [
    buildOption(
      "opt-1",
      "Comprehensive Mastery Path (Upper-Range Budget)",
      "Comprehensive path featuring top-tier paid bootcamps and deep-dive courses up to your budget limit.",
      "mastery",
      skeleton,
      judgedStages,
      resourcesByUrl,
      budgetTotal,
      practiceChecksByStage
    ),
    buildOption(
      "opt-2",
      "Fast-Track Practical Path (Mid-Range Budget)",
      "Combines hands-on video tutorials with targeted mid-range courses within your budget.",
      "practical",
      skeleton,
      judgedStages,
      resourcesByUrl,
      budgetTotal,
      practiceChecksByStage
    ),
    buildOption(
      "opt-3",
      "Essential & Budget Saver Path (Free)",
      "100% Free, high-quality videos and official documentation — no spending required ($0).",
      "saver",
      skeleton,
      judgedStages,
      resourcesByUrl,
      budgetTotal,
      practiceChecksByStage
    ),
  ];
}
