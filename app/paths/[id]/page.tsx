import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateStageProgress, rateResource } from "@/app/paths/[id]/actions";
import { PathBoard } from "@/components/PathBoard";
import { getAvatarEmoji } from "@/lib/profile/avatars";
import { isSafeHttpUrl, ensureHttpUrl } from "@/lib/link-check/url-safety";
import { getConversionRate } from "@/lib/currency/convert";
import { computeStageTimeline } from "@/lib/paths/timeline";

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

const STATUS_STYLE: Record<string, string> = {
  not_started: "bg-slate-800/80 text-slate-400 border border-slate-700",
  in_progress: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
  completed: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
};

export default async function PathPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: path, error: pathError } = await supabase
    .from("learning_paths")
    .select("id, skill_level, weekly_hours, budget_total, currency, fields(name)")
    .eq("id", id)
    .maybeSingle();

  if (pathError || !path) notFound();

  let { data: stages, error: stagesError } = await supabase
    .from("stages")
    .select(
      `
      id, order_index, title, description, estimated_hours,
      stage_resources (
        is_primary,
        order_index,
        resources ( id, title, url, platform, resource_type, price, currency, rating, link_status )
      ),
      stage_progress ( status, completed_at, practice_check )
    `
    )
    .eq("path_id", id)
    .order("order_index");

  if (stagesError && stagesError.message.includes("link_status")) {
    const fallback = await supabase
      .from("stages")
      .select(
        `
        id, order_index, title, description, estimated_hours,
        stage_resources (
          is_primary,
          order_index,
          resources ( id, title, url, platform, resource_type, price, currency, rating )
        ),
        stage_progress ( status, completed_at, practice_check )
      `
      )
      .eq("path_id", id)
      .order("order_index");
    stages = fallback.data;
    stagesError = fallback.error;
  }

  if (stagesError) {
    throw new Error(`Failed to load path stages: ${stagesError.message}`);
  }

  const field = Array.isArray(path.fields) ? path.fields[0] : path.fields;

  const usdToPathCurrency = await getConversionRate("USD", path.currency);

  function convertedPrice(amountUsd: number): { amount: number; converted: boolean } {
    if (usdToPathCurrency === null) return { amount: amountUsd, converted: false };
    return { amount: Math.round(amountUsd * usdToPathCurrency * 100) / 100, converted: true };
  }

  let totalCost = 0;
  (stages ?? []).forEach((stage: any) => {
    stage.stage_resources?.forEach((sr: any) => {
      const res = Array.isArray(sr.resources) ? sr.resources[0] : sr.resources;
      if (res?.price && res.price > 0) {
        totalCost += convertedPrice(Number(res.price)).amount;
      }
    });
  });

  const totalStages = stages?.length ?? 0;
  const completedStages = (stages ?? []).filter(
    (s: any) => s.stage_progress?.[0]?.status === "completed"
  ).length;
  const progressPct = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  const { timeline: stageTimeline, totalWeeks } = computeStageTimeline(
    (stages ?? []).map((s: any) => ({ id: s.id, estimated_hours: s.estimated_hours })),
    path.weekly_hours
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("avatar_id").eq("id", user.id).maybeSingle()
    : { data: null };
  const avatarEmoji = getAvatarEmoji(profile?.avatar_id);

  const boardStages = (stages ?? []).map((stage: any) => ({
    id: stage.id,
    order_index: stage.order_index,
    title: stage.title,
    status: (stage.stage_progress?.[0]?.status ?? "not_started") as
      | "not_started"
      | "in_progress"
      | "completed",
  }));

  const resourceIds = new Set<string>();
  (stages ?? []).forEach((stage: any) => {
    stage.stage_resources?.forEach((sr: any) => {
      const res = Array.isArray(sr.resources) ? sr.resources[0] : sr.resources;
      if (res?.id) resourceIds.add(res.id);
    });
  });
  const { data: myRatings } = user
    ? await supabase
        .from("resource_ratings")
        .select("resource_id, rating")
        .eq("user_id", user.id)
        .in("resource_id", Array.from(resourceIds))
    : { data: [] };
  const myRatingByResource = new Map<string, number>(
    (myRatings ?? []).map((r: any) => [r.resource_id, r.rating])
  );

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 bg-grid-pattern py-12">
      <div className="glow-orb-indigo top-10 left-1/3" />
      <div className="glow-orb-purple bottom-10 right-10" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">{field?.name}</p>
          <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/20 capitalize">
            {path.skill_level} level
          </span>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="font-serif text-3xl font-extrabold text-white sm:text-4xl">Your Learning Roadmap</h1>
          <a
            href={`/paths/${path.id}/ics`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:border-slate-600 shadow-md"
            download
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-indigo-400">
              <path d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 3.5c-.69 0-1.25.56-1.25 1.25v8.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-8.5c0-.69-.56-1.25-1.25-1.25H4.75Z" />
            </svg>
            Export to Calendar (.ics)
          </a>
        </div>

        {/* Path Metrics Bar */}
        <div className="glass-card mt-6 grid grid-cols-2 gap-4 rounded-2xl p-5 text-center border-slate-800 sm:grid-cols-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Timeline</p>
            <p className="mt-1 text-base font-bold text-white">~{totalWeeks} weeks</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Weekly Hours</p>
            <p className="mt-1 text-base font-bold text-white">{path.weekly_hours} hrs/week</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Budget</p>
            <p className="mt-1 text-base font-bold text-white">
              {path.budget_total} {path.currency}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Est. Cost</p>
            <p className="mt-1 text-base font-bold text-emerald-400">
              {totalCost > 0 ? `${totalCost} ${path.currency}` : "Free ($0)"}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Overall Path Progress</span>
            <span className="text-indigo-400">
              {completedStages} of {totalStages} stages complete ({progressPct}%)
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500 shadow-md"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Interactive Board View */}
        {boardStages.length > 0 && (
          <div className="glass-card mt-8 rounded-3xl p-6 border-slate-800">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-indigo-400">
              Interactive Path Map
            </p>
            <PathBoard stages={boardStages} avatarEmoji={avatarEmoji} />
          </div>
        )}

        {!stages?.length ? (
          <div className="glass-card mt-8 rounded-3xl p-8 text-center text-sm text-slate-400 border-slate-800">
            This path has no stages yet — try generating a new path from Onboarding.
          </div>
        ) : (
          <ol className="mt-8 space-y-6">
            {stages.map((stage: any) => {
              const progress = stage.stage_progress?.[0];
              const status = progress?.status ?? "not_started";
              const timeline = stageTimeline.get(stage.id);

              return (
                <li
                  key={stage.id}
                  id={`stage-${stage.id}`}
                  className="glass-card scroll-mt-20 rounded-2xl p-6 border-slate-800/80 transition-all hover:border-indigo-500/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="font-serif text-lg font-bold text-white">
                      {stage.order_index + 1}. {stage.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                      {timeline && (
                        <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-300 font-semibold border border-indigo-500/20">
                          {timeline.startWeek === timeline.endWeek
                            ? `Week ${timeline.startWeek}`
                            : `Weeks ${timeline.startWeek}\u2013${timeline.endWeek}`}
                        </span>
                      )}
                      <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300 font-semibold border border-slate-700">
                        ~{stage.estimated_hours}h
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">{stage.description}</p>

                  {/* Stage Resources */}
                  {stage.stage_resources?.length ? (
                    <div className="mt-5 border-t border-slate-800/80 pt-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Curated Resources
                      </h4>
                      <ul className="space-y-2.5">
                        {stage.stage_resources
                          .sort((a: any, b: any) => a.order_index - b.order_index)
                          .map((sr: any, i: number) => {
                            const resource = Array.isArray(sr.resources) ? sr.resources[0] : sr.resources;
                            if (!resource) return null;
                            const isBroken = resource.link_status === "broken";
                            const safeUrl = ensureHttpUrl(resource.url || "");
                            const isValidLink = safeUrl.length > 0 && isSafeHttpUrl(safeUrl);
                            return (
                              <li key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-sm">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {sr.is_primary && !isBroken && isValidLink && (
                                    <span className="shrink-0 rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-indigo-300 border border-indigo-500/30">
                                      Primary
                                    </span>
                                  )}
                                  {isBroken || !isValidLink ? (
                                    <span className="flex items-center gap-2 text-slate-500">
                                      <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-red-300 border border-red-500/30">
                                        {isBroken ? "Unavailable" : "Blocked"}
                                      </span>
                                      <span className="line-through">{resource.title}</span>
                                    </span>
                                  ) : (
                                    <a
                                      href={safeUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 font-bold text-indigo-400 transition hover:text-indigo-300 hover:underline truncate"
                                    >
                                      <span>🔗 {resource.title}</span>
                                      <span className="text-[11px]">↗</span>
                                    </a>
                                  )}
                                </div>
                                <span className="text-xs text-slate-400 whitespace-nowrap font-medium self-end sm:self-center">
                                  {resource.platform} ·{" "}
                                  {resource.price > 0 ? (
                                    (() => {
                                      const conv = convertedPrice(Number(resource.price));
                                      return conv.converted && path.currency !== resource.currency
                                        ? `${conv.amount} ${path.currency}`
                                        : `${resource.price} ${resource.currency}`;
                                    })()
                                  ) : (
                                    <span className="text-emerald-400 font-semibold">Free</span>
                                  )}
                                  {resource.rating ? ` · ★ ${Number(resource.rating).toFixed(1)}` : ""}
                                </span>
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-slate-400">No resources linked to this stage yet.</p>
                  )}

                  {/* Resource Rating Actions */}
                  {stage.stage_resources?.length ? (
                    <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-800/80 pt-3">
                      {stage.stage_resources.map((sr: any) => {
                        const resource = Array.isArray(sr.resources) ? sr.resources[0] : sr.resources;
                        if (!resource || resource.link_status === "broken") return null;
                        const myRating = myRatingByResource.get(resource.id);
                        return (
                          <form
                            key={resource.id}
                            action={rateResource}
                            className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/40 rounded-lg px-2.5 py-1 border border-slate-800"
                          >
                            <input type="hidden" name="resourceId" value={resource.id} />
                            <input type="hidden" name="pathId" value={path.id} />
                            <span className="max-w-[8rem] truncate font-medium text-slate-300">{resource.title}:</span>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                type="submit"
                                name="rating"
                                value={n}
                                className={n <= (myRating ?? 0) ? "text-amber-400 text-sm" : "text-slate-600 hover:text-amber-400 text-sm"}
                                title={`Rate ${n} star${n > 1 ? "s" : ""}`}
                              >
                                ★
                              </button>
                            ))}
                          </form>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* Practice Check Card */}
                  {progress?.practice_check && (
                    <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-200">
                      <span className="font-bold text-amber-400 uppercase tracking-wider">⚡ Practice Check Task: </span>
                      <p className="mt-1 leading-relaxed font-medium">
                        {(progress.practice_check as { description: string }).description}
                      </p>
                    </div>
                  )}

                  {/* Stage Progress Action */}
                  <div className="mt-5 flex items-center gap-3 border-t border-slate-800/80 pt-4">
                    {status !== "completed" && (
                      <form action={updateStageProgress}>
                        <input type="hidden" name="stageId" value={stage.id} />
                        <input type="hidden" name="pathId" value={path.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={status === "not_started" ? "in_progress" : "completed"}
                        />
                        <button
                          type="submit"
                          className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold shadow-md"
                        >
                          {status === "not_started" ? "Start This Stage" : "Mark Complete ✓"}
                        </button>
                      </form>
                    )}
                    {status !== "not_started" && (
                      <form action={updateStageProgress}>
                        <input type="hidden" name="stageId" value={stage.id} />
                        <input type="hidden" name="pathId" value={path.id} />
                        <input type="hidden" name="status" value="not_started" />
                        <button
                          type="submit"
                          className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
                        >
                          Reset Progress
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
