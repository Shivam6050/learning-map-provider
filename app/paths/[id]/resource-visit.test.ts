import {beforeEach,expect,it,vi} from "vitest";
const mock=vi.hoisted(()=>({from:vi.fn(),writes:[] as Record<string,unknown>[],reads:[] as unknown[],results:[] as unknown[],owned:true,linked:true,broken:false}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:"owner",user_metadata:{country_of_residence:"IN"}}}})},from:mock.from})}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
import {saveResourceVisit} from "./resource-visit";
const path="22222222-2222-4222-8222-222222222222",stage="11111111-1111-4111-8111-111111111111",resource="33333333-3333-4333-8333-333333333333";
const result=(practice_check:unknown)=>({data:{practice_check},error:null});
beforeEach(()=>{
 mock.writes=[];mock.results=[];mock.owned=true;mock.linked=true;mock.broken=false;mock.reads=[result({user_submission:"Notes",topic_completion:{http:true},milestone_completion:{build:true}})];
 mock.from.mockImplementation((table:string)=>{
  let writing=false;
  const q={select:()=>q,eq:()=>q,is:()=>q,update:(value:Record<string,unknown>)=>{writing=true;mock.writes.push(value);return q;},insert:(value:Record<string,unknown>)=>{writing=true;mock.writes.push(value);return q;},
   maybeSingle:async()=>table==="stages"?{data:mock.owned?{id:stage}:null,error:null}:table==="stage_resources"?{data:mock.linked?{resources:{url:"https://www.w3schools.com/sql/",link_status:mock.broken?"broken":"ok"}}:null,error:null}:writing?(mock.results.shift()??{data:{stage_id:stage},error:null}):(mock.reads.shift()??result({})),
   single:async()=>mock.results.shift()??{data:{stage_id:stage},error:null}};return q;
 });
});
it("persists a resource visit without changing notes, topics, milestones or stage status",async()=>{expect((await saveResourceVisit(path,stage,resource)).ok).toBe(true);expect(mock.writes[0]).toEqual({updated_at:expect.any(String),practice_check:{user_submission:"Notes",topic_completion:{http:true},milestone_completion:{build:true},resource_visit:{resource_id:resource,opened_at:expect.any(String)}}});});
it("rejects another owner's stage",async()=>{mock.owned=false;expect((await saveResourceVisit(path,stage,resource)).ok).toBe(false);expect(mock.writes).toHaveLength(0);});
it("rejects a resource not linked to that stage",async()=>{mock.linked=false;expect((await saveResourceVisit(path,stage,resource)).ok).toBe(false);expect(mock.writes).toHaveLength(0);});
it("rejects known broken resources",async()=>{mock.broken=true;expect((await saveResourceVisit(path,stage,resource)).ok).toBe(false);expect(mock.writes).toHaveLength(0);});
it("merges concurrent note changes",async()=>{mock.reads.push(result({user_submission:"Latest notes"}));mock.results.push({data:null,error:null});expect((await saveResourceVisit(path,stage,resource)).ok).toBe(true);expect(mock.writes[1].practice_check).toEqual({user_submission:"Latest notes",resource_visit:{resource_id:resource,opened_at:expect.any(String)}});});
it("reports database failure instead of claiming the visit synced",async()=>{mock.results=[{data:null,error:{message:"timeout"}}];expect((await saveResourceVisit(path,stage,resource)).ok).toBe(false);});

it("does not let an older request replace a newer resource visit",async()=>{mock.reads=[result({resource_visit:{resource_id:"newer-resource",opened_at:"2099-01-01T00:00:00Z"}})];expect((await saveResourceVisit(path,stage,resource)).ok).toBe(true);expect(mock.writes).toHaveLength(0);});
