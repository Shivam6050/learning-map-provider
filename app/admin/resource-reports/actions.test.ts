vi.mock("server-only",()=>({}));
import {beforeEach,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({user:true,role:"admin",error:false}));
const rpc=vi.hoisted(()=>vi.fn(async()=>({error:state.error?{code:"40001"}:null})));
vi.mock("@/lib/supabase/service",()=>({createServiceClient:()=>({rpc})}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({from:()=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:{role:state.role},error:null})};return q;}})}));
vi.mock("@/lib/auth/learning-user",()=>({getLearningUser:async()=>({data:{user:state.user?{id:"verified-admin"}:null}})}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
import {reviewResourceReport} from "./actions";
const empty={ok:false,message:""};function form(){const f=new FormData();f.set("reportId","11111111-1111-4111-8111-111111111111");f.set("status","resolved");f.set("expectedStatus","open");f.set("resolution","Reviewed");return f;}
beforeEach(()=>{state.user=true;state.role="admin";state.error=false;rpc.mockClear();});
it("passes the verified admin into the review transaction",async()=>{expect((await reviewResourceReport(empty,form())).ok).toBe(true);expect(rpc).toHaveBeenCalledWith("review_resource_report",expect.objectContaining({p_user:"verified-admin",p_expected:"open",p_status:"resolved",p_reviewed_at:null}));});
it.each(["user","signed-out","invalid","long-note"])("rejects review when %s",async scenario=>{const f=form();if(scenario==="user")state.role="user";if(scenario==="signed-out")state.user=false;if(scenario==="invalid")f.set("status","make-admin");if(scenario==="long-note")f.set("resolution","x".repeat(501));expect((await reviewResourceReport(empty,f)).ok).toBe(false);expect(rpc).not.toHaveBeenCalled();});
it("returns a refresh instruction for a concurrent review",async()=>{state.error=true;const result=await reviewResourceReport(empty,form());expect(result.ok).toBe(false);expect(result.message).toContain("Refresh");});

it("preserves the exact review version in the compare-and-set request",async()=>{const f=form();f.set("expectedReviewedAt","2026-10-25T12:34:56.123456+00:00");expect((await reviewResourceReport(empty,f)).ok).toBe(true);expect(rpc).toHaveBeenCalledWith("review_resource_report",expect.objectContaining({p_reviewed_at:"2026-10-25T12:34:56.123456+00:00"}));});
it("rejects malformed review versions before calling the database",async()=>{const f=form();f.set("expectedReviewedAt","invalid");expect((await reviewResourceReport(empty,f)).ok).toBe(false);expect(rpc).not.toHaveBeenCalled();});
