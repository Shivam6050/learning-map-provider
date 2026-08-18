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

/**
 * Picks which of a stage's already-judged (vetted) candidates to
 * include, per strategy. This does NOT re-judge quality — judge.ts
 * already did that — it only decides which of the 2-4 vetted resources
 * fit a given strategy's spending/format preference. No LLM call here;
 * deterministic selection over real, already-vetted candidates.
 */
function pickForStrategy(
  candidates: DiscoveredResource[],
  strategy: Strategy,
  remainingBudget: number
): DiscoveredResource[] {
  const free = candidates.filter((c) => c.price === 0);
  const paid = candidates.filter((c) => c.price > 0);

  if (strategy === "saver") {
    return free.length ? free.slice(0, 2) : candidates.slice(0, 1);
  }

  if (strategy === "practical") {
    const videos = candidates.filter((c) => c.resource_type === "video");
    const nonVideo = candidates.filter((c) => c.resource_type !== "video");
    const picks = [...videos.slice(0, 1), ...nonVideo.slice(0, 1)].filter(
      (r) => r.price === 0 || r.price <= remainingBudget
    );
    return picks.length ? picks : free.slice(0, 1);
  }

  // mastery: prefer including one paid (highest-signal) resource per
  // stage if budget allows, plus one free supplement
  const picks: DiscoveredResource[] = [];
  const affordablePaid = paid.find((p) => p.price <= remainingBudget);
  if (affordablePaid) picks.push(affordablePaid);
  if (free.length) picks.push(free[0]);
  return picks.length ? picks : candidates.slice(0, 2);
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

  const stages: OptionStage[] = skeleton.map((stg) => {
    totalHours += stg.estimated_hours;
    const judged = judgedStages.find((j) => j.order_index === stg.order_index);
    const candidates = (judged?.selected_resources ?? [])
      .map((r) => resourcesByUrl.get(r.url))
      .filter((r): r is DiscoveredResource => !!r);

    const picked = pickForStrategy(candidates, strategy, remainingBudget);

    const stageResources: OptionStageResource[] = picked.map((resource, i) => {
      if (resource.price > 0) {
        remainingBudget -= resource.price;
        totalCost += resource.price;
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
      "Comprehensive Mastery Path",
      "Combines a paid resource per stage where it adds the most depth, filled out with vetted free resources.",
      "mastery",
      skeleton,
      judgedStages,
      resourcesByUrl,
      budgetTotal,
      practiceChecksByStage
    ),
    buildOption(
      "opt-2",
      "Fast-Track Practical Path",
      "Prioritizes hands-on video resources for a build-as-you-learn approach.",
      "practical",
      skeleton,
      judgedStages,
      resourcesByUrl,
      budgetTotal,
      practiceChecksByStage
    ),
    buildOption(
      "opt-3",
      "Essential & Budget Saver Path",
      "Free, vetted resources only — no spend required.",
      "saver",
      skeleton,
      judgedStages,
      resourcesByUrl,
      budgetTotal,
      practiceChecksByStage
    ),
  ];
}
