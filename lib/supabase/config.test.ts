import {afterEach, beforeEach, expect, it, vi} from "vitest";
vi.mock("server-only",()=>({}));
import {getSupabaseConfig} from "./config";
beforeEach(()=>{
 vi.stubEnv("SUPABASE_URL","https://qa.supabase.co");
 vi.stubEnv("SUPABASE_PUBLISHABLE_KEY","sb_publishable_private-app-key");
 vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY","exposed-legacy-key");
 vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","sb_publishable_exposed-key");
});
afterEach(()=>vi.unstubAllEnvs());
it("uses the server-held low-privilege credential, never public or admin keys",()=>{
 vi.stubEnv("SUPABASE_SECRET_KEY","sb_secret_admin");
 expect(getSupabaseConfig()).toEqual({url:"https://qa.supabase.co",key:"sb_publishable_private-app-key"});
});
it.each(["", "eyJlegacy", "sb_secret_admin", "placeholder", "sb_publishable_placeholder"])("fails closed for unsuitable application key %s",key=>{
 vi.stubEnv("SUPABASE_PUBLISHABLE_KEY",key);expect(getSupabaseConfig()).toBeNull();
});
it.each(["http://remote.supabase.co","https://user:pass@qa.supabase.co","https://qa.supabase.co/path","https://qa.supabase.co?apikey=key","https://qa.supabase.co#fragment","invalid"])("rejects invalid provider URL %s",url=>{
 vi.stubEnv("SUPABASE_URL",url);vi.stubEnv("NODE_ENV","production");expect(getSupabaseConfig()).toBeNull();
});
it("allows local Supabase only outside production",()=>{
 vi.stubEnv("SUPABASE_URL","http://127.0.0.1:54321");vi.stubEnv("NODE_ENV","development");expect(getSupabaseConfig()?.url).toBe("http://127.0.0.1:54321");
 vi.stubEnv("NODE_ENV","production");expect(getSupabaseConfig()).toBeNull();
});
it("supports the existing project address without falling back to public keys",()=>{
 vi.stubEnv("SUPABASE_URL","");vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL","https://existing.supabase.co");expect(getSupabaseConfig()?.url).toBe("https://existing.supabase.co");
 vi.stubEnv("SUPABASE_PUBLISHABLE_KEY","");expect(getSupabaseConfig()).toBeNull();
});
