import { expect,it } from "vitest";
import { replacementPlan,reportReason } from "./resource-management";
import type { DiscoveredResource } from "@/lib/youtube/discover";
import type { RoadmapStage } from "./stage";
const resource=(id:string,price=0,signals:Record<string,unknown>={}):DiscoveredResource=>({id,title:id,url:"https://example.com/"+id,price,currency:"USD",platform:"docs",resource_type:"docs",signals,link_status:"ok",trust_status:"allowlisted",rating:null});
const stage=(id:string,resources:DiscoveredResource[]):RoadmapStage=>({id,title:id,description:"SQL queries",estimated_hours:20,order_index:0,stage_resources:resources.map((resources,i)=>({resources,order_index:i,is_primary:i===0})),stage_progress:[{status:"completed",completed_at:"2026-10-01",practice_check:{user_submission:"Keep notes",topic_completion:{query:true},milestone_completion:{project:true}}}]});
it("replaces only the chosen slot without modifying the input or progress",()=>{
 const stages=[stage("one",[resource("old",50),resource("reference")]),stage("two",[resource("other",20)])];const before=JSON.stringify(stages);
 expect(replacementPlan(stages,"one","old",resource("new",25),false,10,100)).toMatchObject({cost:45,unknown:false,requiresOwnership:false});expect(JSON.stringify(stages)).toBe(before);
});
it("requires access confirmation for over-budget and unverified paid options",()=>{
 const stages=[stage("one",[resource("old")])];
 expect(replacementPlan(stages,"one","old",resource("new",101),false,10,100).requiresOwnership).toBe(true);
 expect(replacementPlan(stages,"one","old",resource("unknown",0,{price_unverified:true}),false,10,100)).toMatchObject({unknown:true,requiresOwnership:true});
 expect(replacementPlan(stages,"one","old",resource("unknown",0,{price_unverified:true}),true,10,100)).toMatchObject({cost:0,unknown:false,requiresOwnership:false});
});
it("allows a free replacement even if another resource needs price confirmation",()=>{
 const stages=[stage("one",[resource("old"),resource("unknown",0,{price_unverified:true})])];
 expect(replacementPlan(stages,"one","old",resource("free"),false,10,100)).toMatchObject({unknown:true,requiresOwnership:false});
 expect(replacementPlan(stages,"one","old",resource("paid",10),false,10,100).requiresOwnership).toBe(true);
});
it("counts confirmed access across duplicate resources but never trusts shared ownership signals",()=>{
 const stages=[stage("one",[resource("old")]),stage("two",[resource("new",70,{already_owned:true})])];
 expect(replacementPlan(stages,"one","old",resource("new",70),false,10,100).cost).toBe(70);
 expect(replacementPlan(stages,"one","old",resource("new",70),true,10,100)).toMatchObject({cost:0,alreadyOwned:true});
 stages[1].stage_progress[0].practice_check!.owned_resource_ids=["new"];
 expect(replacementPlan(stages,"one","old",resource("new",70),false,10,100)).toMatchObject({cost:0,alreadyOwned:true});
});
it("does not count a broken resource as a new purchase",()=>{const broken={...resource("broken",500),link_status:"broken"};expect(replacementPlan([stage("one",[resource("old"),broken])],"one","old",resource("free"),false,10,100).cost).toBe(0);});
it.each(["broken_link","wrong_price","outdated_content","difficulty_mismatch","other"])("accepts report reason %s",value=>expect(reportReason(value)).toBe(true));
it.each(["__proto__","constructor","spam",null,{},""])("rejects unsupported report reason %s",value=>expect(reportReason(value)).toBe(false));
