"use client";
import { ActionButton } from "@/components/ActionButton";
import styles from "./Roadmap.module.css";
import { courseLink } from "@/lib/affiliates/links";

import { Money } from "@/components/CurrencyProvider";
import { providerName } from "@/lib/web-discovery/providers";
import { useState, useTransition, useEffect } from "react";
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
  const [openStage, setOpenStage] = useState<string | null>(() => stages.find(s => s.stage_progress?.[0]?.status === "in_progress")?.id ?? stages.find(s => s.stage_progress?.[0]?.status !== "completed")?.id ?? stages[0]?.id ?? null);
  const [activeFilter, setActiveFilter] = useState<StageFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNoteStageId, setEditingNoteStageId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [filterVersion, setFilterVersion] = useState(0);
  useEffect(() => {
    const navigate = (event: Event) => {
      const stageId = (event as CustomEvent<string>).detail;
      if (!stages.some(stage => stage.id === stageId)) return;
      setOpenStage(stageId);
      setActiveFilter("all"); setSearchQuery(""); setFilterVersion(value => value + 1);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const target = document.getElementById("stage-" + stageId);
        target?.scrollIntoView({behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block:"start"});
        target?.focus({preventScroll:true});
      }));
    };
    const followHash = () => { const id = window.location.hash.replace(/^#stage-/, ""); if (id) navigate(new CustomEvent("roadmap-navigate", {detail:id})); };
    window.addEventListener("roadmap-navigate", navigate);
    window.addEventListener("hashchange", followHash);
    return () => { window.removeEventListener("roadmap-navigate", navigate); window.removeEventListener("hashchange", followHash); };
  }, [stages]);

  const [progressError, setProgressError] = useState("");
  async function saveProgress(formData: FormData) {
    setProgressError("");
    try {
      await updateStageProgress(formData);
      if (formData.get("status") === "completed") {
        const index = stages.findIndex(stage => stage.id === formData.get("stageId"));
        const next = stages.slice(index + 1).find(stage => stage.stage_progress?.[0]?.status !== "completed");
        setOpenStage(next?.id ?? null);
        setActiveFilter("all"); setSearchQuery(""); setFilterVersion(v => v + 1);
        if (next) requestAnimationFrame(() => requestAnimationFrame(() => {
          const target = document.getElementById("stage-toggle-" + next.id);
          target?.focus({preventScroll:true});
          document.getElementById("stage-" + next.id)?.scrollIntoView({block:"start",behavior:"auto"});
        }));
      }
    } catch { setProgressError("Progress could not be saved. Please try again; your stage is still open."); }
  }
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
    <div className={styles.stageList + " space-y-6"}>
      {progressError && <p role="alert" className="rounded-xl border border-amber-500/40 p-3 text-sm text-amber-200">{progressError}</p>}
      <StageFilterBar key={filterVersion}
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
                tabIndex={-1}
                className={styles.stage + " rounded-2xl p-6"}
              >
                <h2 className={styles.accordionHeading}>
                  <button type="button" id={`stage-toggle-${stage.id}`} className={styles.stageToggle} aria-expanded={openStage === stage.id} aria-controls={`stage-panel-${stage.id}`} onClick={() => setOpenStage(current => current === stage.id ? null : stage.id)}>
                    <span className={styles.stageToggleTitle}><span className={styles.stageNumber}>Stage {String(stage.order_index + 1).padStart(2,"0")}</span>{stage.title}<span className={styles.stageMeta}>{timeline ? `Weeks ${timeline.startWeek}–${timeline.endWeek} · ` : ""}{stage.estimated_hours} hours · {STATUS_LABEL[status]}</span></span>
                    <span aria-hidden="true" className={styles.stageChevron}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m6 9 6 6 6-6"/></svg></span>
                  </button>
                </h2>
                <div id={`stage-panel-${stage.id}`} hidden={openStage !== stage.id} className={styles.stagePanel} role="region" aria-labelledby={`stage-toggle-${stage.id}`}>
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
                              className={styles.course + " flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border text-sm"}
                            >
                              <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {sr.is_primary && !isBroken && isValidLink && (
                                    <span className="shrink-0 rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-indigo-300 border border-indigo-500/30">
                                      Primary
                                    </span>
                                  )}
                                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
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

                {practiceCheck?.description && (
                  <section className={styles.practice} aria-labelledby={`practice-${stage.id}`}>
                    <div className={styles.practiceHeader}>
                      <span className={styles.practiceIcon} aria-hidden="true"><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/></svg></span>
                      <div><span className={styles.practiceEyebrow}>THE WORKSHOP · {String(stage.order_index + 1).padStart(2, "0")}</span><h3 id={`practice-${stage.id}`}>Put it into practice</h3></div>
                      {practiceCheck.user_submission && <span className={styles.savedNote}>✓ Notes saved</span>}
                    </div>
                    <div className={styles.practiceBrief}><span className={styles.practiceLabel}>Your challenge</span><p>{practiceCheck.description}</p></div>
                    {practiceCheck.user_submission && editingNoteStageId !== stage.id ? (
                      <div className={styles.practiceNotes}>
                        <div className={styles.notesHeading}><span className={styles.practiceLabel}>Your project notes</span><button type="button" onClick={() => setEditingNoteStageId(stage.id)}>Edit notes ↗</button></div>
                        <p className={styles.savedText}>{practiceCheck.user_submission}</p>
                      </div>
                    ) : (
                      <form action={(formData) => { startTransition(async () => { await savePracticeNote(formData); setEditingNoteStageId(null); }); }} className={styles.practiceNotes}>
                        <input type="hidden" name="stageId" value={stage.id} />
                        <input type="hidden" name="pathId" value={path.id} />
                        <label className={styles.practiceLabel} htmlFor={`project-note-${stage.id}`}>Your project notes</label>
                        <p className={styles.notesHint} id={`note-hint-${stage.id}`}>Capture what you built, what you learned, or a link to your work.</p>
                        <textarea id={`project-note-${stage.id}`} aria-describedby={`note-hint-${stage.id}`} name="submissionNote" rows={4} defaultValue={practiceCheck.user_submission ?? ""} placeholder="What did you try? What would you improve next?" className={styles.practiceInput} />
                        <div className={styles.notesFooter}><span>A small step. Something you can show.</span><button type="submit" disabled={isPending} className={styles.saveNote}><svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg>{isPending ? "Saving…" : "Save project notes"}</button></div>
                      </form>
                    )}
                  </section>
                )}

                {/* Stage Progress Action */}
                <div className="mt-5 flex items-center gap-3 border-t border-slate-800/80 pt-4">
                  {status !== "completed" && (
                    <form action={saveProgress}>
                      <input type="hidden" name="stageId" value={stage.id} />
                      <input type="hidden" name="pathId" value={path.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={status === "not_started" ? "in_progress" : "completed"}
                      />
                      <ActionButton
                        type="submit"
                        className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold shadow-md"
                      >
                        {status === "not_started" ? "Start This Stage" : "Mark Complete ✓"}
                      </ActionButton>
                    </form>
                  )}
                  {status !== "not_started" && (
                    <form action={saveProgress}>
                      <input type="hidden" name="stageId" value={stage.id} />
                      <input type="hidden" name="pathId" value={path.id} />
                      <input type="hidden" name="status" value="not_started" />
                      <ActionButton
                        type="submit"
                        className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
                      >
                        Reset Progress
                      </ActionButton>
                    </form>
                  )}
                </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
