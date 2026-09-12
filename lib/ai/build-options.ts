import { pathCost } from "@/lib/pricing/path-cost";
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
    affiliate?: boolean;
    billing_interval?: "month";
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

export type PaidAlternative = {
  title: string; url: string; cost: number; months?: number; over_budget: boolean;
  resource_id: string; stage_indices: number[]; resources: OptionStageResource["resources"];
};

export type PathOption = {
  id: string;
  name: string;
  tagline: string;
  total_cost: number;
  total_hours: number;
  budget_cap?: number;
  target_min?: number;
  target_met?: boolean;
  availability_note?: string;
  subscriptions?: ReturnType<typeof pathCost>["subscriptions"];
  paid_alternatives?: PaidAlternative[];
  stages: OptionStage[];
};


type Bundle = { cents: number; picks: (DiscoveredResource | null)[]; urls: Set<string>; providers: Set<string> };
function provider(resource: DiscoveredResource) { try { return new URL(resource.url).hostname.replace(/^www\./, ""); } catch { return resource.platform; } }

// Plan across all stages, charging a course once even when several stages use it.
// Bounded beam search avoids exponential work while preserving different spending levels.
function chooseBundle(pools: DiscoveredResource[][], cap: number, hours: number[], weeklyHours: number): Bundle {
  let beam: Bundle[] = [{ cents: 0, picks: [], urls: new Set(), providers: new Set() }];
  const score = (b: Bundle) => b.cents / Math.max(1, cap) + Math.min(5, b.providers.size) * 0.025;
  for (const pool of pools) {
    const next = new Map<string, Bundle>();
    const paid = pool.filter(r => r.price > 0);
    for (const state of beam) for (const item of [null, ...paid]) {
      const cents = Math.round(pathCost([...state.picks, item].map((pick, i) => ({ estimated_hours: hours[i], resources: pick ? [pick] : [] })), weeklyHours).total * 100);
      if (cents > cap) continue;
      const urls = new Set(state.urls), providers = new Set(state.providers);
      if (item) { urls.add(item.url); providers.add(provider(item)); }
      const candidate = { cents, picks: [...state.picks, item], urls, providers };
      const key = cents + "|" + candidate.picks.map(pick => pick?.url ?? "").join("|");
      const existing = next.get(key);
      if (!existing || candidate.picks.filter(Boolean).length > existing.picks.filter(Boolean).length) next.set(key, candidate);
    }
    const ranked = [...next.values()].sort((a,b) => score(b) - score(a));
    // Keep lower-cost partial bundles so later stages can contain the best purchases.
    const buckets = new Map<number, Bundle>();
    for (const candidate of ranked) {
      const bucket = Math.floor(candidate.cents / Math.max(1, cap) * 512);
      if (!buckets.has(bucket)) buckets.set(bucket, candidate);
    }
    const kept = new Set(buckets.values());
    for (const candidate of ranked) { if (kept.size >= 2048) break; kept.add(candidate); }
    beam = [...kept];
  }
  return beam.sort((a,b) => score(b) - score(a))[0];
}

