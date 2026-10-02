import { describe, it, expect } from "vitest";
import { savePath, retryPathWrite, pathSaveId } from "./save-path";
import type { PathOption } from "@/lib/ai/build-options";
const option: PathOption = {id:"opt-1",name:"",tagline:"",total_cost:0,total_hours:20,stages:[0,1].map(i=>({order_index:i,title:"Stage",description:"",estimated_hours:10,practice_check:"Build a project",stage_resources:[{resource_id:"course-"+i,order_index:0,is_primary:true,resources:{title:"Scrimba",url:"https://scrimba.com/course",price:49,currency:"USD",platform:"article",resource_type:"course"}}]}))};
describe("resumable path saves",()=>{
 it("retries the identical transaction after an uncertain commit",async()=>{
  const payloads: Record<string, unknown>[] = [];
  const service={rpc:async(name:string,args:Record<string,unknown>)=>{
    expect(name).toBe("save_learning_path"); payloads.push(args);
    return payloads.length===1 ? {error:{message:"Gateway Timeout"},status:504} : {error:null};
  }};
  const settings={field_id:"field",skill_level:"beginner",weekly_hours:5,budget_total:50,currency:"USD"};
  const id=await savePath(service,"user","set",settings,option);
  expect(id).toBe(pathSaveId("user","set",option));
  expect(payloads).toHaveLength(2); expect(payloads[0]).toEqual(payloads[1]);
  expect(payloads[0].p_stages).toHaveLength(2);
  expect(await savePath(service,"user","set",settings,option)).toBe(id);
 });
 it("stops retrying permanent errors",async()=>{let calls=0;await expect(retryPathWrite(async()=>{calls++;return{error:{message:"Foreign key violation"},status:400}},async()=>{})).rejects.toThrow("Foreign key");expect(calls).toBe(1);});
 it("bounds retries during a prolonged outage",async()=>{let calls=0;await expect(retryPathWrite(async()=>{calls++;return{error:{message:"Gateway Timeout"},status:504}},async()=>{})).rejects.toThrow("Timeout");expect(calls).toBe(3);});
});

it("scopes saved-path lookup identities to the owner and selection",()=>{
 const id=pathSaveId("user","set",option);
 expect(pathSaveId("other","set",option)).not.toBe(id);
 expect(pathSaveId("user","other",option)).not.toBe(id);
 expect(pathSaveId("user","set",{...option,id:"opt-2"})).not.toBe(id);
 const changed=structuredClone(option);
 changed.stages[0].stage_resources[0].resource_id="other-course";
 expect(pathSaveId("user","set",changed)).not.toBe(id);
});
it("keeps retry identity stable when quote amounts change",()=>{
 const changed=structuredClone(option);
 changed.stages[0].stage_resources[0].resources.price=500;
 expect(pathSaveId("user","set",changed)).toBe(pathSaveId("user","set",option));
});

it("persists self-reported ownership in user stage data",async()=>{
 const owned=structuredClone(option);owned.stages[0].stage_resources[0].owned=true;
 let payload:Record<string,unknown>={};
 await savePath({rpc:async(_name,args)=>{payload=args;return {error:null};}},"user","set",{field_id:"f",skill_level:"beginner",weekly_hours:5,budget_total:50,currency:"USD"},owned);
 expect(payload.p_progress).toEqual(expect.arrayContaining([expect.objectContaining({practice_check:{description:"Build a project",owned_resource_ids:["course-0"]}})]));
});

it("persists the curated identity and version alongside existing practice data",async()=>{
 const curated=structuredClone(option);curated.stages[0].title="SQL & Relational Database Modeling";
 let payload:Record<string,unknown>={};
 await savePath({rpc:async(_name,args)=>{payload=args;return{error:null};}},"user","set",{field_id:"f",skill_level:"beginner",weekly_hours:5,budget_total:50,currency:"USD"},curated);
 expect(payload.p_progress).toEqual(expect.arrayContaining([expect.objectContaining({practice_check:expect.objectContaining({description:"Build a project",curriculum_ref:{id:expect.any(String),version:1}})})]));
});
