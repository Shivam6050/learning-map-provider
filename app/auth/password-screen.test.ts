import { beforeEach, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({screen:vi.fn(),signup:vi.fn(),update:vi.fn(),user:vi.fn()}));
vi.mock("@/lib/auth/breached-password",()=>({screenPassword:m.screen,passwordScreenMessage:(r:string)=>r==="breached"?"Choose a different password":"Safety check unavailable"}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({auth:{signUp:m.signup,updateUser:m.update,getUser:m.user}})}));
vi.mock("next/navigation",()=>({redirect:(url:string)=>{throw new Error("redirect:"+url)}}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("next/headers",()=>({cookies:async()=>({set:vi.fn()})}));
import {signup,updatePasswordAfterReset} from "./actions";
beforeEach(()=>{vi.resetAllMocks();m.screen.mockResolvedValue("safe");m.signup.mockResolvedValue({error:null});m.update.mockResolvedValue({error:null});m.user.mockResolvedValue({data:{user:{id:"owner"}},error:null});vi.stubEnv("AUTH_MOBILE_VERIFICATION_ENABLED","false");});
function form(){const f=new FormData();for(const[k,v]of Object.entries({email:"qa@example.invalid",password:"test-completed-password",displayName:"QA",country:"IN",acceptTerms:"on"}))f.set(k,v);return f;}
it.each(["breached","unavailable"])("blocks signup for %s before contacting Auth",async state=>{
 m.screen.mockResolvedValue(state);await expect(signup(form())).rejects.toThrow("redirect:/signup?error=");expect(m.signup).not.toHaveBeenCalled();
});
it.each(["breached","unavailable"])("blocks password replacement for %s before updating Auth",async state=>{
 m.screen.mockResolvedValue(state);await expect(updatePasswordAfterReset(form())).rejects.toThrow("redirect:/reset-password?error=");expect(m.update).not.toHaveBeenCalled();
});
it("screens signup and accepts a safe password",async()=>{
 await expect(signup(form())).rejects.toThrow("Check your email");expect(m.screen).toHaveBeenCalledWith("test-completed-password");expect(m.signup).toHaveBeenCalledOnce();
});
it("does not screen a password-reset request without an authenticated recovery session",async()=>{
 m.user.mockResolvedValue({data:{user:null},error:null});await expect(updatePasswordAfterReset(form())).rejects.toThrow("redirect:/login");expect(m.screen).not.toHaveBeenCalled();
});
