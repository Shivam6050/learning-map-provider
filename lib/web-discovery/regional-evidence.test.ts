import {afterEach,expect,it,vi} from "vitest";
vi.mock("@/lib/currency/convert",()=>({getConversionRate:async()=>1}));
vi.mock("@/lib/link-check/check-url",()=>({inspectUrl:vi.fn()}));
import {inspectUrl} from "@/lib/link-check/check-url";
import {fetchRealtimePrice} from "./price-fetcher";
import {w3schoolsQuote} from "./w3schools-quote";
import {scrimbaPlanQuote} from "./paid-catalog";
afterEach(()=>{vi.restoreAllMocks();vi.clearAllMocks();});
it("W3Schools storefront currency does not prove country pricing",async()=>{
 vi.spyOn(global,"fetch").mockImplementation(async input=>{
 const url=String(input);return {ok:true,url,json:async()=>url.endsWith("cart.js")?{currency:"USD"}:{handle:"sql-course",title:"SQL",available:true,variants:[{available:true,price:9500}]}} as Response;
 });
 expect(await w3schoolsQuote("https://campus.w3schools.com/products/sql-course","USD")).toMatchObject({price:95,isRealtime:false});
});
function html(country:string){return '<script id="__NEXT_DATA__">'+JSON.stringify({props:{pageProps:{initialState:{listingPageApi:{queries:{['getLandingPageCourseDetails('+JSON.stringify({slug:"mern",cdnCountryCode:country})+')']:{data:{currency_symbol:"$",first_upcoming_batch:{batch_fee:120}}}}}}}}})+'</script>';}
it("GFG quote carries market evidence and refuses an unrelated market",async()=>{
 vi.mocked(inspectUrl).mockResolvedValue({status:"ok",url:"https://www.geeksforgeeks.org/courses/mern",html:html("US")} as Awaited<ReturnType<typeof inspectUrl>>);
 expect(await fetchRealtimePrice("https://www.geeksforgeeks.org/courses/mern","USD","US")).toMatchObject({price:120,isRealtime:true,verifiedCountry:"US"});
 expect(await fetchRealtimePrice("https://www.geeksforgeeks.org/courses/mern","USD","IN")).toMatchObject({price:null,isRealtime:false});
});
it("Scrimba annual quote requires explicit residence evidence",async()=>{
 vi.spyOn(global,"fetch").mockImplementation(async()=>new Response("Billed annually for $120.00"));
 expect(await scrimbaPlanQuote("USD","US")).toBeNull();
 expect(await scrimbaPlanQuote("USD")).toBeNull();
});
