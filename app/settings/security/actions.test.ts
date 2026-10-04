import { beforeEach, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({create:vi.fn(),user:vi.fn(),enroll:vi.fn(),verify:vi.fn(),unenroll:vi.fn(),refresh:vi.fn(),assurance:vi.fn(),revalidate:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createClient:m.create}));
vi.mock("next/navigation",()=>({redirect:(url:string)=>{throw new Error("redirect:"+url)}}));
vi.mock("next/cache",()=>({revalidatePath:m.revalidate}));
import { startAuthenticator, confirmAuthenticator, verifyAuthenticator, removeAuthenticator, cancelAuthenticator } from "./actions";
const own="11111111-1111-1111-1111-111111111111",other="22222222-2222-2222-2222-222222222222";
function form(values:Record<string,string>){const f=new FormData();for(const[k,v]of Object.entries(values))f.set(k,v);return f;}
beforeEach(()=>{
 vi.clearAllMocks();
 m.create.mockResolvedValue({auth:{getUser:m.user,mfa:{enroll:m.enroll,challengeAndVerify:m.verify,unenroll:m.unenroll,getAuthenticatorAssuranceLevel:m.assurance},refreshSession:m.refresh}});
 m.user.mockResolvedValue({data:{user:{id:"owner",email_confirmed_at:"today",factors:[]}},error:null});
 m.enroll.mockResolvedValue({data:{id:own,totp:{qr_code:"<svg/>",secret:"PRIVATE-SETUP"}},error:null});
 m.verify.mockResolvedValue({error:null});m.unenroll.mockResolvedValue({error:null});m.refresh.mockResolvedValue({error:null});
 m.assurance.mockResolvedValue({data:{currentLevel:"aal2"},error:null});
});
it("starts only a pending enrollment and does not enable it before verification",async()=>{
 const state=await startAuthenticator({},form({label:"My phone"}));
 expect(state.setup?.id).toBe(own);expect(m.enroll).toHaveBeenCalledWith({factorType:"totp",friendlyName:"My phone",issuer:"LearningMap"});expect(m.verify).not.toHaveBeenCalled();
});
it("never trusts a submitted foreign factor",async()=>{
 m.user.mockResolvedValue({data:{user:{id:"owner",email_confirmed_at:"today",factors:[{id:own,factor_type:"totp",status:"unverified"}]}},error:null});
 expect((await confirmAuthenticator({},form({factorId:other,code:"123456"}))).error).toContain("unavailable");
 expect(m.verify).not.toHaveBeenCalled();
});
it("keeps MFA disabled when the setup code is rejected",async()=>{
 m.user.mockResolvedValue({data:{user:{id:"owner",email_confirmed_at:"today",factors:[{id:own,factor_type:"totp",status:"unverified"}]}},error:null});
 m.verify.mockResolvedValue({error:{message:"invalid"}});
 expect((await confirmAuthenticator({},form({factorId:own,code:"123456"}))).error).toContain("could not be verified");expect(m.revalidate).not.toHaveBeenCalled();
});
it("cannot cancel a verified authenticator",async()=>{
 m.user.mockResolvedValue({data:{user:{id:"owner",email_confirmed_at:"today",factors:[{id:own,factor_type:"totp",status:"verified"}]}},error:null});
 await expect(cancelAuthenticator(form({factorId:own}))).rejects.toThrow("status=cancelled");expect(m.unenroll).not.toHaveBeenCalled();
});
it("verifies only owned active factors and checks upgraded assurance before returning",async()=>{
 m.user.mockResolvedValue({data:{user:{id:"owner",email_confirmed_at:"today",factors:[{id:own,factor_type:"totp",status:"verified"}]}},error:null});
 await expect(verifyAuthenticator({},form({factorId:own,code:"123456",next:"//evil.example"}))).rejects.toThrow("redirect:/dashboard");
 expect(m.create).toHaveBeenCalledWith({allowMfaChallenge:true});expect(m.assurance).toHaveBeenCalledOnce();
});
it("does not accept a successful provider response that leaves the session at AAL1",async()=>{
 m.user.mockResolvedValue({data:{user:{id:"owner",email_confirmed_at:"today",factors:[{id:own,factor_type:"totp",status:"verified"}]}},error:null});
 m.assurance.mockResolvedValue({data:{currentLevel:"aal1"},error:null});
 await expect(verifyAuthenticator({},form({factorId:own,code:"123456"}))).rejects.toThrow("redirect:/auth/mfa");
});
it("allows a verified backup device to remove a lost authenticator",async()=>{
 m.user.mockResolvedValue({data:{user:{id:"owner",email_confirmed_at:"today",factors:[{id:own,factor_type:"totp",status:"verified"},{id:other,factor_type:"totp",status:"verified"}]}},error:null});
 await expect(removeAuthenticator({},form({factorId:own,verificationFactorId:other,code:"123456",confirmRemoval:"on"}))).rejects.toThrow("status=removed");
 expect(m.verify).toHaveBeenCalledWith({factorId:other,code:"123456"});expect(m.unenroll).toHaveBeenCalledWith({factorId:own});
 expect(m.verify.mock.invocationCallOrder[0]).toBeLessThan(m.unenroll.mock.invocationCallOrder[0]);
});
it("never removes a factor after a bad code",async()=>{
 m.user.mockResolvedValue({data:{user:{id:"owner",email_confirmed_at:"today",factors:[{id:own,factor_type:"totp",status:"verified"}]}},error:null});
 m.verify.mockResolvedValue({error:{message:"invalid"}});
 expect((await removeAuthenticator({},form({factorId:own,verificationFactorId:own,code:"123456",confirmRemoval:"on"}))).error).toBeTruthy();
 expect(m.unenroll).not.toHaveBeenCalled();
});
