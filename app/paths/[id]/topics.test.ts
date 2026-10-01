import {beforeEach,expect,it,vi} from "vitest";
const mock=vi.hoisted(()=>({from:vi.fn(),writes:[] as Record<string,unknown>[],reads:[] as unknown[],results:[] as unknown[],owned:true}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:"owner",user_metadata:{country_of_residence:"IN"}}}})},from:mock.from})}));
vi.mock("@/lib/supabase/service",()=>({createServiceClient:vi.fn()}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
import {saveTopicCompletion} from "./topics";
import {savePracticeNote} from "./actions";
const path="22222222-2222-4222-8222-222222222222",stage="11111111-1111-4111-8111-111111111111";
const result=(practice_check:unknown)=>({data:{practice_check},error:null});
beforeEach(()=>{
 mock.writes=[];mock.owned=true;mock.results=[];mock.reads=[result({description:"Challenge",user_submission:"Notes",owned_resource_ids:["course"]})];
 mock.from.mockImplementation((table:string)=>{
  let writing=false;
  const q={select:()=>q,eq:()=>q,is:()=>q,update:(value:Record<string,unknown>)=>{writing=true;mock.writes.push(value);return q;},insert:(value:Record<string,unknown>)=>{writing=true;mock.writes.push(value);return q;},
   maybeSingle:async()=>table==="stages"?{data:mock.owned?{id:stage,title:"HTTP and REST",description:"API design"}:null,error:null}:writing?(mock.results.shift()??{data:{stage_id:stage},error:null}):(mock.reads.shift()??result({})),
   single:async()=>mock.results.shift()??{data:{stage_id:stage},error:null}};
  return q;
 });
});
it("saves a topic without changing notes, ownership or stage status",async()=>{
 expect(await saveTopicCompletion(path,stage,"http",true)).toEqual({ok:true});
 expect(mock.writes[0]).toEqual({updated_at:expect.any(String),practice_check:{description:"Challenge",user_submission:"Notes",owned_resource_ids:["course"],topic_completion:{http:true}}});
});
it("rejects a topic not in the owned stage",async()=>{expect((await saveTopicCompletion(path,stage,"auth",true)).ok).toBe(false);expect(mock.writes).toHaveLength(0);});
it("rejects inaccessible stages",async()=>{mock.owned=false;expect((await saveTopicCompletion(path,stage,"http",true)).ok).toBe(false);expect(mock.writes).toHaveLength(0);});
it("merges a concurrent note edit after a comparison conflict",async()=>{
 mock.reads.push(result({user_submission:"New notes",topic_completion:{data:true},owned_resource_ids:["course"]}));mock.results.push({data:null,error:null});
 expect((await saveTopicCompletion(path,stage,"http",true)).ok).toBe(true);
 expect(mock.writes[1].practice_check).toEqual({user_submission:"New notes",topic_completion:{data:true,http:true},owned_resource_ids:["course"]});
});
it("retries a simultaneous initial progress insert",async()=>{
 mock.reads=[{data:null,error:null},result({user_submission:"Another tab"})];mock.results=[{data:null,error:{code:"23505"}}];
 expect((await saveTopicCompletion(path,stage,"http",true)).ok).toBe(true);
 expect(mock.writes[1].practice_check).toEqual({user_submission:"Another tab",topic_completion:{http:true}});
});
it("keeps a concurrent topic edit when saving a project note",async()=>{
 mock.reads.push(result({topic_completion:{http:true},owned_resource_ids:["course"]}));mock.results.push({data:null,error:null});
 const form=new FormData();form.set("pathId",path);form.set("stageId",stage);form.set("submissionNote","Updated notes");
 expect((await savePracticeNote(form)).ok).toBe(true);
 expect(mock.writes[1].practice_check).toEqual({topic_completion:{http:true},owned_resource_ids:["course"],user_submission:"Updated notes",submitted_at:expect.any(String)});
});
it("returns an inline error after repeated conflicts",async()=>{
 mock.results=Array.from({length:3},()=>({data:null,error:null}));
 expect((await saveTopicCompletion(path,stage,"http",true)).ok).toBe(false);expect(mock.writes).toHaveLength(3);
});
it("does not write after a failed progress read",async()=>{
 mock.reads=[{data:null,error:{message:"timeout"}}];expect((await saveTopicCompletion(path,stage,"http",true)).ok).toBe(false);expect(mock.writes).toHaveLength(0);
});
