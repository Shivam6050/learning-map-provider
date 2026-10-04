import {beforeEach, expect, it, vi} from "vitest";
const m=vi.hoisted(()=>({oauth:vi.fn(),redirect:vi.fn((url:string)=>{throw new Error("redirect:"+url)}),config:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({auth:{signInWithOAuth:m.oauth}})}));
vi.mock("@/lib/supabase/config",()=>({getSupabaseConfig:m.config}));
vi.mock("@/lib/site",()=>({getSiteUrl:()=>"https://learningmap.example"}));
vi.mock("next/navigation",()=>({redirect:m.redirect}));
import {googleSignIn} from "./google";
const oauthUrl="https://qa.supabase.co/auth/v1/authorize?provider=google&code_challenge=challenge&code_challenge_method=s256";
beforeEach(()=>{vi.clearAllMocks();m.config.mockReturnValue({url:"https://qa.supabase.co",key:"sb_publishable_private"});m.oauth.mockResolvedValue({data:{url:oauthUrl},error:null});});
function form(next="/settings"){const f=new FormData();f.set("next",next);return f;}
it("starts OAuth on the server and redirects without returning credentials",async()=>{
 await expect(googleSignIn(null,form())).rejects.toThrow("redirect:"+oauthUrl);
 expect(m.oauth).toHaveBeenCalledWith({provider:"google",options:{redirectTo:"https://learningmap.example/auth/callback?next=%2Fsettings",skipBrowserRedirect:false,queryParams:{access_type:"offline",prompt:"consent"}}});
 expect(m.redirect).toHaveBeenCalledWith(oauthUrl);
});
it.each(["//evil.example", "https://evil.example", "/\\evil.example", "/settings\n"])("sanitizes untrusted continuation %s",async next=>{
 await expect(googleSignIn(null,form(next))).rejects.toThrow("redirect:");expect(m.oauth.mock.calls[0][0].options.redirectTo).toBe("https://learningmap.example/auth/callback?next=%2Fdashboard");
});
it.each(["https://evil.example/auth/v1/authorize", "https://qa.supabase.co/auth/v1/user", "https://qa.supabase.co/auth/v1/authorize?apikey=sb_publishable_private", "https://qa.supabase.co/auth/v1/authorize?x=sb_publishable_private"])("rejects a wrong or credential-bearing destination %s",async url=>{
 m.oauth.mockResolvedValue({data:{url},error:null});expect(await googleSignIn(null,form())).toEqual({error:expect.any(String)});expect(m.redirect).not.toHaveBeenCalled();
});
it.each(["throw", "provider", "missing", "config"])("returns a safe retry error on %s failure",async failure=>{
 if(failure==="throw")m.oauth.mockRejectedValue(new Error("sensitive key"));
 if(failure==="provider")m.oauth.mockResolvedValue({data:{url:oauthUrl},error:{message:"sensitive key"}});
 if(failure==="missing")m.oauth.mockResolvedValue({data:{url:null},error:null});
 if(failure==="config")m.config.mockReturnValue(null);
 expect(await googleSignIn(null,form())).toEqual({error:"Google sign-in is unavailable. Please try again."});expect(m.redirect).not.toHaveBeenCalled();
});
