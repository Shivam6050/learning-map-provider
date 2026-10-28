"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getLearningUser } from "@/lib/auth/learning-user";
import { requireUuid } from "@/lib/security/validation";
import { resourceContext,replacementPool,refreshPathQuotes } from "@/lib/db/resource-replacements";
import {loadLearningAccess} from "@/lib/db/learning-access";
import {libraryOwnedIds} from "@/lib/learning-access";
import type {RoadmapStage} from "@/lib/paths/stage";
import type {DiscoveredResource} from "@/lib/youtube/discover";
import { prepareCandidates } from "@/lib/link-check/prepare-candidates";
import { reportReason,replacementPlan,type ResourceActionState,type ReplacementOptionsState,type ResourceReportsState } from "@/lib/paths/resource-management";

function proposedStages(stages:RoadmapStage[],stageId:string,previousId:string,replacement:DiscoveredResource){
 return stages.map(stage=>({...stage,stage_resources:stage.stage_resources.map(item=>({...item,resources:stage.id===stageId&&item.resources.id===previousId?replacement:item.resources}))}));
}
function identifiers(form: FormData) {
 return {pathId:requireUuid(String(form.get("pathId"))),stageId:requireUuid(String(form.get("stageId"))),resourceId:requireUuid(String(form.get("resourceId")))};
}
export async function loadResourceReplacements(form: FormData): Promise<ReplacementOptionsState> {
 let ids: ReturnType<typeof identifiers>;
 try{ids=identifiers(form);}catch{return {ok:false,message:"This resource is unavailable.",options:[]};}
 const client=await createClient();const {data:{user}}=await getLearningUser(client,`/paths/${ids.pathId}`);
 if(!user)return {ok:false,message:"Sign in again before changing your roadmap.",options:[]};
 try{
  const context=await resourceContext(client,user.id,ids.pathId,ids.stageId,ids.resourceId);
  const {data:allowed,error:limitError}=await createServiceClient().rpc("reserve_resource_lookup",{p_user:user.id});
  if(limitError)return {ok:false,message:"Resource changes are temporarily unavailable. Please try again shortly.",options:[]};
  if(!allowed)return {ok:false,message:"The course lookup limit was reached. Please try again in ten minutes.",options:[]};
  const {candidates,previousIds}=await replacementPool(context,user.id,ids.stageId);
  const country=String(user.user_metadata?.country_of_residence??"");
  const [verified,stages]=await Promise.all([prepareCandidates(candidates,context.path.currency,country),refreshPathQuotes(context.stages,context.path.currency,country)]);
  const library=await loadLearningAccess(client,user.id);
  const options=verified.map(resource=>{
   const libraryIds=libraryOwnedIds(proposedStages(stages,ids.stageId,ids.resourceId,resource),library.entries,context.path.weekly_hours);
   const normal=replacementPlan(stages,ids.stageId,ids.resourceId,resource,false,context.path.weekly_hours,Number(context.path.budget_total??0),libraryIds);
   const owned=replacementPlan(stages,ids.stageId,ids.resourceId,resource,true,context.path.weekly_hours,Number(context.path.budget_total??0),libraryIds);
   return {id:resource.id,title:resource.title,url:resource.url,price:resource.price,currency:context.path.currency,priceUnknown:Boolean(resource.signals?.price_unverified),billingInterval:typeof resource.signals?.billing_interval==="string"?resource.signals.billing_interval:undefined,plannedCost:normal.cost,ownedCost:owned.cost,totalUnknown:normal.unknown,ownedTotalUnknown:owned.unknown,requiresOwnership:normal.requiresOwnership,alreadyOwned:normal.alreadyOwned,libraryOwned:libraryIds.has(resource.id),previouslyUsed:previousIds.includes(resource.id)};
  });
  return {ok:true,message:options.length?"Prices and availability checked. Choose a resource to preview the change.":"No verified alternatives match this stage right now. Keep your current resource or try again later.",options,currency:context.path.currency,budget:Number(context.path.budget_total??0)};
 }catch{return {ok:false,message:"Alternatives are temporarily unavailable. Your roadmap has not changed.",options:[]};}
}

