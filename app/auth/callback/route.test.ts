import { beforeEach, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({user:vi.fn(),exchange:vi.fn(),create:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createClient:m.create}));
vi.mock("@/lib/site",()=>({getRequestOrigin:()=>"https://learningmap.example"}));
import {GET} from "./route";
beforeEach(()=>{vi.resetAllMocks();m.create.mockResolvedValue({auth:{exchangeCodeForSession:m.exchange,getUser:m.user}});m.exchange.mockResolvedValue({data:{user:{id:"owner",user_metadata:{country_of_residence:"IN"}}},error:null});m.user.mockResolvedValue({data:{user:{id:"owner"}},error:null});});
it("checks the MFA-protected session after Google/email code exchange",async()=>{
 const response=await GET(new Request("https://learningmap.example/auth/callback?code=qa&next=%2Fsettings"));
 expect(m.user).toHaveBeenCalledOnce();expect(m.create).toHaveBeenCalledWith({next:"/settings"});expect(response.headers.get("location")).toBe("https://learningmap.example/settings");
});
it("does not continue when the server session guard requires MFA",async()=>{
 m.user.mockRejectedValue(new Error("redirect:/auth/mfa"));await expect(GET(new Request("https://learningmap.example/auth/callback?code=qa"))).rejects.toThrow("redirect:/auth/mfa");
});
