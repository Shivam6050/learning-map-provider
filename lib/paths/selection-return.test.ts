import { expect, it } from "vitest";
import { selectionReturnPath } from "./selection-return";
it("preserves selected courses without automatic confirmation",()=>{
 const url=new URL(selectionReturnPath("set","opt-2",["a","b","a",""]),"https://learningmap.test");
 expect(url.pathname).toBe("/onboarding/select");
 expect(url.searchParams.get("set")).toBe("set");
 expect(url.searchParams.get("optionId")).toBe("opt-2");
 expect(url.searchParams.get("purchased")).toBe("a,b");
 expect(url.searchParams.has("autoConfirm")).toBe(false);
});
it("encodes values against parameter injection",()=>{
 const url=new URL(selectionReturnPath("set&autoConfirm=1","opt&autoConfirm=1"),"https://learningmap.test");
 expect(url.searchParams.get("set")).toBe("set&autoConfirm=1");
 expect(url.searchParams.has("autoConfirm")).toBe(false);
});
it("omits missing selections",()=>expect(selectionReturnPath("set")).toBe("/onboarding/select?set=set"));
