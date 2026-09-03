import { computeStageTimeline, type TimelineStage } from "@/lib/paths/timeline";

function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

export function generatePathIcs(params: {
  pathId: string;
  fieldName: string;
  startDate: Date;
  weeklyHours: number;
  stages: (TimelineStage & { title: string; description: string })[];
}): string {
  const { timeline } = computeStageTimeline(params.stages, params.weeklyHours);
  const now = toIcsDate(new Date());

  const events = params.stages
    .map((stage) => {
      const range = timeline.get(stage.id);
      if (!range) return "";

      const eventStart = new Date(params.startDate);
      eventStart.setDate(eventStart.getDate() + (range.startWeek - 1) * 7);
      const eventEnd = new Date(params.startDate);
      eventEnd.setDate(eventEnd.getDate() + range.endWeek * 7);

      const dtStart = eventStart.toISOString().split("T")[0].replace(/-/g, "");
      const dtEnd = eventEnd.toISOString().split("T")[0].replace(/-/g, "");

      return [
        "BEGIN:VEVENT",
        `UID:${stage.id}@learning-map`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        `DTEND;VALUE=DATE:${dtEnd}`,
        `SUMMARY:${escapeIcsText(`${params.fieldName}: ${stage.title}`)}`,
        `DESCRIPTION:${escapeIcsText(stage.description)}`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .filter(Boolean)
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Learning Map//Path Export//EN",
    "CALSCALE:GREGORIAN",
    events,
    "END:VCALENDAR",
  ].join("\r\n");
}
