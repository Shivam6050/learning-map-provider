import {afterEach, beforeEach, expect, it, vi} from "vitest";
const mocks=vi.hoisted(()=>({client:vi.fn(),send:vi.fn(),configured:vi.fn()}));
vi.mock("@/lib/supabase/service",()=>({createServiceClient:mocks.client}));
vi.mock("@/lib/email/send",()=>({sendEmail:mocks.send,emailDeliveryConfigured:mocks.configured}));
import {GET} from "./route";
const request=()=>new Request("https://example.com/api/cron/weekly-reminders",{headers:{authorization:"Bearer test-secret"}});
beforeEach(()=>{vi.stubEnv("CRON_SECRET","test-secret");mocks.configured.mockReturnValue(true);});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();vi.resetAllMocks();});
function setup(paths:unknown[],afterFetch?:()=>void){
 const query={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),order:vi.fn().mockReturnThis(),limit:vi.fn().mockReturnThis(),gt:vi.fn().mockReturnThis(),abortSignal:vi.fn(async()=>{afterFetch?.();return {data:paths,error:null};})};
 const delivery={insert:vi.fn(async()=>({error:null})),update:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),then:(resolve:(v:unknown)=>unknown)=>Promise.resolve({error:null}).then(resolve)};
 const checkpoint={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),maybeSingle:vi.fn(async()=>({data:null,error:null}))};
 const rpc=vi.fn(async()=>({error:null}));
 mocks.client.mockReturnValue({rpc,from:(table:string)=>table==="learning_paths"?query:table==="reminder_scan_cursor"?checkpoint:delivery,auth:{admin:{getUserById:vi.fn(async()=>({data:{user:{email:"test@example.com",email_confirmed_at:"2026-01-01",user_metadata:{}}},error:null}))}}});
 return query;
}
it("rejects unauthorized requests before querying users",async()=>{
 expect((await GET(new Request("https://example.com"))).status).toBe(401);expect(mocks.client).not.toHaveBeenCalled();
});
it("reports a fully scanned empty batch as complete",async()=>{
 setup([]);const response=await GET(request());expect(response.status).toBe(200);expect(await response.json()).toMatchObject({incomplete:false,sent:0});
});
it("reports timeout between full batches instead of false success",async()=>{
 let now=Date.parse("2026-10-01");vi.spyOn(Date,"now").mockImplementation(()=>now);
 const paths=Array.from({length:100},()=>({id:"path",stages:[]}));
 // The last skipped path consumes the remaining run budget.
 Object.defineProperty(paths[99],"stages",{get(){now+=46000;return [];}});
 setup(paths);const response=await GET(request());expect(response.status).toBe(503);expect(await response.json()).toMatchObject({incomplete:true});
});
it("reports uncertain delivery without retrying the email",async()=>{
 setup([{id:"path",user_id:"user",created_at:"2020-01-01",fields:{name:"React"},stages:[{stage_progress:[]}]}]);mocks.send.mockResolvedValue(false);
 const response=await GET(request());expect(response.status).toBe(503);expect(await response.json()).toMatchObject({sent:0,claimed:1,uncertain:1,incomplete:false});expect(mocks.send).toHaveBeenCalledTimes(1);
});


it("resumes after the persisted cursor",async()=>{
 const query=setup([]);const client=mocks.client();
 client.from("reminder_scan_cursor").maybeSingle.mockResolvedValue({data:{last_path_id:"previous",completed:false},error:null});
 expect((await GET(request())).status).toBe(200);
 expect(query.gt).toHaveBeenCalledWith("id","previous");
 expect(client.rpc).toHaveBeenCalledWith("advance_reminder_scan",expect.objectContaining({p_path:"previous",p_completed:true}));
});
it("does not repeat a completed weekly scan",async()=>{
 const query=setup([]);mocks.client().from("reminder_scan_cursor").maybeSingle.mockResolvedValue({data:{completed:true},error:null});
 expect((await GET(request())).status).toBe(200);expect(query.abortSignal).not.toHaveBeenCalled();
});
it("checkpoints skipped paths without sending",async()=>{
 setup([{id:"skipped",stages:[]}]);await GET(request());
 expect(mocks.client().rpc).toHaveBeenCalledWith("advance_reminder_scan",expect.objectContaining({p_path:"skipped",p_completed:false}));
 expect(mocks.send).not.toHaveBeenCalled();
});
