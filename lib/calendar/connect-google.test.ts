import {expect,it} from "vitest";
import {googleAuthorizationUrl} from "./connect-google";
it("accepts only the fixed Google OAuth endpoint",()=>{
 const url="https://accounts.google.com/o/oauth2/v2/auth?state=sample&code_challenge=sample";
 expect(googleAuthorizationUrl(url)).toBe(url);
});
it.each([null,{},"/login","https://evil.example/o/oauth2/v2/auth","https://accounts.google.com.evil.example/o/oauth2/v2/auth","https://accounts.google.com@evil.example/o/oauth2/v2/auth","https://user@accounts.google.com/o/oauth2/v2/auth","http://accounts.google.com/o/oauth2/v2/auth","https://accounts.google.com/other","https://accounts.google.com/o/oauth2/v2/auth#fragment"])("rejects invalid navigation targets %j",value=>{expect(()=>googleAuthorizationUrl(value)).toThrow("Invalid Google Calendar connection response.");});
