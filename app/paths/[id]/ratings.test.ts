import {beforeEach,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({rpc:vi.fn(),user:{id:"owner"} as {id:string}|null}));
vi.mock("@/lib/supabase/server",()=>({createClient:vi.fn(async()=>({}))}));
vi.mock("@/lib/auth/learning-user",()=>({getLearningUser:vi.fn(async()=>({data:{user:mocks.user}}))}));
vi.mock("@/lib/supabase/service",()=>({createServiceClient:()=>({rpc:mocks.rpc})}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("next/navigation",()=>({redirect:()=>{throw new Error("Sign in");}}));
import {rateResource} from "./actions";
const path="22222222-2222-4222-8222-222222222222",resource="11111111-1111-4111-8111-111111111111";
function form(rating="4"){const f=new FormData();f.set("pathId",path);f.set("resourceId",resource);f.set("rating",rating);return f;}
beforeEach(()=>{vi.clearAllMocks();mocks.user={id:"owner"};mocks.rpc.mockResolvedValue({error:null});});
it("uses the session identity and one atomic database call",async()=>{const f=form();f.set("userId","attacker");await rateResource(f);expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("save_roadmap_rating",{p_user:"owner",p_path:path,p_resource:resource,p_rating:4});});
it.each(["0","6","2.5","NaN"])("rejects invalid rating %s before writes",async rating=>{await expect(rateResource(form(rating))).rejects.toThrow();expect(mocks.rpc).not.toHaveBeenCalled();});
it("rejects malformed resource IDs",async()=>{const f=form();f.set("resourceId","bad");await expect(rateResource(f)).rejects.toThrow();expect(mocks.rpc).not.toHaveBeenCalled();});
it("does not expose database errors or silently accept denied membership",async()=>{mocks.rpc.mockResolvedValue({error:{message:"private SQL detail"}});await expect(rateResource(form())).rejects.toThrow("Could not save this rating");});
it("requires a signed in user",async()=>{mocks.user=null;await expect(rateResource(form())).rejects.toThrow("Sign in");expect(mocks.rpc).not.toHaveBeenCalled();});
