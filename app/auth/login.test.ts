import {beforeEach, expect, it, vi} from "vitest";
const m=vi.hoisted(()=>({signIn:vi.fn(),revalidate:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({auth:{signInWithPassword:m.signIn}})}));
vi.mock("next/navigation",()=>({redirect:(url:string)=>{throw new Error("redirect:"+url)}}));
vi.mock("next/cache",()=>({revalidatePath:m.revalidate}));
import {login} from "./actions";
beforeEach(()=>{vi.resetAllMocks();m.signIn.mockResolvedValue({error:null});});
function form(next?:string){const f=new FormData();f.set("email","learner@example.com");f.set("password","private-test-password");if(next!==undefined)f.set("next",next);return f;}
it("resumes the exact selection, purchased courses and stage fragment",async()=>{
 const next="/onboarding/select?set=saved&optionId=opt-2&purchased=course-a,course-b#stage-a";
 await expect(login(form(next))).rejects.toThrow("redirect:"+next);
 expect(m.revalidate).toHaveBeenCalledWith("/","layout");
});
it.each([undefined,"https://evil.example/path","//evil.example/path","/\\evil.example/path"])("uses the dashboard for a missing or unsafe return URL: %s",async next=>{
 await expect(login(form(next))).rejects.toThrow("redirect:/dashboard");
});
it("retains the destination after a rejected password without revalidating",async()=>{
 m.signIn.mockResolvedValue({error:{message:"Invalid login credentials"}});
 const next="/paths/roadmap#stage-two";
 await expect(login(form(next))).rejects.toThrow("redirect:/login?"+new URLSearchParams({error:"Invalid login credentials",next}));
 expect(m.revalidate).not.toHaveBeenCalled();
});
it("retains a safe destination after a network failure",async()=>{
 m.signIn.mockRejectedValue(new Error("fetch failed"));
 await expect(login(form("/onboarding"))).rejects.toThrow("next=%2Fonboarding");
});
it("does not preserve an external return URL on a failed sign-in",async()=>{
 m.signIn.mockResolvedValue({error:{message:"Invalid login credentials"}});
 await expect(login(form("https://evil.example"))).rejects.toThrow("next=%2Fdashboard");
});
