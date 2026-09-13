import { computeStageTimeline, type TimelineStage } from "@/lib/paths/timeline";

function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/\r\n|\r/g, "\n").replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

// iCalendar content lines are limited to 75 UTF-8 octets.
function foldLine(line: string): string {
  let result = "", bytes = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    if (bytes + size > 75) { result += "\r\n "; bytes = 1; }
    result += char; bytes += size;
  }
  return result;
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
        `UID:${params.pathId}-${stage.id}@learning-map`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        `DTEND;VALUE=DATE:${dtEnd}`,
        `SUMMARY:${escapeIcsText(`${params.fieldName}: ${stage.title}`)}`,
        `DESCRIPTION:${escapeIcsText(stage.description)}`,
        "TRANSP:TRANSPARENT",
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
  ].join("\r\n").split("\r\n").map(foldLine).join("\r\n") + "\r\n";
}
