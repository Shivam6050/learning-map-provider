import { describe, it, expect } from "vitest";
import { savePath, retryPathWrite } from "./save-path";
import type { PathOption } from "@/lib/ai/build-options";
const option: PathOption = {id:"opt-1",name:"",tagline:"",total_cost:0,total_hours:20,stages:[0,1].map(i=>({order_index:i,title:"Stage",description:"",estimated_hours:10,practice_check:"Build a project",stage_resources:[{resource_id:"course-"+i,order_index:0,is_primary:true,resources:{title:"Scrimba",url:"https://scrimba.com/course",price:49,currency:"USD",platform:"article",resource_type:"course"}}]}))};
describe("resumable path saves",()=>{
 it("recovers from a timeout after commit, without duplicate rows or resetting progress",async()=>{
  const tables = new Map<string,Map<string,any>>(); let failed=false; let calls=0;
  const service={from:(table:string)=>({upsert:async(payload:any,config:any)=>{
    calls++; const rows=Array.isArray(payload)?payload:[payload]; const stored=tables.get(table)??new Map();tables.set(table,stored);
    for(const row of rows){const key=config.onConflict.split(",").map((column:string)=>row[column]).join(":");if(!stored.has(key))stored.set(key,row);}
    if(table==="stage_progress"&&!failed){failed=true;return{error:{message:"Gateway Timeout"},status:504};}
    return{error:null};
  }})};
  const id=await savePath(service,"user","set",{},option);
  expect(calls).toBe(5);expect(tables.get("stage_progress")?.size).toBe(2);
  const progress=[...tables.get("stage_progress")!.values()][0];progress.status="completed";
  expect(await savePath(service,"user","set",{},option)).toBe(id);
  expect(tables.get("learning_paths")?.size).toBe(1);expect(tables.get("stages")?.size).toBe(2);expect(progress.status).toBe("completed");
 });
 it("stops retrying permanent errors",async()=>{let calls=0;await expect(retryPathWrite(async()=>{calls++;return{error:{message:"Foreign key violation"},status:400}},async()=>{})).rejects.toThrow("Foreign key");expect(calls).toBe(1);});
 it("bounds retries during a prolonged outage",async()=>{let calls=0;await expect(retryPathWrite(async()=>{calls++;return{error:{message:"Gateway Timeout"},status:504}},async()=>{})).rejects.toThrow("Timeout");expect(calls).toBe(3);});
});
