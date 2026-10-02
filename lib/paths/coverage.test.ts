import {expect,it} from "vitest";
import {reviewedCoverage} from "./coverage";
const now=Date.parse("2026-10-02T12:00:00Z");
it("matches only reviewed URLs while tolerating referral parameters",()=>{expect(reviewedCoverage("https://scrimba.com/learn-react-c0e?via=u4355626","ok",now)?.topics).toEqual(["interface","react.components","react.state"]);});
it("does not infer a course curriculum from a host or title",()=>{expect(reviewedCoverage("https://scrimba.com/advanced-react-c02h","ok",now)).toBeNull();expect(reviewedCoverage("https://scrimba.com.evil.test/learn-react-c0e","ok",now)).toBeNull();});
it("does not show current mapping for broken or unsafe links",()=>{expect(reviewedCoverage("https://react.dev/learn","broken",now)).toBeNull();expect(reviewedCoverage("javascript:alert(1)","ok",now)).toBeNull();});
it("expires old editorial coverage and rejects future reviews",()=>{expect(reviewedCoverage("https://react.dev/learn","ok",Date.parse("2027-02-01"))).toBeNull();expect(reviewedCoverage("https://react.dev/learn","ok",Date.parse("2026-09-01"))).toBeNull();});

it("maps reviewed paid resources only to specific supported concepts",()=>{
 expect(reviewedCoverage("https://campus.w3schools.com/products/sql-course","ok",now)?.topics).toEqual(["sql.schema","sql.queries"]);
 expect(reviewedCoverage("https://www.geeksforgeeks.org/courses/mern-full-stack-live-course-ibm-certifications","ok",now)?.topics).toContain("react.state");
 expect(reviewedCoverage("https://www.geeksforgeeks.org/courses/mern-full-stack-live-course-ibm-certifications","ok",now)?.topics).not.toContain("sql.transactions");
});
