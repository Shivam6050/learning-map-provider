export type TimelineStage = { id: string; estimated_hours: number };

export type StageTimelineEntry = { startWeek: number; endWeek: number };

/**
 * Cumulative estimated_hours against weekly_hours -> a week range per
 * stage. Extracted from app/paths/[id]/page.tsx so the .ics export
 * uses the identical math instead of a second, potentially-diverging
 * copy of the same logic.
 */
export function computeStageTimeline(
  stages: TimelineStage[],
  weeklyHours: number
): { timeline: Map<string, StageTimelineEntry>; totalWeeks: number } {
  const weeklyHoursForMath = weeklyHours > 0 ? weeklyHours : 1;
  let cumulativeHours = 0;
  const timeline = new Map<string, StageTimelineEntry>();

  for (const stage of stages) {
    const startWeek = Math.floor(cumulativeHours / weeklyHoursForMath) + 1;
    cumulativeHours += stage.estimated_hours ?? 0;
    const endWeek = Math.max(startWeek, Math.ceil(cumulativeHours / weeklyHoursForMath));
    timeline.set(stage.id, { startWeek, endWeek });
  }

  const totalWeeks = Math.ceil(cumulativeHours / weeklyHoursForMath);
  return { timeline, totalWeeks };
}
