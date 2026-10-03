import {it,expect,vi} from "vitest";
import type {User} from "@supabase/supabase-js";
vi.mock("next/navigation",()=>({redirect:(url:string)=>{throw new Error("redirect:"+url)}}));
import {getLearningUser} from "./learning-user";
it("requires a residence for a Google-only profile",async()=>{const client={auth:{getUser:async()=>({data:{user:{id:"u",user_metadata:{}} as User}})}};await expect(getLearningUser(client)).rejects.toThrow("/complete-profile");});
it("preserves unauthenticated results",async()=>{const result={data:{user:null}};expect(await getLearningUser({auth:{getUser:async()=>result}})).toBe(result);});

it("allows an email-verified resident without a phone while mobile verification is disabled",async()=>{vi.stubEnv("AUTH_CONTACT_VERIFICATION_ENABLED","true");vi.stubEnv("AUTH_MOBILE_VERIFICATION_ENABLED","false");const result={data:{user:{id:"u",email:"a@example.com",email_confirmed_at:"today",user_metadata:{country_of_residence:"IN"},app_metadata:{},aud:"authenticated",created_at:"2026-10-01T00:00:00Z"} as User}};try{expect(await getLearningUser({auth:{getUser:async()=>result}})).toBe(result)}finally{vi.unstubAllEnvs()}});

it("preserves the selection destination during missing-residence completion",async()=>{
 const client={auth:{getUser:async()=>({data:{user:{id:"u",user_metadata:{}} as User}})}};
 const next="/onboarding/select?set=saved&optionId=opt-2&purchased=course-a";
 await expect(getLearningUser(client,next)).rejects.toThrow("/complete-profile?"+new URLSearchParams({next}));
});
it("rejects an external profile-completion destination",async()=>{
 const client={auth:{getUser:async()=>({data:{user:{id:"u",user_metadata:{}} as User}})}};
 await expect(getLearningUser(client,"https://evil.example")).rejects.toThrow("next=%2Fdashboard");
});
