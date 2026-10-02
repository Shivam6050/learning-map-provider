import type {RoadmapStage} from "./stage";
import {courseLink} from "@/lib/affiliates/links";
type StageResource=RoadmapStage["stage_resources"][number];
function available(item:StageResource) {
 const resource=Array.isArray(item.resources)?item.resources[0]:item.resources;
 return Boolean(resource && resource.link_status!=="broken" && courseLink(resource.url).href);
}
export function resourceGuidance(items:StageResource[]) {
 const ordered=[...items].sort((a,b)=>a.order_index-b.order_index);
 const start=ordered.find(item=>item.is_primary&&available(item))??ordered.find(available);
 return {start,ordered:start?[start,...ordered.filter(item=>item!==start)]:ordered};
}
export function resourcePurpose(item:StageResource,start:StageResource|undefined):string {
 if(item===start)return "Start here";
 const resource=Array.isArray(item.resources)?item.resources[0]:item.resources;
 if(!resource)return "Resource";
 if(["docs","article","guide"].includes(resource.resource_type.toLowerCase()) || ["docs","mslearn","w3schools"].includes(resource.platform.toLowerCase()))return "Reference";
 return "Another way to learn";
}
