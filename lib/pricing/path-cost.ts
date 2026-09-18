type ResourceCost = { url: string; price: number; signals?: Record<string, unknown> };
export function pathCost(stages: { estimated_hours: number; resources: ResourceCost[] }[], weeklyHours = 10) {
  let total = 0;
  const seen = new Set<string>();
  const groups = new Map<string, { first: number; last: number; monthly: number; interval: "month" | "year" }>();
  stages.forEach((stage, index) => stage.resources.forEach(resource => {
    if (resource.signals?.price_unverified) return;
    if (resource.signals?.price_source === "scrimba_monthly" || resource.signals?.price_source === "scrimba_regional_plan") {
      const existing = groups.get("scrimba-pro");
      groups.set("scrimba-pro", { first: existing?.first ?? index, last: index, monthly: Math.max(existing?.monthly ?? 0, resource.price), interval: resource.signals?.billing_interval === "year" ? "year" : "month" });
    } else if (!seen.has(resource.url)) { total += resource.price; seen.add(resource.url); }
  }));
  const subscriptions = [...groups].map(([provider, group]) => {
    const hours = stages.slice(group.first, group.last + 1).reduce((sum, stage) => sum + stage.estimated_hours, 0);
    // Budget conservatively in four-week billing blocks, including intervening stages.
    const months = Math.max(1, Math.ceil(hours / (Math.max(1, weeklyHours) * 4)));
    const periods = group.interval === "year" ? Math.max(1, Math.ceil(hours / (Math.max(1, weeklyHours) * 52))) : months;
    const cost = Math.round(periods * group.monthly * 100) / 100;
    total += cost;
    return { provider, months, monthly_price: group.monthly, billing_interval: group.interval, periods, cost };
  });
  return { total: Math.round(total * 100) / 100, subscriptions };
}
