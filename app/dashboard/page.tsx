import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { redirect } from "next/navigation";
import { PieChart, PieChartLegend } from "@/components/PieChart";
import { DeletePathButton } from "@/components/DeletePathButton";
import { getAvatarEmoji } from "@/lib/profile/avatars";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/dashboard");
  }

  let profile: { display_name?: string; role?: string; created_at?: string; avatar_id?: string } | null = null;
  const { data: pData, error: pErr } = await supabase
    .from("profiles")
    .select("display_name, role, created_at, avatar_id")
    .eq("id", user?.id)
    .maybeSingle();

  if (pErr && pErr.message.includes("avatar_id")) {
    const { data: fallbackP } = await supabase
      .from("profiles")
      .select("display_name, role, created_at")
      .eq("id", user?.id)
      .maybeSingle();
    profile = fallbackP;
  } else {
    profile = pData;
  }

  const { data: paths } = await supabase
    .from("learning_paths")
    .select(
      `
      id, skill_level, status, created_at, fields(name),
      stages ( id, stage_progress ( status ) )
    `
    )
    .order("created_at", { ascending: false });

  const avatarEmoji = getAvatarEmoji(profile?.avatar_id);

  let totalCompleted = 0;
  let totalInProgress = 0;
  let totalNotStarted = 0;
  (paths ?? []).forEach((path: any) => {
    (path.stages ?? []).forEach((stage: any) => {
      const status = stage.stage_progress?.[0]?.status ?? "not_started";
      if (status === "completed") totalCompleted++;
      else if (status === "in_progress") totalInProgress++;
      else totalNotStarted++;
    });
  });

  const overallSegments = [
    { label: "Completed", value: totalCompleted, colorClass: "text-emerald-400" },
    { label: "In progress", value: totalInProgress, colorClass: "text-amber-400" },
    { label: "Not started", value: totalNotStarted, colorClass: "text-slate-600" },
  ];
  const totalStagesEverywhere = totalCompleted + totalInProgress + totalNotStarted;
  const overallPct =
    totalStagesEverywhere > 0 ? Math.round((totalCompleted / totalStagesEverywhere) * 100) : 0;

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 bg-grid-pattern py-12">
      <div className="glow-orb-indigo top-10 left-1/3" />
      <div className="glow-orb-purple bottom-10 right-10" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
        {/* User Profile Header Card */}
        <div className="glass-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-3xl p-6 sm:p-8 border-slate-800 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-3xl shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              {avatarEmoji}
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                Welcome back, {profile?.display_name || user?.email?.split("@")[0]}!
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                {user?.email} · Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "2026"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              href="/settings"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:border-slate-600"
            >
              ⚙️ Settings
            </Link>
            <form action={logout}>
              <button className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20">
                Log out
              </button>
            </form>
          </div>
        </div>

        {/* Overall Progress & Stats Summary */}
        {paths?.length ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="glass-card col-span-2 flex flex-col sm:flex-row items-center gap-6 rounded-3xl p-6 border-slate-800">
              <PieChart segments={overallSegments} centerLabel={`${overallPct}%`} size={110} strokeWidth={14} />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Global Progress
                </span>
                <h3 className="mt-1 text-lg font-bold text-white">
                  {totalCompleted} of {totalStagesEverywhere} stages completed
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Across {paths.length} active learning path{paths.length === 1 ? "" : "s"}.
                </p>
                <div className="mt-3">
                  <PieChartLegend segments={overallSegments} />
                </div>
              </div>
            </div>

            <div className="glass-card flex flex-col justify-center rounded-3xl p-6 border-slate-800 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Quick Action
              </span>
              <h3 className="mt-1 text-lg font-bold text-white">Need a new path?</h3>
              <p className="mt-1 text-xs text-slate-400">
                Generate a custom Gemini roadmap for a new field in 10 seconds.
              </p>
              <Link
                href="/onboarding"
                className="btn-primary mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-md"
              >
                <span>✨</span> New Roadmap
              </Link>
            </div>
          </div>
        ) : null}

        {/* Learning Paths List */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-white">
              Your Learning Roadmaps ({paths?.length ?? 0})
            </h2>
            <Link
              href="/onboarding"
              className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-md"
            >
              <span>✨</span> Generate New Path
            </Link>
          </div>

          {paths?.length ? (
            <div className="mt-4 space-y-4">
              {paths.map((path: any) => {
                const field = Array.isArray(path.fields) ? path.fields[0] : path.fields;
                const stages = path.stages ?? [];
                const total = stages.length;
                const completed = stages.filter(
                  (s: any) => s.stage_progress?.[0]?.status === "completed"
                ).length;
                const inProgress = stages.filter(
                  (s: any) => s.stage_progress?.[0]?.status === "in_progress"
                ).length;
                const notStarted = total - completed - inProgress;
                const pathSegments = [
                  { label: "Done", value: completed, colorClass: "text-emerald-400" },
                  { label: "Active", value: inProgress, colorClass: "text-amber-400" },
                  { label: "To do", value: notStarted, colorClass: "text-slate-600" },
                ];
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <div
                    key={path.id}
                    className="glass-card glass-card-hover flex items-center justify-between gap-4 rounded-2xl p-5 border-slate-800"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <PieChart segments={pathSegments} size={56} strokeWidth={8} />
                      <Link href={`/paths/${path.id}`} className="min-w-0 flex-1 group">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white text-base group-hover:text-indigo-400 transition truncate">
                            {field?.name || "Learning Path"}
                          </h3>
                          <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/20 capitalize">
                            {path.skill_level}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {total > 0 ? `${completed} of ${total} stages completed (${pct}%)` : "No stages loaded"}
                        </p>
                        {total > 0 && (
                          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-900">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </Link>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Link
                        href={`/paths/${path.id}`}
                        className="rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:border-slate-600"
                      >
                        View Path →
                      </Link>
                      <DeletePathButton pathId={path.id} pathName={field?.name ?? "this path"} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card mt-4 rounded-3xl p-12 text-center border-slate-800">
              <span className="text-4xl">🗺️</span>
              <h3 className="mt-3 text-lg font-bold text-white">No learning paths created yet</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                Generate your first AI roadmap for Backend Engineering, Frontend, Cloud, or DevOps.
              </p>
              <Link
                href="/onboarding"
                className="btn-primary mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-semibold shadow-lg"
              >
                <span>✨</span> Generate Your First Roadmap
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
