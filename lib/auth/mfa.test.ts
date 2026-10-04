import { expect, it, vi } from "vitest";
import type { SupabaseClient, User } from "@supabase/supabase-js";
vi.mock("next/navigation",()=>({redirect:(url:string)=>{throw new Error("redirect:"+url)}}));
import { needsMfa, enforceMfa, mfaDestination } from "./mfa";
const user={id:"owner",factors:[{id:"factor",status:"verified",factor_type:"totp"}]} as User;
function client(level:string|null,error:unknown=null){return {auth:{mfa:{getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:level},error})}}} as unknown as SupabaseClient;}
it("does not impose MFA on accounts without a verified factor",async()=>{
 const c={auth:{mfa:{getAuthenticatorAssuranceLevel:vi.fn()}}} as unknown as SupabaseClient;
 expect(await needsMfa(c,{id:"owner",user_metadata:{mfa:true},factors:[{status:"unverified"}]} as unknown as User)).toBe(false);
 expect(c.auth.mfa.getAuthenticatorAssuranceLevel).not.toHaveBeenCalled();
});
it.each(["aal1",null])("blocks enrolled accounts at %s",async level=>expect(await needsMfa(client(level),user)).toBe(true));
it("permits a server-verified AAL2 session",async()=>expect(await needsMfa(client("aal2"),user)).toBe(false));
it("fails closed when assurance checking is unavailable",async()=>expect(await needsMfa(client("aal2",{message:"down"}),user)).toBe(true));
it("preserves a safe return destination in the challenge",async()=>{
 await expect(enforceMfa(client("aal1"),user,"/paths/path#stage-2")).rejects.toThrow("redirect:/auth/mfa?next=%2Fpaths%2Fpath%23stage-2");
});
it.each(["https://evil.example","//evil.example","/auth/mfa?next=bad","/login","/signup"])("rejects unsafe destinations and sign-in loops: %s",next=>expect(mfaDestination(next)).toBe("/dashboard"));

it("fails closed on unexpected assurance network exceptions",async()=>{
 const c={auth:{mfa:{getAuthenticatorAssuranceLevel:vi.fn().mockRejectedValue(new Error("offline"))}}} as unknown as SupabaseClient;
 expect(await needsMfa(c,user)).toBe(true);
});
