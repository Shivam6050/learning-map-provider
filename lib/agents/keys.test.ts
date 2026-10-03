import { beforeEach, expect, it, vi } from "vitest";
const db=vi.hoisted(()=>({create:vi.fn(),eq:vi.fn(),select:vi.fn(),one:vi.fn(),user:vi.fn()}));
vi.mock("@/lib/supabase/service",()=>({createServiceClient:db.create}));
import { generateAgentKey, hashAgentKey, authenticateAgent, readAgentKey } from "./keys";
const token="lm_agent_"+"A".repeat(43);
const request=(authorization="Bearer "+token)=>new Request("https://learningmap.example/mcp",{headers:{authorization}});
const valid={user_id:"owner",scope:"catalog:read",expires_at:"2099-01-01T00:00:00Z",revoked_at:null};
beforeEach(()=>{
 vi.clearAllMocks();db.eq.mockReturnValue({maybeSingle:db.one});db.select.mockReturnValue({eq:db.eq});
 db.create.mockReturnValue({from:()=>({select:db.select}),auth:{admin:{getUserById:db.user}}});
 db.one.mockResolvedValue({data:valid,error:null});db.user.mockResolvedValue({data:{user:{id:"owner",email_confirmed_at:"2026-01-01",is_anonymous:false}},error:null});
});
it("generates independent high-entropy keys and stores a digest only",()=>{
 const a=generateAgentKey(),b=generateAgentKey();expect(a).toMatch(/^lm_agent_[A-Za-z0-9_-]{43}$/);expect(a).not.toBe(b);expect(hashAgentKey(a)).toMatch(/^[0-9a-f]{64}$/);expect(hashAgentKey(a)).not.toContain(a);
});
it.each(["", "Basic anything", "Bearer eyJhbGciOiJIUzI1NiJ9.supabase.jwt", "Bearer lm_agent_short", "Bearer "+token+" extra"])("rejects malformed credentials before accessing the database: %s", async value=>{
 expect(await authenticateAgent(request(value))).toEqual({status:"unauthorized"});expect(db.create).not.toHaveBeenCalled();
});
it("ignores credentials in URLs and browser cookies",async()=>{
 const req=new Request("https://learningmap.example/mcp?key="+token,{headers:{cookie:"session="+token}});expect(readAgentKey(req)).toBeNull();expect(await authenticateAgent(req)).toEqual({status:"unauthorized"});expect(db.create).not.toHaveBeenCalled();
});
it.each([null,{...valid,revoked_at:"2026-01-01"},{...valid,expires_at:"2020-01-01"},{...valid,expires_at:"invalid"},{...valid,scope:"admin"}])("rejects missing, expired, revoked or incorrectly scoped keys",async data=>{
 db.one.mockResolvedValue({data,error:null});expect(await authenticateAgent(request())).toEqual({status:"unauthorized"});expect(db.user).not.toHaveBeenCalled();
});
it("validates the account and never passes the raw key to Supabase",async()=>{
 expect(await authenticateAgent(request())).toEqual({status:"authorized",userId:"owner"});expect(db.eq).toHaveBeenCalledWith("token_hash",hashAgentKey(token));expect(db.user).toHaveBeenCalledWith("owner");
});
it.each([{id:"owner",email_confirmed_at:null},{id:"owner",email_confirmed_at:"yes",is_anonymous:true},{id:"owner",email_confirmed_at:"yes",banned_until:"2099-01-01"}])("rejects unverified, anonymous or blocked accounts",async user=>{
 db.user.mockResolvedValue({data:{user},error:null});expect(await authenticateAgent(request())).toEqual({status:"unauthorized"});
});
it("denies access after revocation without cached authorization",async()=>{
 expect((await authenticateAgent(request())).status).toBe("authorized");db.one.mockResolvedValue({data:{...valid,revoked_at:"now"},error:null});expect((await authenticateAgent(request())).status).toBe("unauthorized");
});
it.each(["db","network","identity"])("fails closed for %s outages",async failure=>{
 if(failure==="db")db.one.mockResolvedValue({data:null,error:{message:"internal detail"}});
 if(failure==="network")db.create.mockImplementation(()=>{throw Error("secret detail")});
 if(failure==="identity")db.user.mockResolvedValue({data:{user:null},error:{status:503}});
 expect(await authenticateAgent(request())).toEqual({status:"unavailable"});
});

it("rejects a mismatched account lookup",async()=>{
 db.user.mockResolvedValue({data:{user:{id:"other-owner",email_confirmed_at:"yes"}},error:null});
 expect(await authenticateAgent(request())).toEqual({status:"unauthorized"});
});
