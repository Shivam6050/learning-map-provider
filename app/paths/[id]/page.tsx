import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PathBoard } from "@/components/PathBoard";
import { FilteredStageList } from "@/components/FilteredStageList";
import { getAvatarEmoji } from "@/lib/profile/avatars";
import { getConversionRate } from "@/lib/currency/convert";
import { computeStageTimeline } from "@/lib/paths/timeline";
import { getFieldBySlug } from "@/lib/fields/catalog";

export default async function PathPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const service = createServiceClient();
  const { data: path, error: pathError } = await supabase
    .from("learning_paths")
    .select("id, field_id, skill_level, weekly_hours, budget_total, currency, fields(name, slug)")
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

  if (stagesError && stagesError.message?.includes("link_status")) {
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
    throw new Error(`Failed to load path stages: ${stagesError.message || "Unknown error"}`);
  }

  let fieldName = Array.isArray(path.fields) ? path.fields[0]?.name : (path.fields as any)?.name;
  let fieldSlug = Array.isArray(path.fields) ? path.fields[0]?.slug : (path.fields as any)?.slug;

  if (!fieldName && path.field_id) {
    const { data: fRow } = await service.from("fields").select("name, slug").eq("id", path.field_id).maybeSingle();
    if (fRow?.name) {
      fieldName = fRow.name;
      fieldSlug = fRow.slug;
    }
  }

  if (!fieldName && fieldSlug) {
    const catalogMatch = getFieldBySlug(fieldSlug);
    if (catalogMatch) fieldName = catalogMatch.name;
  }

  const usdToPathCurrency = await getConversionRate("USD", path.currency);

  let totalCost = 0;
  const processedResourceUrls = new Set<string>();

  (stages ?? []).forEach((stage: any) => {
    stage.stage_resources?.forEach((sr: any) => {
      const res = Array.isArray(sr.resources) ? sr.resources[0] : sr.resources;
      if (res?.price && Number(res.price) > 0 && res.url && !processedResourceUrls.has(res.url)) {
        processedResourceUrls.add(res.url);

        const resCurrency = (res.currency || "USD").toUpperCase();
        const targetCurrency = (path.currency || "USD").toUpperCase();

        if (resCurrency === targetCurrency) {
          totalCost += Number(res.price);
        } else if (resCurrency === "USD" && targetCurrency === "INR") {
          const rate = usdToPathCurrency ?? 80;
          totalCost += Math.round(Number(res.price) * rate);
        } else {
          totalCost += Number(res.price);
        }
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

  const { data: myRatings } = user && resourceIds.size > 0
    ? await supabase
        .from("resource_ratings")
        .select("resource_id, rating")
        .eq("user_id", user.id)
        .in("resource_id", Array.from(resourceIds))
    : { data: [] };

  const myRatingByResource: Record<string, number> = Object.fromEntries(
    (myRatings ?? []).map((r: any) => [r.resource_id, r.rating])
  );

  const stageTimelineRecord: Record<string, { startWeek: number; endWeek: number }> =
    Object.fromEntries(stageTimeline);

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 bg-grid-pattern py-12">
      <div className="glow-orb-indigo top-10 left-1/3" />
      <div className="glow-orb-purple bottom-10 right-10" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">{fieldName}</p>
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

        {/* Stage List with Search & Filtering */}
        <FilteredStageList
          stages={stages ?? []}
          stageTimeline={stageTimelineRecord}
          path={path}
          usdToPathCurrency={usdToPathCurrency}
          myRatingByResource={myRatingByResource}
        />
      </div>
    </div>
  );
}
