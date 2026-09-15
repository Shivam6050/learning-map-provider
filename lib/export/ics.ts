import { studySessions, type StudyStage } from "./study-sessions";

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
  stages: StudyStage[];
  date?: string; time?: string; days?: number[];
}): string {
  const now = toIcsDate(new Date());
  const sessions=studySessions(params.stages,params.weeklyHours,params.date??params.startDate.toISOString().slice(0,10),params.time??"09:00",params.days??[1,2,3,4,5]);
  const events=sessions.map((session,index)=>[
    "BEGIN:VEVENT",
    `UID:${params.pathId}-${session.stage.id}-${index}-${session.start}@learning-map`,
    `DTSTAMP:${now}`,
    `DTSTART:${session.start}`,`DTEND:${session.end}`,
    `SUMMARY:${escapeIcsText(params.fieldName+": "+session.stage.title)}`,
    `DESCRIPTION:${escapeIcsText(session.stage.description+'\nStudy session: '+session.minutes+' minutes.')}`,
    "TRANSP:OPAQUE","END:VEVENT"
  ].join("\r\n")).join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Learning Map//Path Export//EN",
    "CALSCALE:GREGORIAN",
    events,
    "END:VCALENDAR",
  ].join("\r\n").split("\r\n").map(foldLine).join("\r\n") + "\r\n";
}
