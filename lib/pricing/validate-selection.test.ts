import { beforeEach, expect, it, vi } from "vitest";
import type { PathOption } from "@/lib/ai/build-options";
vi.mock("./current-quote", () => ({currentQuote:vi.fn()}));
import { currentQuote } from "./current-quote";
import { validateSelectionPrices } from "./validate-selection";
const quote = vi.mocked(currentQuote);
function option(price = 100, interval?: "year"): PathOption {
 const resource = {resource_id:"one",order_index:0,is_primary:true,resources:{title:"Course",url:"https://scrimba.com/course",platform:"scrimba",resource_type:"course",price,currency:"INR",billing_interval:interval}};
 return {id:"one",name:"Route",tagline:"",total_cost:price,total_hours:20,stages:[0,1].map(order_index=>({order_index,title:"Stage",description:"",estimated_hours:10,practice_check:"",stage_resources:[resource]}))};
}
beforeEach(()=>quote.mockReset());
function respond(price:number, interval?:"year") {
 quote.mockResolvedValue({price,currency:"INR",signals:{price_country:"IN",price_checked_at:new Date().toISOString(),...(interval?{billing_interval:interval}:{})}} as Awaited<ReturnType<typeof currentQuote>>);
}
it("skips free resources",async()=>{await validateSelectionPrices(option(0),"INR","IN");expect(quote).not.toHaveBeenCalled();});
it("checks repeated courses once and accepts unchanged prices",async()=>{respond(100);await validateSelectionPrices(option(),"INR","IN");expect(quote).toHaveBeenCalledExactlyOnceWith("https://scrimba.com/course","INR","IN");});
it("allows lower prices",async()=>{respond(90);await expect(validateSelectionPrices(option(),"INR","IN")).resolves.toBeUndefined();});
it("rejects increases",async()=>{respond(101);await expect(validateSelectionPrices(option(),"INR","IN")).rejects.toThrow("has changed");});
it("rejects unavailable quotes",async()=>{quote.mockResolvedValue(null);await expect(validateSelectionPrices(option(),"INR","IN")).rejects.toThrow("could not be verified");});
it("rejects changed billing periods even at the same price",async()=>{respond(100,"year");await expect(validateSelectionPrices(option(),"INR","IN")).rejects.toThrow("has changed");});
it("accepts unchanged annual billing",async()=>{respond(100,"year");await expect(validateSelectionPrices(option(100,"year"),"INR","IN")).resolves.toBeUndefined();});
