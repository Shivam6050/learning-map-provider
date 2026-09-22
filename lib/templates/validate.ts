import type { SkeletonStage } from "@/lib/ai/skeleton";
export type TemplateStage=SkeletonStage & {resource_ids:string[];practice_check:string};
export type RoadmapTemplate={field_slug:string;skill_level:string;version:number;valid_until:string;stages:TemplateStage[]};
export function validTemplate(value:unknown,field:string,level:string,now=Date.now()):value is RoadmapTemplate {
 const t=value as RoadmapTemplate;
 return Boolean(t && t.field_slug===field && t.skill_level===level && Number.isInteger(t.version) && t.version>0 && Date.parse(t.valid_until)>now && Array.isArray(t.stages) && t.stages.length>0 && t.stages.length<=12 && t.stages.every((s,i)=>
  s && typeof s==="object" && s.order_index===i && typeof s.title==="string" && s.title.length>0 && typeof s.description==="string" && s.description.length>0 && Number.isFinite(s.estimated_hours) && s.estimated_hours>0 && s.estimated_hours<=1000 && Array.isArray(s.search_topics) && s.search_topics.length>0 && s.search_topics.every(x=>typeof x==="string" && x.length>0) && typeof s.practice_check==="string" && s.practice_check.length>0 && Array.isArray(s.resource_ids) && s.resource_ids.length>0 && s.resource_ids.every(id=>typeof id==="string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))));
}
