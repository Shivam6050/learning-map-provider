import { expect, it } from "vitest";
import { courseLink, SCRIMBA_REFERRAL_CODE } from "./links";
it.each(["", "javascript:alert(1)", "data:text/html,test", "file:///etc/passwd", "http://localhost/course", "http://127.0.0.1/course", "https://user:password@example.com/course", "https://example.com:8080/course", "https://[broken"])("rejects unsafe or malformed links: %s", url => {
 expect(courseLink(url, true)).toEqual({href:"",affiliate:false});
});
it("preserves the course, query and fragment while adding the referral",()=>{
 const result=courseLink("https://scrimba.com/learn/react?lesson=1&via=old#intro");
 const url=new URL(result.href);
 expect(url.pathname).toBe("/learn/react");
 expect(url.searchParams.get("lesson")).toBe("1");
 expect(url.searchParams.get("via")).toBe(SCRIMBA_REFERRAL_CODE);
 expect(url.hash).toBe("#intro");
 expect(result.affiliate).toBe(true);
});
it("does not attach a referral to lookalike hosts",()=>{
 expect(courseLink("https://scrimba.com.example.org/course").affiliate).toBe(false);
});
it("preserves valid external affiliate links",()=>{
 expect(courseLink("https://example.com/course?ref=123",true)).toEqual({href:"https://example.com/course?ref=123",affiliate:true});
});
it("supports domain-only course URLs",()=>{
 expect(courseLink("scrimba.com/learn/react").href).toBe("https://scrimba.com/learn/react?via="+SCRIMBA_REFERRAL_CODE);
});
