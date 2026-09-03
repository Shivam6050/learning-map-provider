import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/send";
import { getSiteUrl } from "@/lib/site";
import { logError } from "@/lib/monitoring/log-error";

const INACTIVE_AFTER_DAYS = 7;

/**
 * Relies on this cron's own schedule being weekly (see vercel.json) to
 * avoid double-emailing, rather than a separate "last reminded"
 * tracking column — simpler for now. If the schedule ever changes to
 * run more often, this would need that tracking added, since nothing
 * here currently stops it from re-emailing the same inactive user on
 * every run.
 *
 * Scale note: this fetches every active path with its stages/progress
 * and does the "is it stale and incomplete" check in application code,
 * rather than a single aggregate SQL query. Fine at the scale this
 * project is at; a materialized view or SQL function would be the next
 * step if the active-path count grows into the thousands.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const cutoff = new Date(Date.now() - INACTIVE_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const { data: paths, error } = await service
    .from("learning_paths")
    .select(
      `
      id, user_id, created_at, fields(name),
      stages ( id, title, stage_progress ( status, updated_at ) )
    `
    )
    .eq("status", "active");

  if (error) {
    await logError("cron/weekly-reminders", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const staleUserIds = new Map<string, { pathId: string; fieldName: string }>();

  for (const path of paths ?? []) {
    const stages = (path as any).stages ?? [];
    if (stages.length === 0) continue;

    const allCompleted = stages.every(
      (s: any) => s.stage_progress?.[0]?.status === "completed"
    );
    if (allCompleted) continue; // nothing to nudge about

    const lastActivity = stages.reduce((latest: Date, s: any) => {
      const updatedAt = s.stage_progress?.[0]?.updated_at;
      const t = updatedAt ? new Date(updatedAt) : new Date(path.created_at);
      return t > latest ? t : latest;
    }, new Date(path.created_at));

    if (lastActivity < cutoff && !staleUserIds.has(path.user_id)) {
      const field = Array.isArray((path as any).fields) ? (path as any).fields[0] : (path as any).fields;
      staleUserIds.set(path.user_id, { pathId: path.id, fieldName: field?.name ?? "your field" });
    }
  }

  let sent = 0;
  const siteUrl = getSiteUrl();

  for (const [userId, info] of staleUserIds) {
    const { data: userData, error: userError } = await service.auth.admin.getUserById(userId);
    if (userError || !userData?.user?.email) continue;

    const ok = await sendEmail({
      to: userData.user.email,
      subject: `You haven't touched your ${info.fieldName} path in a while`,
      html: `
        <p>Hey — your ${info.fieldName} learning path is waiting for you.</p>
        <p>A few minutes today keeps momentum going.</p>
        <p><a href="${siteUrl}/paths/${info.pathId}">Pick up where you left off</a></p>
      `,
    });
    if (ok) sent++;
  }

  return NextResponse.json({ candidateUsers: staleUserIds.size, sent });
}
