import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePathIcs } from "@/lib/export/ics";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS's learning_paths_owner_all policy means this only returns a
  // row if it belongs to the requesting user — no separate ownership
  // check needed here.
  const { data: path } = await supabase
    .from("learning_paths")
    .select("id, weekly_hours, created_at, fields(name)")
    .eq("id", id)
    .maybeSingle();

  if (!path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: stages } = await supabase
    .from("stages")
    .select("id, title, description, estimated_hours")
    .eq("path_id", id)
    .order("order_index");

  const field = Array.isArray(path.fields) ? path.fields[0] : path.fields;

  const ics = generatePathIcs({
    pathId: path.id,
    fieldName: field?.name ?? "Learning Path",
    startDate: new Date(path.created_at),
    weeklyHours: path.weekly_hours,
    stages: stages ?? [],
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="learning-path.ics"`,
    },
  });
}
