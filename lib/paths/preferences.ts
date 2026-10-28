export type RoadmapPreferences = { weeklyHours: number; budgetTotal: number };
export type PreferenceState = { ok: boolean; message: string };

export function parseRoadmapPreferences(weekly: unknown, budget: unknown): RoadmapPreferences | null {
  if (typeof weekly !== "string" || !/^\d+$/.test(weekly) || typeof budget !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(budget)) return null;
  const weeklyHours = Number(weekly), budgetTotal = Number(budget);
  if (!Number.isInteger(weeklyHours) || weeklyHours < 1 || weeklyHours > 80 || !Number.isFinite(budgetTotal) || budgetTotal < 0 || budgetTotal > 100000) return null;
  return { weeklyHours, budgetTotal };
}
