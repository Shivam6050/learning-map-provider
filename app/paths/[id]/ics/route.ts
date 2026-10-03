import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUuid } from "@/lib/security/validation";
import { parseStudyDays } from "@/lib/export/study-sessions";
import { generatePathIcs } from "@/lib/export/ics";

function failure(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try { requireUuid(id); } catch { return failure("Invalid roadmap", 400); }

  try {
    const supabase = await createClient();
    // The user-session client and RLS restrict this read to the roadmap owner.
    const { data: path, error: pathError } = await supabase
      .from("learning_paths")
      .select("id, weekly_hours, created_at, fields(name)")
      .eq("id", id)
      .maybeSingle();

    if (pathError) return failure("Could not load your roadmap. Please try again shortly.", 503);
    if (!path) return failure("Not found", 404);

    const { data: stages, error: stagesError } = await supabase
      .from("stages")
      .select("id, title, description, estimated_hours")
      .eq("path_id", id)
      .order("order_index");

    if (stagesError) return failure("Could not load your learning stages. Please try again shortly.", 503);
    if (!stages?.length) return failure("This roadmap has no learning stages to schedule.", 409);
    if (!stages.some(stage => stage.estimated_hours > 0)) return failure("This roadmap has no study sessions to schedule.", 409);

    const field = Array.isArray(path.fields) ? path.fields[0] : path.fields;
    const query = new URL(request.url).searchParams;
    let ics: string;
    try {
      ics = generatePathIcs({
        pathId: path.id,
        fieldName: field?.name ?? "Learning Path",
        startDate: new Date(path.created_at),
        weeklyHours: path.weekly_hours,
        stages,
        date: query.get("date") ?? new Date().toISOString().slice(0, 10),
        time: query.get("time") ?? "09:00",
        days: parseStudyDays(query.get("days")),
      });
    } catch (error) {
      return failure(error instanceof Error ? error.message : "Invalid schedule", 400);
    }

    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "private, no-store",
        "Content-Disposition": 'attachment; filename="learning-path.ics"',
      },
    });
  } catch {
    // Network failures must not masquerade as a missing roadmap or a valid file.
    return failure("Calendar download is temporarily unavailable. Please try again shortly.", 503);
  }
}
