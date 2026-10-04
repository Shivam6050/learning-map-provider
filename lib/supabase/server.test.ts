import "server-only";
vi.mock("server-only",()=>({}));
import { beforeEach, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({user:vi.fn(),assurance:vi.fn(),cookieSet:vi.fn()}));
vi.mock("next/navigation",()=>({redirect:(url:string)=>{throw new Error("redirect:"+url)}}));
vi.mock("next/headers",()=>({cookies:async()=>({getAll:()=>[],set:m.cookieSet}),headers:async()=>new Headers({"x-learningmap-path":"/settings"})}));
vi.mock("@supabase/ssr",()=>({createServerClient:()=>({auth:{getUser:m.user,mfa:{getAuthenticatorAssuranceLevel:m.assurance}}})}));
import {createClient} from "./server";
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL","https://qa.supabase.co");vi.stubEnv("SUPABASE_PUBLISHABLE_KEY","sb_publishable_test");m.user.mockResolvedValue({data:{user:{id:"owner",factors:[{status:"verified"}]}},error:null});m.assurance.mockResolvedValue({data:{currentLevel:"aal1"},error:null});});
it("blocks a lower-assurance session at the shared server entry",async()=>{
 const c=await createClient();await expect(c.auth.getUser()).rejects.toThrow("/auth/mfa?next=%2Fsettings");
});
it("requires an explicit bootstrap mode for the challenge",async()=>{
 const c=await createClient({allowMfaChallenge:true});expect((await c.auth.getUser()).data.user?.id).toBe("owner");expect(m.assurance).not.toHaveBeenCalled();
});
it("allows an independently verified AAL2 owner",async()=>{
 m.assurance.mockResolvedValue({data:{currentLevel:"aal2"},error:null});const c=await createClient();expect((await c.auth.getUser()).data.user?.id).toBe("owner");
});
