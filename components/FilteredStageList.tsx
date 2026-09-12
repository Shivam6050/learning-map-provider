"use client";
import { courseLink } from "@/lib/affiliates/links";

import { Money } from "@/components/CurrencyProvider";
import { providerName } from "@/lib/web-discovery/providers";
import { useState, useTransition } from "react";
import { StageFilterBar, type StageFilter } from "@/components/StageFilterBar";
import { updateStageProgress, rateResource, savePracticeNote } from "@/app/paths/[id]/actions";
import { isSafeHttpUrl, ensureHttpUrl } from "@/lib/link-check/url-safety";

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

export function FilteredStageList({
  stages,
  stageTimeline,
  path,
  myRatingByResource,
}: {
  stages: any[];
  stageTimeline: Record<string, { startWeek: number; endWeek: number }>;
  path: any;
  myRatingByResource: Record<string, number>;
}) {
  const [activeFilter, setActiveFilter] = useState<StageFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNoteStageId, setEditingNoteStageId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const counts = {
    all: stages.length,
    in_progress: stages.filter((s) => (s.stage_progress?.[0]?.status ?? "not_started") === "in_progress").length,
    completed: stages.filter((s) => s.stage_progress?.[0]?.status === "completed").length,
    not_started: stages.filter((s) => (s.stage_progress?.[0]?.status ?? "not_started") === "not_started").length,
  };

  const filteredStages = stages.filter((stage) => {
    const status = stage.stage_progress?.[0]?.status ?? "not_started";
    if (activeFilter !== "all" && status !== activeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = stage.title.toLowerCase().includes(q);
      const matchDesc = stage.description?.toLowerCase().includes(q);
      const matchResources = stage.stage_resources?.some((sr: any) =>
        (sr.resources?.title ?? "").toLowerCase().includes(q)
      );
      return matchTitle || matchDesc || matchResources;
    }
    return true;
  });

  return (
    <div className="mt-8 space-y-6">
      <StageFilterBar
        onFilterChange={setActiveFilter}
        onSearchChange={setSearchQuery}
        counts={counts}
      />

      {filteredStages.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center text-sm text-slate-400 border-slate-800">
          No stages match your selected filter or search query.
        </div>
      ) : (
        <ol className="space-y-6">
          {filteredStages.map((stage: any) => {
            const progress = stage.stage_progress?.[0];
            const status = progress?.status ?? "not_started";
            const timeline = stageTimeline[stage.id];
            const practiceCheck = progress?.practice_check as
              | { description?: string; user_submission?: string; submitted_at?: string }
              | undefined;

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
                      Curated Learning Resources
                    </h4>
                    <ul className="space-y-2.5">
                      {stage.stage_resources
                        .sort((a: any, b: any) => a.order_index - b.order_index)
                        .map((sr: any, i: number) => {
                          const resource = Array.isArray(sr.resources) ? sr.resources[0] : sr.resources;
                          if (!resource) return null;
                          const isBroken = resource.link_status === "broken";
                          const outgoing = courseLink(resource.url || "", resource.signals?.affiliate === true);
                          const safeUrl = outgoing.href;
                          const isValidLink = safeUrl.length > 0 && isSafeHttpUrl(safeUrl);
                          
                          const p = (resource.platform || "").toLowerCase();
                          const t = (resource.resource_type || "").toLowerCase();
                          let icon = "📰";
                          let label = resource.platform || "Guide";
                          let action = "Read Guide";
                          if (p === "youtube" || t === "video") {
                            icon = "🎥"; label = "YouTube"; action = "Watch Video";
                          } else if (p === "udemy" || p === "coursera" || t === "course") {
                            icon = "🎓"; label = p === "udemy" ? "Udemy" : providerName(resource.url); action = "Open Course";
                          } else if (p === "docs" || p === "mslearn" || t === "docs") {
                            icon = "📄"; label = "Docs"; action = "Read Docs";
                          }

                          return (
                            <li
                              key={i}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 text-sm hover:border-indigo-500/30 transition"
                            >
                              <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {sr.is_primary && !isBroken && isValidLink && (
                                    <span className="shrink-0 rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-indigo-300 border border-indigo-500/30">
                                      Primary
                                    </span>
                                  )}
                                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                    <span>{icon}</span>
                                    <span className="capitalize">{label}</span>
                                  </span>
                                </div>
                                {isBroken || !isValidLink ? (
                                  <span className="flex items-center gap-2 text-slate-500 text-xs">
                                    <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-red-300 border border-red-500/30">
                                      {isBroken ? "Unavailable" : "Blocked"}
                                    </span>
                                    <span className="line-through">{resource.title}</span>
                                  </span>
                                ) : (
                                  <a
                                    href={safeUrl}
                                    target="_blank"
                                    rel={outgoing.affiliate ? "sponsored noopener noreferrer" : "noopener noreferrer"}
                                    className="font-bold text-sm text-indigo-300 hover:text-white transition hover:underline truncate"
                                  >
                                    {resource.title}
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                <span className="text-xs text-slate-400 font-medium">
                                  <Money amount={resource.price} currency={resource.currency ?? path.currency} freeLabel />{resource.signals?.price_source === "scrimba_monthly" ? " / month · renews until cancelled" : ""}
                                  {resource.rating ? ` · ★ ${Number(resource.rating).toFixed(1)}` : ""}
                                </span>
                                {isValidLink && !isBroken && (
                                  <a
                                    href={safeUrl}
                                    target="_blank"
                                    rel={outgoing.affiliate ? "sponsored noopener noreferrer" : "noopener noreferrer"}
                                    className="rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 shadow-sm transition flex items-center gap-1 shrink-0"
                                  >
                                    <span>{action}</span>
                                    <span className="text-[10px]">↗</span>
                                  </a>
                                )}
                              </div>
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
                      const myRating = myRatingByResource[resource.id];
                      return (
                        <form
                          key={resource.id}
                          action={rateResource}
                          className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/40 rounded-lg px-2.5 py-1 border border-slate-800"
                        >
                          <input type="hidden" name="resourceId" value={resource.id} />
                          <input type="hidden" name="pathId" value={path.id} />
                          <span className="max-w-[8rem] truncate font-medium text-slate-300">
                            {resource.title}:
                          </span>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="submit"
                              name="rating"
                              value={n}
                              className={
                                n <= (myRating ?? 0)
                                  ? "text-amber-400 text-sm"
                                  : "text-slate-600 hover:text-amber-400 text-sm"
                              }
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

                {/* Practice Check & Learner Task Submission Card */}
                {practiceCheck?.description && (
                  <div className="mt-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 uppercase tracking-wider">
                        ⚡ Practice Check Task
                      </span>
                      {practiceCheck.user_submission && (
                        <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                          ✓ Notes Saved
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed font-medium">{practiceCheck.description}</p>

                    {/* Learner Submission Note Display / Edit */}
                    {practiceCheck.user_submission && editingNoteStageId !== stage.id ? (
                      <div className="rounded-xl border border-amber-500/20 bg-slate-950/80 p-3 text-slate-300">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            Your Notes / Submission Proof:
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingNoteStageId(stage.id)}
                            className="text-[10px] text-indigo-300 hover:underline"
                          >
                            ✏️ Edit Notes
                          </button>
                        </div>
                        <p className="text-xs whitespace-pre-wrap font-mono">{practiceCheck.user_submission}</p>
                      </div>
                    ) : (
                      <form
                        action={(formData) => {
                          startTransition(async () => {
                            await savePracticeNote(formData);
                            setEditingNoteStageId(null);
                          });
                        }}
                        className="space-y-2 mt-2"
                      >
                        <input type="hidden" name="stageId" value={stage.id} />
                        <input type="hidden" name="pathId" value={path.id} />
                        <textarea
                          name="submissionNote"
                          rows={2}
                          defaultValue={practiceCheck.user_submission ?? ""}
                          placeholder="Paste github repo URL or write your project notes here..."
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                        />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-amber-500 shadow-md"
                        >
                          {isPending ? "Saving..." : "Save My Notes / Submission"}
                        </button>
                      </form>
                    )}
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
  );
}
