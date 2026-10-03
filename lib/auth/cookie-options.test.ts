import { afterEach, expect, it, vi } from "vitest";
import { authCookieOptions } from "./cookie-options";
afterEach(() => vi.unstubAllEnvs());
it.each(["sb-project-auth-token", "sb-project-auth-token.0", "sb-project-auth-token.1"])("protects session cookie %s from page scripts", name => {
 vi.stubEnv("NODE_ENV", "production");
 expect(authCookieOptions(name,{httpOnly:false,secure:false,sameSite:"none",path:"/",maxAge:3600})).toEqual({httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:3600});
});
it.each(["sb-project-auth-token-code-verifier","sb-project-auth-token-code-verifier.0"])("preserves browser OAuth PKCE storage for %s",name=>{
 vi.stubEnv("NODE_ENV","production");
 expect(authCookieOptions(name,{})).toMatchObject({httpOnly:false,secure:true,sameSite:"lax"});
});
it("preserves cookie deletion and does not require HTTPS for local development",()=>{
 vi.stubEnv("NODE_ENV","development");
 expect(authCookieOptions("sb-project-auth-token",{maxAge:0,expires:new Date(0)})).toMatchObject({httpOnly:true,secure:false,maxAge:0,expires:new Date(0)});
});
