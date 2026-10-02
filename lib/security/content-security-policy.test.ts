import { expect, it } from "vitest";
import { contentSecurityPolicy } from "./content-security-policy";
it("permits trusted scripts and only the configured auth service in production", () => {
  const csp = contentSecurityPolicy("test-nonce", "https://project.supabase.co/path");
  expect(csp).toContain("script-src 'self' 'nonce-test-nonce' 'strict-dynamic'");
  expect(csp).not.toContain("'unsafe-eval'");
  expect(csp).toContain("connect-src 'self' https://project.supabase.co wss://project.supabase.co");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
});
it("allows development debugging without relaxing production", () => {
  expect(contentSecurityPolicy("test", undefined, true)).toContain("'unsafe-eval'");
  expect(contentSecurityPolicy("test", "not a URL")).toContain("connect-src 'self';");
  expect(contentSecurityPolicy("test", "http://project.supabase.co")).not.toContain("http://project");
});
it("rejects nonce values that could inject policy directives", () => {
  expect(() => contentSecurityPolicy("bad'; script-src *")).toThrow("Invalid CSP nonce");
});