export async function replaceRoadmapResource(_previous: ResourceActionState,form: FormData): Promise<ResourceActionState> {
 let ids: ReturnType<typeof identifiers>, replacementId: string;
 try{ids=identifiers(form);replacementId=requireUuid(String(form.get("replacementId")));}catch{return {ok:false,message:"Choose a valid replacement."};}
 const client=await createClient();const {data:{user}}=await getLearningUser(client,`/paths/${ids.pathId}`);
 if(!user)return {ok:false,message:"Your session expired. Sign in again before saving."};
 try{
  const context=await resourceContext(client,user.id,ids.pathId,ids.stageId,ids.resourceId);
  const {data:allowed,error:limitError}=await createServiceClient().rpc("reserve_resource_lookup",{p_user:user.id});
  if(limitError)return {ok:false,message:"Resource changes are temporarily unavailable. Please try again shortly."};
  if(!allowed)return {ok:false,message:"The course lookup limit was reached. Please try again in ten minutes."};
  const {candidates}=await replacementPool(context,user.id,ids.stageId);
  const selected=candidates.find(resource=>resource.id===replacementId);
  if(!selected)return {ok:false,message:"That resource is not an available alternative for this stage. Refresh the alternatives."};
  const country=String(user.user_metadata?.country_of_residence??"");
  const [verified,stages]=await Promise.all([prepareCandidates([selected],context.path.currency,country),refreshPathQuotes(context.stages,context.path.currency,country)]);
  if(!verified[0])return {ok:false,message:"This replacement could not be verified. Choose another resource."};
  const owned=form.get("alreadyOwned")==="on";
  const library=await loadLearningAccess(client,user.id);
  const libraryIds=libraryOwnedIds(proposedStages(stages,ids.stageId,ids.resourceId,verified[0]),library.entries,context.path.weekly_hours);
  const plan=replacementPlan(stages,ids.stageId,ids.resourceId,verified[0],owned,context.path.weekly_hours,Number(context.path.budget_total??0),libraryIds);
  if(plan.requiresOwnership)return {ok:false,message:"The price is unverified or exceeds your budget. Only include this paid course if you already have access."};
  const {error}=await createServiceClient().rpc("replace_roadmap_resource",{p_user:user.id,p_path:ids.pathId,p_stage:ids.stageId,p_previous:ids.resourceId,p_replacement:replacementId,p_owned:owned||stages.some(stage=>stage.stage_progress?.[0]?.practice_check?.owned_resource_ids?.includes(replacementId)),p_weekly_hours:context.path.weekly_hours,p_budget:Number(context.path.budget_total??0),p_currency:context.path.currency});
  if(error)return {ok:false,message:error.code==="54000"?"You can make up to 30 resource changes in 24 hours. Try again later.":"The resource could not be changed. Refresh your roadmap before retrying."};
 }catch{return {ok:false,message:"The change could not be saved. Your learning progress is preserved; please retry."};}
 revalidatePath(`/paths/${ids.pathId}`);revalidatePath("/dashboard");
 return {ok:true,message:"Resource replaced. Your notes, milestones and completion progress are preserved."};
}

export async function submitResourceReport(_previous: ResourceActionState,form: FormData): Promise<ResourceActionState> {
 let ids: ReturnType<typeof identifiers>;
 try{ids=identifiers(form);}catch{return {ok:false,message:"This resource is unavailable."};}
 const reason=form.get("reason"),details=form.get("details");
 if(!reportReason(reason)||typeof details!=="string"||details.trim().length>1000)return {ok:false,message:"Choose a report reason and keep details within 1,000 characters."};
 const client=await createClient();const {data:{user}}=await getLearningUser(client,`/paths/${ids.pathId}`);
 if(!user)return {ok:false,message:"Sign in again before submitting a report."};
 try{
  const {data,error}=await createServiceClient().rpc("submit_resource_report",{p_user:user.id,p_path:ids.pathId,p_stage:ids.stageId,p_resource:ids.resourceId,p_reason:reason,p_details:details.trim()});
  if(error)return {ok:false,message:error.code==="54000"?"You can submit up to 20 reports in 24 hours. Please try again later.":"The report could not be saved. Please refresh and try again."};
  return {ok:true,message:data?"Report received. An administrator can review it; your roadmap is unchanged.":"You have already reported this issue for this resource. It is available in the review queue."};
 }catch{return {ok:false,message:"Reporting is temporarily unavailable. Your message is still here; please retry."};}
}

export async function loadResourceReports(form: FormData): Promise<ResourceReportsState> {
 let ids:ReturnType<typeof identifiers>;try{ids=identifiers(form);}catch{return {ok:false,message:"This resource is unavailable.",reports:[]};}
 const client=await createClient();const {data:{user}}=await getLearningUser(client,`/paths/${ids.pathId}`);
 if(!user)return {ok:false,message:"Sign in again to see your reports.",reports:[]};
 try{
  await resourceContext(client,user.id,ids.pathId,ids.stageId,ids.resourceId);
  const {data,error}=await client.from("resource_reports").select("id,reason,status,resolution,created_at").eq("user_id",user.id).eq("stage_id",ids.stageId).eq("resource_id",ids.resourceId).order("created_at",{ascending:false}).limit(5);
  if(error)return {ok:false,message:"Your reports could not be loaded. Please retry.",reports:[]};
  return {ok:true,message:data?.length?"Your most recent reports for this resource.":"You have no reports for this resource.",reports:data??[]};
 }catch{return {ok:false,message:"Your reports are temporarily unavailable.",reports:[]};}
}
