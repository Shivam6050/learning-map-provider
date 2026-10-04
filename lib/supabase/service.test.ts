import {afterEach,beforeEach,expect,it,vi} from "vitest";
const create=vi.hoisted(()=>vi.fn());
vi.mock("server-only",()=>({}));
vi.mock("@supabase/supabase-js",()=>({createClient:create}));
import {createServiceClient} from "./service";
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv("SUPABASE_URL","https://qa.supabase.co");vi.stubEnv("SUPABASE_SECRET_KEY","sb_secret_private-jobs");vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY","legacy-admin-key");});
afterEach(()=>vi.unstubAllEnvs());
it("uses the dedicated server-only job key",()=>{createServiceClient();expect(create).toHaveBeenCalledWith("https://qa.supabase.co","sb_secret_private-jobs",expect.objectContaining({auth:{persistSession:false}}));});
it.each(["", "legacy-admin-key", "sb_publishable_user-key", "placeholder"])("does not fall back to unsuitable job key %s",key=>{vi.stubEnv("SUPABASE_SECRET_KEY",key);expect(createServiceClient).toThrow("Server database configuration is unavailable");expect(create).not.toHaveBeenCalled();});
