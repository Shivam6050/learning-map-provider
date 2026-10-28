import {afterEach,beforeEach,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({from:vi.fn(),verify:vi.fn(),due:[] as {id:string;url:string;platform:string}[],time:0,initFailure:false}));
vi.mock("@/lib/supabase/service",()=>({createServiceClient:()=>{if(m.initFailure)throw new Error("private credentials");return {from:m.from};}}));
vi.mock("@/lib/link-check/verify-resources",async importOriginal=>({...await importOriginal<typeof import("@/lib/link-check/verify-resources")>(),verifyResourceLinks:m.verify}));
vi.mock("@/lib/monitoring/log-error",()=>({logError:vi.fn()}));
import {GET} from "./route";
import {LinkCheckPersistenceError} from "@/lib/link-check/verify-resources";
import {logError} from "@/lib/monitoring/log-error";
beforeEach(()=>{
 vi.stubEnv("CRON_SECRET","test");vi.stubEnv("MAX_LINK_CHECKS_PER_RUN","1000");m.time=0;m.initFailure=false;vi.spyOn(Date,"now").mockImplementation(()=>m.time);
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

it("reports only confirmed progress after a partially saved batch",async()=>{
 m.verify.mockRejectedValue(new LinkCheckPersistenceError([{id:"saved",alive:false,status:"broken"},{id:"unknown",alive:false,status:"unknown"}],3));
 const response=await GET(request());expect(response.status).toBe(503);
 expect(await response.json()).toMatchObject({checked:2,broken:1,unknown:1,failed:3,incomplete:true,reason:"resource_persistence"});
 expect(response.headers.get("cache-control")).toContain("no-store");expect(m.verify).toHaveBeenCalledTimes(1);
});
it("keeps successful earlier batches in partial progress totals",async()=>{
 m.verify.mockImplementationOnce(async(rows:typeof m.due)=>{m.due.splice(0,rows.length);return rows.map(r=>({id:r.id,status:"ok",alive:true}));})
 .mockRejectedValueOnce(new LinkCheckPersistenceError([{id:"partial",alive:false,status:"broken"}],4));
 const response=await GET(request());expect(response.status).toBe(503);
 expect(await response.json()).toMatchObject({checked:51,broken:1,failed:4,incomplete:true});
});
it("does not treat unavailable counts as zero backlog",async()=>{
 m.from.mockImplementation(()=>({select:()=>({abortSignal:async()=>({error:null,count:null})})}));
 const response=await GET(request());expect(response.status).toBe(503);expect(await response.json()).toMatchObject({reason:"resource_count"});expect(m.verify).not.toHaveBeenCalled();
});
it("sanitizes thrown failures before forwarding to monitoring",async()=>{
 m.verify.mockRejectedValue(new Error("private recipient@example.com https://private.test?token=secret"));
 const response=await GET(request());expect(response.status).toBe(503);
 expect(await response.text()).not.toMatch(/recipient|private.test|token=/);
 expect(vi.mocked(logError).mock.calls.at(-1)?.[1]).toEqual(new Error("Link maintenance failed during resource_verification"));
});

it("catches service initialization failures",async()=>{
 m.initFailure=true;const response=await GET(request());expect(response.status).toBe(503);
 expect(await response.json()).toMatchObject({reason:"configuration",checked:0,incomplete:true});expect(m.from).not.toHaveBeenCalled();
});
it("does not invent zero remaining work when the final count is unavailable",async()=>{
 m.due=[];let counts=0;
 m.from.mockImplementation(()=>{
  let counting=false;
  const q={select:(_s:string,options?:unknown)=>{counting=Boolean(options);return q;},or:()=>q,order:()=>q,limit:()=>q,abortSignal:async()=>counting?{count:++counts===1?0:null,error:null}:{data:[],error:null}};return q;
 });
 const response=await GET(request());expect(response.status).toBe(503);
 expect(await response.json()).toMatchObject({reason:"backlog_count",incomplete:true});
});
