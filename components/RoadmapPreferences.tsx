"use client";
import { useActionState, useState } from "react";
import { updateRoadmapPreferences } from "@/app/paths/[id]/preferences";
import { parseRoadmapPreferences } from "@/lib/paths/preferences";
import { computeStageTimeline } from "@/lib/paths/timeline";
import {libraryOwnedIds,type LearningAccess} from "@/lib/learning-access";
import { pathCost } from "@/lib/pricing/path-cost";
import { Money } from "./CurrencyProvider";
import styles from "./RoadmapPreferences.module.css";

type CostStage = Parameters<typeof pathCost>[0][number] & { id: string; completed: boolean };
export function RoadmapPreferences({ pathId, weeklyHours, budgetTotal, currency, stages, library = [], libraryAsOf }: {
  pathId: string; weeklyHours: number; budgetTotal: number; currency: string; stages: CostStage[]; library?:LearningAccess[]; libraryAsOf?:string;
}) {
  const [hours, setHours] = useState(String(weeklyHours));
  const [budget, setBudget] = useState(String(budgetTotal));
  const [state, action, pending] = useActionState(updateRoadmapPreferences, { ok: false, message: "" });
  const parsed = parseRoadmapPreferences(hours, budget);
  const weeks = parsed ? computeStageTimeline(stages, parsed.weeklyHours).totalWeeks : null;
  const remaining = stages.filter(stage => !stage.completed).reduce((sum, stage) => sum + stage.estimated_hours, 0);
  const ownedIds=libraryOwnedIds(stages.map(stage=>({estimated_hours:stage.estimated_hours,stage_progress:[{status:stage.completed?'completed':'not_started'}],stage_resources:stage.resources.map(resource=>({resources:{id:resource.id??'',url:resource.url}}))})),library,parsed?.weeklyHours??weeklyHours,libraryAsOf?new Date(libraryAsOf):new Date());
  const planned: CostStage[]=stages.map(stage=>({...stage,resources:stage.resources.map(resource=>({...resource,signals:{...resource.signals,already_owned:resource.signals?.library_access?resource.signals?.roadmap_owned===true||ownedIds.has(resource.id??''):Boolean(resource.signals?.already_owned)||ownedIds.has(resource.id??'')}}))}));
  const estimate = parsed ? pathCost(planned, parsed.weeklyHours).total : null;
  const unknown = planned.some(stage => stage.resources.some(resource => resource.link_status !== "broken" && resource.signals?.price_unverified && !resource.signals?.already_owned));
  return <details className={styles.panel}>
    <summary><span><strong>Make room for your learning</strong><small>Adjust your weekly pace and planning budget</small></span><span className={styles.edit}>Adjust roadmap <span aria-hidden="true">↗</span></span></summary>
    <form action={action} className={styles.form}>
      <p className={styles.intro}>Your life can change. Your progress stays. Adjust these preferences without regenerating your roadmap.</p>
      <input type="hidden" name="pathId" value={pathId} />
      <input type="hidden" name="previousWeeklyHours" value={weeklyHours} />
      <input type="hidden" name="previousBudgetTotal" value={budgetTotal} />
      <div className={styles.fields}>
        <label htmlFor="roadmap-weekly-hours">Hours per week<input id="roadmap-weekly-hours" name="weeklyHours" type="number" min="1" max="80" step="1" required disabled={pending} value={hours} onChange={event => setHours(event.target.value)} /></label>
        <label htmlFor="roadmap-budget">Planning budget ({currency})<input id="roadmap-budget" name="budgetTotal" type="number" min="0" max="100000" step="0.01" required disabled={pending} value={budget} onChange={event => setBudget(event.target.value)} /></label>
      </div>
      <div className={styles.preview} aria-live="polite" aria-atomic="true">
        {parsed && weeks !== null ? <><strong>{remaining > 0 ? `${Math.ceil(remaining / parsed.weeklyHours)} weeks of remaining study` : "Every stage completed"}</strong><span>{weeks} weeks for the full roadmap · {parsed.weeklyHours} hours / week</span><span>New purchases estimate: {unknown ? "Some prices need confirmation" : <Money amount={estimate ?? 0} currency={currency} />}</span>{estimate !== null && estimate > parsed.budgetTotal && <p>Your existing courses exceed this budget by {<Money amount={estimate - parsed.budgetTotal} currency={currency} />}{unknown ? " or more" : ""}. Saving does not replace courses or make a purchase.</p>}</> : <span>Enter valid weekly hours and a budget to preview your plan.</span>}
      </div>
      <p className={styles.note}>The budget is saved in {currency}. Existing courses stay in place; changing the budget does not find new courses. Library access is counted only while it covers the updated study period. Future calendar exports use the saved pace. Events already imported into a calendar are not updated—review or remove the old schedule before importing again.</p>
      {state.message && <p role={state.ok ? "status" : "alert"} className={state.ok ? styles.success : styles.error}>{state.message}</p>}
      <button type="submit" disabled={pending || !parsed} aria-busy={pending}>{pending ? "Saving preferences…" : "Save roadmap preferences"}</button>
    </form>
  </details>;
}
