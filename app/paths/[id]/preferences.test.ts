vi.mock("server-only",()=>({}));
import { beforeEach, expect, it, vi } from "vitest";
const state=vi.hoisted(()=>({user:true,owned:true,readError:false,saveError:false,conflict:false,current:{weekly_hours:17,budget_total:5000 as number|null},updates:[] as unknown[],filters:[] as unknown[]}));
vi.mock("@/lib/auth/learning-user",()=>({getLearningUser:async()=>({data:{user:state.user?{id:"owner"}:null}})}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({from:(table:string)=>{
 let writing=false;
 const q={select:()=>q,eq:(column:string,value:unknown)=>{state.filters.push([table,column,value]);return q;},is:(column:string,value:unknown)=>{state.filters.push([table,column,value]);return q;},update:(values:unknown)=>{writing=true;state.updates.push([table,values]);return q;},maybeSingle:async()=>writing?{data:state.conflict?null:{id:"path"},error:state.saveError?{message:"db"}:null}:{data:state.owned?state.current:null,error:state.readError?{message:"db"}:null}};
 return q;
}})}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
import { revalidatePath } from "next/cache";
import { updateRoadmapPreferences } from "./preferences";
const empty={ok:false,message:""};
const id="11111111-1111-4111-8111-111111111111";
function form(){const f=new FormData();for(const [key,value] of Object.entries({pathId:id,weeklyHours:"10",budgetTotal:"2500.50",previousWeeklyHours:"17",previousBudgetTotal:"5000"}))f.set(key,value);return f;}
beforeEach(()=>{state.user=true;state.owned=true;state.readError=false;state.saveError=false;state.conflict=false;state.current={weekly_hours:17,budget_total:5000};state.updates=[];state.filters=[];vi.mocked(revalidatePath).mockClear();});
it("changes only owner-scoped preferences and refreshes dashboard and roadmap",async()=>{
 expect((await updateRoadmapPreferences(empty,form())).ok).toBe(true);
 expect(state.updates).toEqual([["learning_paths",{weekly_hours:10,budget_total:2500.50}]]);
 expect(state.filters.filter((v)=>JSON.stringify(v)===JSON.stringify(["learning_paths","user_id","owner"]))).toHaveLength(2);
 expect(state.filters).toContainEqual(["learning_paths","weekly_hours",17]);
 expect(state.filters).toContainEqual(["learning_paths","budget_total",5000]);
 expect(revalidatePath).toHaveBeenCalledWith("/paths/"+id);expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
});
it.each(["signed-out","unowned","invalid","stale","read-failure"])("does not write when %s",async scenario=>{
 const f=form();if(scenario==="signed-out")state.user=false;if(scenario==="unowned")state.owned=false;if(scenario==="invalid")f.set("weeklyHours","81");if(scenario==="stale")state.current.weekly_hours=12;if(scenario==="read-failure")state.readError=true;
 expect((await updateRoadmapPreferences(empty,f)).ok).toBe(false);expect(state.updates).toEqual([]);expect(revalidatePath).not.toHaveBeenCalled();
});
it.each(["conflict","failure"])("does not report success on a concurrent change or failed write: %s",async scenario=>{
 state.conflict=scenario==="conflict";state.saveError=scenario==="failure";
 expect((await updateRoadmapPreferences(empty,form())).ok).toBe(false);expect(revalidatePath).not.toHaveBeenCalled();
});
it("supports older roadmaps with no saved budget",async()=>{state.current.budget_total=null;const f=form();f.set("previousBudgetTotal","0");expect((await updateRoadmapPreferences(empty,f)).ok).toBe(true);expect(state.filters).toContainEqual(["learning_paths","budget_total",null]);});
