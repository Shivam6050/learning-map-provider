import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyResourceLinks } from "@/lib/link-check/verify-resources";
import { logError } from "@/lib/monitoring/log-error";

const RECHECK_AFTER_DAYS = 14;
const BATCH_SIZE = 100;

/**
 * Discovery-time checks (see lib/youtube/discover.ts,
 * lib/web-discovery/discover.ts) only cover resources a NEW path
 * generation touches. A resource already sitting in someone's saved
 * path, that nobody else's topic search happens to hit again, would
 * never get re-verified without this — link rot doesn't announce
 * itself, so this is the only thing standing between "was real when
 * discovered" and "still real six months later".
 *
 * Vercel Cron calls this on the schedule in vercel.json. Protected by
 * CRON_SECRET so it can't be triggered by anyone who finds the URL.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const cutoff = new Date(Date.now() - RECHECK_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: due, error } = await service
    .from("resources")
    .select("id, url, platform")
    .neq("link_status", "broken") // already-known-dead don't need rechecking
    .or(`link_checked_at.is.null,link_checked_at.lt.${cutoff}`)
    .limit(BATCH_SIZE);

  if (error) {
    await logError("cron/check-links", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!due || due.length === 0) {
    return NextResponse.json({ checked: 0, broken: 0 });
  }

  const results = await verifyResourceLinks(due);
  const brokenCount = results.filter((r) => !r.alive).length;

  return NextResponse.json({ checked: results.length, broken: brokenCount });
}
