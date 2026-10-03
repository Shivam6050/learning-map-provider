import {beforeEach,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({updateUser:vi.fn(),set:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:"learner"}}}),updateUser:m.updateUser}})}));
vi.mock("next/headers",()=>({cookies:async()=>({set:m.set})}));
vi.mock("next/navigation",()=>({redirect:(url:string)=>{throw new Error("redirect:"+url)}}));
import {completeProfile} from "./actions";
beforeEach(()=>{vi.resetAllMocks();m.updateUser.mockResolvedValue({error:null});});
function form(){const f=new FormData();f.set("next","/paths/roadmap#stage-two");f.set("country","IN");f.set("acceptTerms","on");return f;}
it("keeps the destination when residence validation fails",async()=>{const f=form();f.delete("acceptTerms");await expect(completeProfile(f)).rejects.toThrow("next=%2Fpaths%2Froadmap%23stage-two");expect(m.updateUser).not.toHaveBeenCalled();});
it("keeps the destination when residence saving fails",async()=>{m.updateUser.mockResolvedValue({error:{message:"offline"}});await expect(completeProfile(form())).rejects.toThrow("next=%2Fpaths%2Froadmap%23stage-two");expect(m.set).not.toHaveBeenCalled();});
it("returns to the requested stage after saving residence",async()=>{await expect(completeProfile(form())).rejects.toThrow("redirect:/paths/roadmap#stage-two");expect(m.set).toHaveBeenCalled();});
