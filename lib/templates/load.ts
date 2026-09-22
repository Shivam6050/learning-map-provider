import {createServiceClient} from "@/lib/supabase/service";
import {validTemplate} from "./validate";
import type {DiscoveredResource} from "@/lib/youtube/discover";
import {isSafeHttpUrl} from "@/lib/link-check/url-safety";
export async function loadRoadmapTemplate(field:string,level:string,currency:string) {
 try {
  const client=createServiceClient();
  const {data,error}=await client.from("roadmap_templates").select("field_slug,skill_level,version,valid_until,stages").eq("field_slug",field).eq("skill_level",level).eq("status","published").gt("valid_until",new Date().toISOString()).order("version",{ascending:false}).limit(1).maybeSingle();
  if(error || !validTemplate(data,field,level)) return null;
  const ids=[...new Set(data.stages.flatMap(s=>s.resource_ids))];
  const {data:rows,error:resourcesError}=await client.from("resources").select("*").in("id",ids);
  if(resourcesError || !rows) return null;
  const resources=new Map<string,DiscoveredResource>(rows.filter((r:DiscoveredResource)=>r.price===0 && r.trust_status!=="rejected" && r.link_status!=="broken" && isSafeHttpUrl(r.url)).map((r:DiscoveredResource)=>[r.id,{...r,currency}]));
  const stages=data.stages.map(stage=>({...stage,candidates:stage.resource_ids.flatMap(id=>{const resource=resources.get(id);return resource?[resource]:[]})}));
  if(stages.some(s=>!s.candidates.length)) return null;
  return {version:data.version,stages};
 } catch { return null; } // Missing migration, stale or unavailable template uses the existing pipeline.
}
