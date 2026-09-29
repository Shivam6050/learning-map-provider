import {it,expect,vi} from "vitest";
import type {User} from "@supabase/supabase-js";
vi.mock("next/navigation",()=>({redirect:(url:string)=>{throw new Error("redirect:"+url)}}));
import {getLearningUser} from "./learning-user";
it("requires a residence for a Google-only profile",async()=>{const client={auth:{getUser:async()=>({data:{user:{id:"u",user_metadata:{}} as User}})}};await expect(getLearningUser(client)).rejects.toThrow("/complete-profile");});
it("preserves unauthenticated results",async()=>{const result={data:{user:null}};expect(await getLearningUser({auth:{getUser:async()=>result}})).toBe(result);});
