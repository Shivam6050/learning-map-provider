import { beforeEach, expect, it, vi } from "vitest";
const s=vi.hoisted(()=>({getUser:vi.fn(),verifyOtp:vi.fn(),signInWithPassword:vi.fn(),signOut:vi.fn(),deleteUser:vi.fn()}));
vi.mock("next/navigation",()=>({redirect:(url:string)=>{throw new Error(url)}}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("next/headers",()=>({cookies:vi.fn()}));
vi.mock("@/lib/monitoring/log-error",()=>({logError:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({auth:s})}));
vi.mock("@/lib/supabase/service",()=>({createServiceClient:()=>({auth:{admin:{deleteUser:s.deleteUser}}})}));
import {deleteAccount} from "./actions";
beforeEach(()=>{
 vi.resetAllMocks();
 s.getUser.mockResolvedValue({data:{user:{id:"owner",email:"owner@example.com"}}});
 s.signInWithPassword.mockResolvedValue({data:{user:{id:"owner"}},error:null});
 s.verifyOtp.mockResolvedValue({data:{user:{id:"owner"}},error:null});
 s.signOut.mockResolvedValue({error:null}); s.deleteUser.mockResolvedValue({error:null});
});
function form(){const f=new FormData();f.set("deleteConfirm","DELETE");f.set("password","test");return f;}
it("rejects missing confirmation without deleting the account",async()=>{
 await expect(deleteAccount(new FormData())).rejects.toThrow("Type DELETE");
 expect(s.deleteUser).not.toHaveBeenCalled();
});
it("rejects a code that authenticates a different identity",async()=>{
 const f=form();f.set("emailCode","12345678");s.verifyOtp.mockResolvedValue({data:{user:{id:"other"}},error:null});
 await expect(deleteAccount(f)).rejects.toThrow("Verification failed");
 expect(s.signOut).not.toHaveBeenCalled();expect(s.deleteUser).not.toHaveBeenCalled();
});
it("does not delete when session revocation fails",async()=>{
 s.signOut.mockResolvedValue({error:{message:"unavailable"}});
 await expect(deleteAccount(form())).rejects.toThrow("Could not revoke");
 expect(s.deleteUser).not.toHaveBeenCalled();
});
it("revokes sessions before deleting the verified account",async()=>{
 await expect(deleteAccount(form())).rejects.toThrow("Your account has been deleted");
 expect(s.signOut).toHaveBeenCalledWith({scope:"global"});
 expect(s.deleteUser).toHaveBeenCalledWith("owner");
 expect(s.signOut.mock.invocationCallOrder[0]).toBeLessThan(s.deleteUser.mock.invocationCallOrder[0]);
});