export function buildPathOptions(params: {
  skeleton: SkeletonStage[];
  judgedStages: JudgedStage[];
  candidatesByStage?: Map<number, DiscoveredResource[]>;
  resourcesByUrl: Map<string, DiscoveredResource>;
  budgetTotal: number;
  currency?: string;
  weeklyHours?: number;
  practiceChecksByStage: Map<number, string>;
}): PathOption[] {
  const { skeleton, judgedStages, candidatesByStage, resourcesByUrl, practiceChecksByStage } = params;
  const budget = Math.max(0, Math.floor((Number.isFinite(params.budgetTotal) ? params.budgetTotal : 0) * 100));
  const currency = params.currency ?? resourcesByUrl.values().next().value?.currency ?? "USD";
  const pools = skeleton.map(stage => {
    const judged = (judgedStages.find(j => j.order_index === stage.order_index)?.selected_resources ?? [])
      .map(r => resourcesByUrl.get(r.url)).filter((r): r is DiscoveredResource => !!r);
    const offered = candidatesByStage?.get(stage.order_index);
    const candidates = offered === undefined ? judged : [...judged.filter(r => offered.some(c => c.url === r.url)), ...offered];
    return [...new Map(candidates.filter(r => r.currency === currency && Number.isFinite(r.price) && r.price >= 0 && r.link_status !== "broken").map(r => [r.url,r])).values()];
  });
  return ([1, 0.5, 0] as const).map((fraction, index) => {
    const cap = Math.floor(budget * fraction);
    const stageHours = skeleton.map(stage => Math.max(4, Math.round(stage.estimated_hours * [1.25,1,0.75][index])));
    const bundle = chooseBundle(pools, cap, stageHours, params.weeklyHours ?? 10);
    const billing = pathCost(bundle.picks.map((pick, i) => ({ estimated_hours: stageHours[i], resources: pick ? [pick] : [] })), params.weeklyHours ?? 10);
    const minimum = Math.floor(cap * 0.8);
    const seen = new Set<string>();
    const stages = skeleton.map((stage, stageIndex) => {
      const paid = bundle.picks[stageIndex];
      const free = pools[stageIndex].filter(r => r.price === 0).sort((a,b) =>
        Number(seen.has(a.url)) - Number(seen.has(b.url)) ||
        Number(b.trust_status === "allowlisted") - Number(a.trust_status === "allowlisted") ||
        (b.rating ?? 0) - (a.rating ?? 0));
      const picks = paid ? [paid] : [];
      // Include topic-matched learning providers alongside the selected course.
      const course = free.find(r => r.resource_type === "course");
      if (!paid && course) picks.push(course);
      for (const host of ["scrimba.com", "geeksforgeeks.org", "w3schools.com"]) {
        const reference = free.find(r => provider(r) === host && !picks.some(p => provider(p) === host));
        if (reference && picks.length < 4) picks.push(reference);
      }
      const preferred = free.find(r => index === 1 ? r.resource_type === "video" : r.resource_type === "docs");
      if (preferred && picks.length < 4 && !picks.some(p => p.url === preferred.url)) picks.push(preferred);
      for (const r of free) { if (picks.length >= 3) break; if (!picks.some(p => p.url === r.url)) picks.push(r); }
      picks.forEach(r => seen.add(r.url));
      return {
        order_index: stage.order_index, title: stage.title, description: stage.description,
        estimated_hours: Math.max(4, Math.round(stage.estimated_hours * [1.25,1,0.75][index])),
        practice_check: practiceChecksByStage.get(stage.order_index) ?? "Practice what you learned: " + stage.title,
        stage_resources: picks.map((r,i) => ({ is_primary: i === 0, order_index: i, resource_id: r.id,
          resources: { title:r.title, url:r.url, platform:r.platform, resource_type:r.resource_type, price:r.price, currency:r.currency, affiliate:r.signals?.affiliate === true, billing_interval:r.signals?.price_source === "scrimba_monthly" ? "month" as const : undefined } })),
      };
    });
    const met = cap === 0 || bundle.cents >= minimum;
    return {
      id: "opt-" + (index + 1), name: ["Near your budget", "The balanced route", "The free route"][index],
      tagline: ["A broader course mix, targeting 80–100% of your budget.", "A focused course mix, targeting 40–50% of your budget.", "Free tutorials, videos and documentation. No course purchases."][index],
      total_cost: bundle.cents / 100, total_hours: stages.reduce((sum,stage) => sum + stage.estimated_hours,0), stages,
      subscriptions: billing.subscriptions,
      paid_alternatives: [...new Map(pools.flatMap((pool, stageIndex) => pool.filter(r => r.price > 0 && !bundle.urls.has(r.url)).map(r => {
        const estimate = pathCost(pools.map((pool, i) => ({ estimated_hours: stageHours[i], resources: pool.some(candidate => candidate.url === r.url) ? [r] : [] })), params.weeklyHours ?? 10);
        const withCourse = bundle.picks.map((pick, i) => ({ estimated_hours: stageHours[i], resources: [...(pick ? [pick] : []), ...(pools[i].some(candidate => candidate.url === r.url) ? [r] : [])] }));
        return { title: r.title, url: r.url, cost: estimate.total, months: estimate.subscriptions[0]?.months,
          over_budget: Math.round(pathCost(withCourse, params.weeklyHours ?? 10).total * 100) > cap,
          resource_id: r.id, stage_indices: pools.flatMap((p,i) => p.some(c => c.url === r.url) ? [skeleton[i].order_index] : []),
          resources: { title:r.title, url:r.url, platform:r.platform, resource_type:r.resource_type, price:r.price, currency:r.currency,
            affiliate:r.signals?.affiliate === true, billing_interval:r.signals?.price_source === "scrimba_monthly" ? "month" as const : undefined },
        };
      })).map(r => [r.url, r])).values()].sort((a,b) => a.cost - b.cost),
      budget_cap: cap / 100, target_min: minimum / 100, target_met: met,
      availability_note: met ? undefined : "Not enough suitable courses with verified prices fit this tier. This is the best available lower-cost mix; regenerate later for new offers.",
    };
  });
}
