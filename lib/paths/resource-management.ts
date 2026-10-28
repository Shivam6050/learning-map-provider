import type { RoadmapStage } from "./stage";
import type { DiscoveredResource } from "@/lib/youtube/discover";
import { pathCost } from "@/lib/pricing/path-cost";

export const REPORT_REASONS = {
 broken_link: "Broken or unavailable link",
 wrong_price: "Incorrect price or billing period",
 outdated_content: "Outdated course content",
 difficulty_mismatch: "Difficulty does not match this stage",
 other: "Another resource problem",
} as const;
export type ReportReason = keyof typeof REPORT_REASONS;
export type ResourceActionState = { ok: boolean; message: string };
export type ReplacementOption = {
 id: string; title: string; url: string; price: number; currency: string;
 priceUnknown: boolean; billingInterval?: string; plannedCost: number; ownedCost: number;
 totalUnknown: boolean; ownedTotalUnknown: boolean; requiresOwnership: boolean; alreadyOwned: boolean; libraryOwned?: boolean; previouslyUsed: boolean;
};
export type ReplacementOptionsState = ResourceActionState & { options: ReplacementOption[]; currency?: string; budget?: number };
export function reportReason(value: unknown): value is ReportReason {
 return typeof value === "string" && Object.hasOwn(REPORT_REASONS,value);
}
export function replacementPlan(stages: RoadmapStage[],stageId: string,previousId: string,replacement: DiscoveredResource,owned: boolean,weeklyHours: number,budget: number,libraryIds: ReadonlySet<string> = new Set()) {
 const ownedIds = new Set(stages.flatMap(stage=>stage.stage_progress?.[0]?.practice_check?.owned_resource_ids ?? []));
 for(const id of libraryIds)ownedIds.add(id);
 if(owned) ownedIds.add(replacement.id);
 const planned = stages.map(stage=>({estimated_hours:stage.estimated_hours,resources:stage.stage_resources.map(item=>{
  const res=stage.id===stageId && item.resources.id===previousId ? replacement : item.resources;
  const signals: Record<string,unknown>={...res.signals,already_owned:ownedIds.has(res.id)};
  return {...res,signals};
 })}));
 const cost=pathCost(planned,weeklyHours).total;
 const unknown=planned.some(stage=>stage.resources.some(res=>res.signals?.price_unverified && !res.signals?.already_owned && res.link_status!=="broken"));
 const alreadyOwned=ownedIds.has(replacement.id);
 const free=!replacement.signals?.price_unverified && replacement.price===0;
 return {cost,unknown,alreadyOwned,requiresOwnership:!alreadyOwned&&!free&&(Boolean(replacement.signals?.price_unverified)||unknown||cost>budget)};
}

export type ResourceReportSummary={id:string;reason:ReportReason;status:string;resolution:string;created_at:string};
export type ResourceReportsState=ResourceActionState & {reports:ResourceReportSummary[]};
