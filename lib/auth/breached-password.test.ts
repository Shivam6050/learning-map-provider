import { afterEach, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
vi.mock("server-only",()=>({}));
import { screenPassword } from "./breached-password";
afterEach(()=>vi.unstubAllGlobals());
const password="a-completed-test-passphrase";
const hash=createHash("sha1").update(password).digest("hex").toUpperCase();
it("sends only a five-character prefix, padded, after the complete password is submitted",async()=>{
 const request=vi.fn(async()=>new Response(hash.slice(5)+":4\r\n"+"A".repeat(35)+":0"));
 vi.stubGlobal("fetch",request);
 expect(await screenPassword(password)).toBe("breached");
 const [url,options]=request.mock.calls[0] as unknown as [string,RequestInit];
 expect(url).toBe("https://api.pwnedpasswords.com/range/"+hash.slice(0,5));
 expect(url).not.toContain(hash);expect(url).not.toContain(password);
 expect(options.headers).toMatchObject({"Add-Padding":"true"});
 expect(options).toMatchObject({cache:"no-store",redirect:"error"});
});
it("ignores zero-count padding and accepts a password absent from the returned range",async()=>{
 vi.stubGlobal("fetch",vi.fn(async()=>new Response(hash.slice(5)+":0\r\n"+"B".repeat(35)+":10")));
 expect(await screenPassword(password)).toBe("safe");
});
it.each(["","malformed",hash.slice(5)+":NaN","Z".repeat(35)+":3"])("fails closed on malformed range responses",async body=>{
 vi.stubGlobal("fetch",vi.fn(async()=>new Response(body)));
 expect(await screenPassword(password)).toBe("unavailable");
});
it("bounds oversized upstream responses",async()=>{
 vi.stubGlobal("fetch",vi.fn(async()=>new Response("A".repeat(140000))));
 expect(await screenPassword(password)).toBe("unavailable");
});
it("does not screen invalid-length passwords or contact a provider",async()=>{
 const request=vi.fn();vi.stubGlobal("fetch",request);
 expect(await screenPassword("short")).toBe("unavailable");expect(await screenPassword("a".repeat(129))).toBe("unavailable");
 expect(request).not.toHaveBeenCalled();
});
it("returns an unavailable result without exposing upstream errors",async()=>{
 vi.stubGlobal("fetch",vi.fn(async()=>{throw new Error("sensitive upstream body");}));
 expect(await screenPassword(password)).toBe("unavailable");
});
