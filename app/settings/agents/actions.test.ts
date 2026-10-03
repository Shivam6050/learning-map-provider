import {beforeEach,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({user:vi.fn(),rpc:vi.fn(),service:vi.fn(),update:vi.fn(),eq:vi.fn(),is:vi.fn(),select:vi.fn(),revalidate:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({auth:{getUser:mocks.user}})}));
vi.mock("@/lib/supabase/service",()=>({createServiceClient:mocks.service}));
vi.mock("next/cache",()=>({revalidatePath:mocks.revalidate}));
import {createAgentKey,revokeAgentKey} from "./actions";
import {hashAgentKey} from "@/lib/agents/keys";
function form(extra:Record<string,string|undefined>={}){const f=new FormData();for(const [k,v]of Object.entries({label:"My research assistant",consent:"on",...extra}))if(typeof v === "string") f.set(k,v);return f;}
beforeEach(()=>{vi.clearAllMocks();mocks.user.mockResolvedValue({data:{user:{id:"owner",email_confirmed_at:"2026-01-01"}},error:null});mocks.rpc.mockResolvedValue({data:"new-id",error:null});mocks.select.mockResolvedValue({data:[{id:"key"}],error:null});mocks.is.mockReturnValue({select:mocks.select});mocks.eq.mockReturnValue({eq:mocks.eq,is:mocks.is});mocks.update.mockReturnValue({eq:mocks.eq});mocks.service.mockReturnValue({rpc:mocks.rpc,from:()=>({update:mocks.update})});});
it("shows the key once and sends only its hash and verified owner to the database",async()=>{
 const state=await createAgentKey({},form({userId:"attacker"}));expect(state.key).toMatch(/^lm_agent_/);expect(mocks.rpc).toHaveBeenCalledWith("create_agent_access_key",{p_user:"owner",p_label:"My research assistant",p_hash:hashAgentKey(state.key!)});
});
it.each([{consent:""},{label:""},{label:"x".repeat(81)},{label:"bad\nlabel"}])("rejects invalid or unapproved requests before issuing a credential: %j",async extra=>{
 const state=await createAgentKey({},form(extra));expect(state.error).toBeTruthy();expect(state.key).toBeUndefined();expect(mocks.rpc).not.toHaveBeenCalled();
});
it.each([null,{id:"owner",email_confirmed_at:null},{id:"owner",email_confirmed_at:"yes",is_anonymous:true}])("requires a verified signed-in owner",async user=>{
 mocks.user.mockResolvedValue({data:{user},error:null});expect((await createAgentKey({},form())).error).toBeTruthy();expect(mocks.service).not.toHaveBeenCalled();
});
it("never returns a key when creation or the quota check fails",async()=>{
 mocks.rpc.mockResolvedValue({error:{code:"P0001",message:"internal"},data:null});const state=await createAgentKey({},form());expect(state.error).toContain("five active");expect(state.key).toBeUndefined();
});
it("revokes only a key belonging to the signed-in user",async()=>{
 const state=await revokeAgentKey({},form({keyId:"11111111-1111-1111-1111-111111111111",userId:"attacker"}));expect(state.message).toContain("revoked");expect(mocks.eq).toHaveBeenCalledWith("user_id","owner");
});
it("does not report success for another owner's or missing key",async()=>{
 mocks.select.mockResolvedValue({data:[],error:null});expect((await revokeAgentKey({},form({keyId:"11111111-1111-1111-1111-111111111111"}))).error).toBeTruthy();
});

it("does not issue or revoke credentials when session validation fails",async()=>{
 mocks.user.mockRejectedValue(new Error("Upstream detail"));
 expect((await createAgentKey({},form())).error).toBeTruthy();
 expect((await revokeAgentKey({},form({keyId:"11111111-1111-1111-1111-111111111111"}))).error).toBeTruthy();
 expect(mocks.service).not.toHaveBeenCalled();
});
