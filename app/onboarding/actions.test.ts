import {beforeEach,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({service:vi.fn(),rpc:vi.fn(),setCookie:vi.fn(),template:vi.fn()}));
vi.mock("next/navigation",()=>({redirect:(url:string)=>{throw new Error("redirect:"+url)}}));
vi.mock("next/headers",()=>({cookies:async()=>({set:m.setCookie})}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:"learner",user_metadata:{country_of_residence:"IN"}}}})}})}));
vi.mock("@/lib/supabase/service",()=>({createServiceClient:m.service}));
vi.mock("@/lib/templates/load",()=>({loadRoadmapTemplate:m.template}));
vi.mock("@/lib/config/launch",()=>({launchLimits:()=>({paused:false,userDaily:3,globalDaily:20})}));
import {generatePath} from "./actions";
beforeEach(()=>{vi.resetAllMocks();m.service.mockReturnValue({rpc:m.rpc});m.rpc.mockResolvedValue({data:"user_limit",error:null});});
function form(hours:string){const f=new FormData();f.set("fieldSlug","backend-development");f.set("skillLevel","beginner");f.set("weeklyHours",hours);f.set("budgetTotal","5000");f.set("currency","INR");return f;}
it.each(["2.5","1.01","79.9","0","81","NaN","Infinity",""])("rejects invalid weekly hours (%s) before any quota or provider work",async hours=>{
 await expect(generatePath(form(hours))).rejects.toThrow("Weekly hours must be a whole number between 1 and 80");
 expect(m.service).not.toHaveBeenCalled();expect(m.rpc).not.toHaveBeenCalled();expect(m.template).not.toHaveBeenCalled();expect(m.setCookie).not.toHaveBeenCalled();
});
it.each(["1","12","80"])("accepts valid whole hours (%s) and reaches the existing quota gate",async hours=>{
 await expect(generatePath(form(hours))).rejects.toThrow("today's generation allowance");
 expect(m.rpc).toHaveBeenCalledExactlyOnceWith("reserve_launch_generation",{p_user_id:"learner",p_user_limit:3,p_global_limit:20});
 expect(m.template).not.toHaveBeenCalled();
});
