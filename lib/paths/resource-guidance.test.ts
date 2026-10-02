import {expect,it} from "vitest";
import type {RoadmapStage} from "./stage";
import {resourceGuidance,resourcePurpose} from "./resource-guidance";
type Item=RoadmapStage["stage_resources"][number];
function item(order_index:number,is_primary=false,url="https://example.com/learn",link_status="unchecked"):Item {
 return {order_index,is_primary,resources:{id:String(order_index),title:"Resource",url,platform:"scrimba",resource_type:"course",price:0,currency:"USD",signals:{price_unverified:true},trust_status:"approved",rating:null,link_status}};
}
it("puts the usable primary first without mutating saved order",()=>{const a=item(0),b=item(1,true);const original=[a,b];const result=resourceGuidance(original);expect(result.start).toBe(b);expect(result.ordered).toEqual([b,a]);expect(original).toEqual([a,b]);});
it("falls back past broken and unsafe primary links",()=>{const broken=item(0,true,undefined,"broken"),unsafe=item(1,true,"javascript:alert(1)"),valid=item(2);expect(resourceGuidance([broken,unsafe,valid]).start).toBe(valid);});
it("does not pretend unavailable links are recommendations",()=>{expect(resourceGuidance([item(0,true,undefined,"broken")]).start).toBeUndefined();});
it("labels supporting docs and alternatives without making price claims",()=>{const start=item(0,true),docs=item(1),alternative=item(2);docs.resources.resource_type="docs";expect(resourcePurpose(start,start)).toBe("Start here");expect(resourcePurpose(docs,start)).toBe("Reference");expect(resourcePurpose(alternative,start)).toBe("Another way to learn");});
