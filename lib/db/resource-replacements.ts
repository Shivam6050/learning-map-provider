import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BASE_SEED_RESOURCES, matchTopicHint } from "@/lib/ai/seed-resources";
import { createServiceClient } from "@/lib/supabase/service";
import { currentQuote } from "@/lib/pricing/current-quote";
import { isSafeHttpUrl } from "@/lib/link-check/url-safety";
import type { RoadmapStage } from "@/lib/paths/stage";
import type { DiscoveredResource } from "@/lib/youtube/discover";

export async function resourceContext(client: SupabaseClient,userId: string,pathId: string,stageId: string,resourceId: string) {
 const {data:path,error}=await client.from("learning_paths").select("id,weekly_hours,budget_total,currency,fields(slug)").eq("id",pathId).eq("user_id",userId).maybeSingle();
 if(error||!path)throw new Error("This roadmap is unavailable.");
 const {data:stages,error:stageError}=await client.from("stages").select("id,title,description,estimated_hours,order_index,stage_resources(order_index,is_primary,resources(*)),stage_progress(status,completed_at,practice_check)").eq("path_id",pathId).order("order_index").returns<RoadmapStage[]>();
 if(stageError||!stages)throw new Error("Could not load your learning stages.");
 const stage=stages.find(item=>item.id===stageId);
 if(!stage||!stage.stage_resources.some(item=>item.resources?.id===resourceId))throw new Error("This resource changed. Refresh the roadmap before trying again.");
 const field=Array.isArray(path.fields)?path.fields[0]:path.fields;
 return {path,stages,stage,fieldSlug:field?.slug};
}

export function matchingSeeds(stage: Pick<RoadmapStage,"title"|"description">,fieldSlug?: string) {
 const text=stage.title+" "+(stage.description??"");
 const ranked=BASE_SEED_RESOURCES.filter(seed=>(!seed.field_slug||seed.field_slug===fieldSlug)&&isSafeHttpUrl(seed.url))
  .map(seed=>({seed,score:seed.topic_hints.filter(hint=>matchTopicHint(text,hint)).length})).filter(item=>item.score>0).sort((a,b)=>b.score-a.score);
 const chosen=[...ranked.filter(item=>item.seed.price===0).slice(0,4),...ranked.filter(item=>item.seed.price>0).slice(0,3)].map(item=>item.seed);
 return [...new Map(chosen.map(seed=>[seed.url,seed])).values()];
}

export async function replacementPool(context: Awaited<ReturnType<typeof resourceContext>>,userId: string,stageId: string) {
 const service=createServiceClient();
 const seeds=matchingSeeds(context.stage,context.fieldSlug);
 const {data:history}=await service.from("roadmap_resource_changes").select("previous_resource_id").eq("user_id",userId).eq("stage_id",stageId).order("created_at",{ascending:false}).limit(4);
 const previousIds=[...new Set((history??[]).map(item=>item.previous_resource_id as string))];
 // Populate only missing rows from the fixed, reviewed URL pool. Do not overwrite shared catalog data.
 if(seeds.length){
  const {error}=await service.from("resources").upsert(seeds.map(seed=>({title:seed.title,url:seed.url,platform:seed.platform,resource_type:seed.resource_type,price:0,currency:seed.currency,trust_status:"allowlisted",signals:seed.price>0?{price_unverified:true}:{}})),{onConflict:"url",ignoreDuplicates:true});
  if(error)throw new Error("The course catalog could not be loaded.");
 }
 const [seedRows,historyRows]=await Promise.all([
  seeds.length?service.from("resources").select("*").in("url",seeds.map(seed=>seed.url)):Promise.resolve({data:[],error:null}),
  previousIds.length?service.from("resources").select("*").in("id",previousIds):Promise.resolve({data:[],error:null}),
 ]);
 if(seedRows.error||historyRows.error)throw new Error("The course catalog could not be loaded.");
 const linked=new Set(context.stage.stage_resources.map(item=>item.resources.id));
 const candidates=[...new Map([...(historyRows.data??[]),...(seedRows.data??[])].map(row=>[row.id,row as DiscoveredResource])).values()]
  .filter(row=>!linked.has(row.id)&&row.trust_status==="allowlisted"&&row.link_status!=="broken"&&isSafeHttpUrl(row.url)).slice(0,8);
 return {candidates,previousIds};
}

export async function refreshPathQuotes(stages: RoadmapStage[],currency: string,country: string): Promise<RoadmapStage[]> {
 const unique=[...new Map(stages.flatMap(stage=>stage.stage_resources.map(item=>[item.resources.id,item.resources] as const))).values()];
 const quotes=await Promise.all(unique.map(async (resource): Promise<DiscoveredResource>=>{
  if(resource.link_status==="broken"||!isSafeHttpUrl(resource.url))return {...resource,signals:{...resource.signals,price_unverified:true}};
  if(resource.price>0||resource.signals?.price_unverified||resource.signals?.price_source==="scrimba_monthly"||resource.signals?.price_source==="scrimba_regional_plan"){
   const quote=await currentQuote(resource.url,currency,country);
   return quote && typeof quote.price === "number" && Number.isFinite(quote.price) && quote.price >= 0 ?{...resource,price:quote.price,currency,signals:{...resource.signals,...quote.signals,price_unverified:false}}:{...resource,currency,signals:{...resource.signals,price_unverified:true}};
  }
  return {...resource,price:0,currency};
 }));
 const byId=new Map(quotes.map(resource=>[resource.id,resource]));
 return stages.map(stage=>({...stage,stage_resources:stage.stage_resources.map(item=>({...item,resources:byId.get(item.resources.id)!}))}));
}
