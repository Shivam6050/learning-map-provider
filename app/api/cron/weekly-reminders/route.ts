import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail, emailDeliveryConfigured } from "@/lib/email/send";
import { getSiteUrl } from "@/lib/site";

export const maxDuration = 60;
type Path = { id: string; user_id: string; created_at: string; fields: { name: string } | { name: string }[] | null; stages: { stage_progress: { status: string; updated_at: string }[] }[] };
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]!));
}
function json(body: object, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return json({ error: "Unauthorized" }, 401);
  }
  const started = Date.now();
  const week = new Date(started);
  week.setUTCDate(week.getUTCDate() - ((week.getUTCDay() + 6) % 7));
  const period = week.toISOString().slice(0, 10);
  let sent = 0, claimed = 0, uncertain = 0, scanComplete = false;
  let phase = "configuration";
  function fail(reason: string) {
    const result = { reason, period, sent, claimed, uncertain, incomplete: !scanComplete, elapsedMs: Date.now() - started };
    // Fixed operation names and aggregate counts only: never log recipients, paths or provider errors.
    console.error("[cron/weekly-reminders]", result);
    return json({ error: "Reminder run needs attention", ...result }, 503);
  }
  try {
    if (!emailDeliveryConfigured()) return fail("email_not_configured");
    const client = createServiceClient();
    const cutoff = started - 7 * 86400000;
    phase = "checkpoint_read";
    const { data: checkpoint, error: checkpointError } = await client.from("reminder_scan_cursor")
      .select("last_path_id,completed").eq("period", period).abortSignal(AbortSignal.timeout(3000)).maybeSingle();
    if (checkpointError) return fail(phase);
    scanComplete = checkpoint?.completed === true;
    let cursor: string | null = checkpoint?.last_path_id ?? null;
    async function advance(pathId: string | null, completed = false) {
      phase = "checkpoint_write";
      const { error } = await client.rpc("advance_reminder_scan", { p_period: period, p_path: pathId, p_completed: completed })
        .abortSignal(AbortSignal.timeout(3000));
      if (error) throw new Error("Checkpoint unavailable");
      cursor = pathId;
      scanComplete = completed;
    }
    async function finish() {
      phase = "delivery_summary";
      // Completion means the path scan finished, not that every email was confirmed.
      // Recheck the durable ledger even on subsequent runs of an already completed scan.
      const { count, error } = await client.from("reminder_deliveries")
        .select("user_id", { count: "exact", head: true }).eq("period", period).neq("status", "sent")
        .abortSignal(AbortSignal.timeout(3000));
      if (error || count === null) return fail(phase);
      const outstanding = count;
      const result = { period, sent, claimed, uncertain, outstanding, incomplete: false, elapsedMs: Date.now() - started };
      if (outstanding > 0 || uncertain > 0) {
        console.warn("[cron/weekly-reminders]", { ...result, reason: "delivery_unresolved" });
        return json({ ...result, reason: "delivery_unresolved" }, 503);
      }
      console.info("[cron/weekly-reminders]", result);
      return json(result);
    }
    if (scanComplete) return await finish();
    while (Date.now() - started < 45000) {
      phase = "candidate_read";
      let query = client.from("learning_paths")
        .select("id,user_id,created_at,fields(name),stages(stage_progress(status,updated_at))")
        .eq("status", "active").order("id").limit(100);
      if (cursor) query = query.gt("id", cursor);
      const { data, error } = await query.abortSignal(AbortSignal.timeout(5000));
      if (error) return fail(phase);
      const paths = (data ?? []) as unknown as Path[];
      for (const path of paths) {
        if (Date.now() - started >= 45000) return fail("time_budget");
        if (!path.stages.length || path.stages.every(stage => stage.stage_progress[0]?.status === "completed")) {
          await advance(path.id); continue;
        }
        const latest = Math.max(Date.parse(path.created_at), ...path.stages.flatMap(stage => stage.stage_progress.map(progress => Date.parse(progress.updated_at) || 0)));
        if (latest >= cutoff) { await advance(path.id); continue; }
        phase = "recipient_read";
        const { data: userData, error: userError } = await client.auth.admin.getUserById(path.user_id);
        if (userError) return fail(phase);
        if (!userData.user?.email || !userData.user.email_confirmed_at || userData.user.user_metadata?.weekly_reminders === false) {
          await advance(path.id); continue;
        }
        phase = "delivery_claim";
        // Keep the durable claim even on unknown outcomes: never automatically resend.
        const { error: claimError } = await client.from("reminder_deliveries")
          .insert({ user_id: path.user_id, period }).abortSignal(AbortSignal.timeout(3000));
        if (claimError?.code === "23505") { await advance(path.id); continue; }
        if (claimError) return fail(phase);
        claimed++;
        const field = Array.isArray(path.fields) ? path.fields[0] : path.fields;
        phase = "email_send";
        const ok = await sendEmail({ to: userData.user.email, subject: "Your learning path is waiting", idempotencyKey: `learning-reminder/${path.user_id}/${period}`, html: `<p>Your ${escapeHtml(field?.name || "learning")} path is ready when you are.</p><p><a href="${getSiteUrl()}/paths/${path.id}">Continue learning</a></p><p><a href="${getSiteUrl()}/settings">Manage reminders in settings</a></p>` });
        // "sent" records provider acceptance, not inbox delivery.
        if (ok) sent++; else uncertain++;
        phase = "delivery_status_write";
        const { data: recorded, error: deliveryError } = await client.from("reminder_deliveries")
          .update({ status: ok ? "sent" : "uncertain" }).eq("user_id", path.user_id).eq("period", period)
          .select("status").abortSignal(AbortSignal.timeout(3000)).maybeSingle();
        if (deliveryError || !recorded) return fail(phase);
        await advance(path.id);
      }
      if (paths.length < 100) { await advance(cursor, true); return await finish(); }
    }
    return fail("time_budget");
  } catch {
    return fail(phase);
  }
}
