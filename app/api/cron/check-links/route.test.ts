import {afterEach,beforeEach,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({from:vi.fn(),verify:vi.fn(),due:[] as {id:string;url:string;platform:string}[],time:0}));
vi.mock("@/lib/supabase/service",()=>({createServiceClient:()=>({from:m.from})}));
vi.mock("@/lib/link-check/verify-resources",()=>({verifyResourceLinks:m.verify}));
vi.mock("@/lib/monitoring/log-error",()=>({logError:vi.fn()}));
import {GET} from "./route";
beforeEach(()=>{
 vi.stubEnv("CRON_SECRET","test");vi.stubEnv("MAX_LINK_CHECKS_PER_RUN","1000");m.time=0;vi.spyOn(Date,"now").mockImplementation(()=>m.time);
 m.due=Array.from({length:230},(_,i)=>({id:String(i),url:"https://example.com/"+i,platform:"docs"}));
 m.from.mockImplementation(()=>{
 let counting=false,filtered=false,limit=50;
 const q={select:(_s:string,options?:unknown)=>{counting=Boolean(options);return q;},or:()=>{filtered=true;return q;},order:()=>q,limit:(n:number)=>{limit=n;return q;},abortSignal:async()=>counting?{count:filtered?m.due.length:230,error:null}:{data:m.due.slice(0,limit),error:null}};return q;
 });
 m.verify.mockImplementation(async(rows:typeof m.due)=>{m.due.splice(0,rows.length);return rows.map(r=>({id:r.id,status:"ok",alive:true}));});
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();vi.clearAllMocks();});
const request=()=>new Request("https://example.com/api/cron/check-links",{headers:{authorization:"Bearer test"}});
it("processes more than the old 100-resource ceiling and reports backlog",async()=>{const response=await GET(request());expect(await response.json()).toMatchObject({checked:230,remaining:0,incomplete:false,capacityWarning:false});expect(m.verify).toHaveBeenCalledTimes(5);});
it("stops at the configured cap and retains outstanding work",async()=>{vi.stubEnv("MAX_LINK_CHECKS_PER_RUN","10");const response=await GET(request());expect(await response.json()).toMatchObject({checked:10,remaining:220,incomplete:true,capacityWarning:true});});
it("stops scheduling new batches after the time budget",async()=>{m.verify.mockImplementation(async(rows:typeof m.due)=>{m.time=41000;m.due.splice(0,rows.length);return rows.map(r=>({id:r.id,status:"unknown",alive:false}));});expect(await (await GET(request())).json()).toMatchObject({checked:50,unknown:50,remaining:180,incomplete:true});});
it("does not expose database details when queries fail",async()=>{m.from.mockImplementation(()=>({select:()=>({abortSignal:async()=>({error:{message:"private database failure"}})})}));expect(await (await GET(request())).json()).toMatchObject({error:"Link maintenance could not finish",incomplete:true});});
it("rejects unauthenticated cron requests without work",async()=>{expect((await GET(new Request("https://example.com"))).status).toBe(401);expect(m.from).not.toHaveBeenCalled();});
