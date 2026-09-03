import { describe, it, expect } from "vitest";
import { isSafeHttpUrl } from "@/lib/link-check/url-safety";

describe("isSafeHttpUrl", () => {
  it("accepts real http and https URLs", () => {
    expect(isSafeHttpUrl("https://example.com/course")).toBe(true);
    expect(isSafeHttpUrl("http://example.com")).toBe(true);
  });

  it("rejects javascript: URIs", () => {
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects data: URIs", () => {
    expect(isSafeHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("rejects malformed strings without throwing", () => {
    expect(() => isSafeHttpUrl("not a url at all")).not.toThrow();
    expect(isSafeHttpUrl("not a url at all")).toBe(false);
    expect(isSafeHttpUrl("")).toBe(false);
  });

  it("rejects other schemes like file: and ftp:", () => {
    expect(isSafeHttpUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeHttpUrl("ftp://example.com/file")).toBe(false);
  });
});
