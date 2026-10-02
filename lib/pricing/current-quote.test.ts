import {beforeEach,afterEach,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({quote:vi.fn(),fetch:vi.fn()}));
vi.mock("next/cache",()=>({unstable_cache:(fn:unknown)=>fn}));
vi.mock("@/lib/web-discovery/paid-catalog",()=>({PAID_CATALOG:[{url:"https://scrimba.com/a",subscription:true}],paidSubscriptionQuote:mocks.quote}));
vi.mock("@/lib/web-discovery/price-fetcher",()=>({fetchRealtimePrice:mocks.fetch}));
import {currentQuote} from "./current-quote";
beforeEach(()=>vi.useFakeTimers({now:new Date("2026-10-01T12:00:00Z")}));
afterEach(()=>{vi.useRealTimers();vi.resetAllMocks();});
it("rejects expired cache entries",async()=>{mocks.quote.mockResolvedValue({price:50,currency:"USD",signals:{price_country:"IN",price_checked_at:"2026-10-01T11:54:00Z"}});expect(await currentQuote("https://scrimba.com/a","USD","IN")).toBeNull();});
it("passes market and currency separately",async()=>{mocks.quote.mockResolvedValue({price:50,currency:"USD",signals:{price_country:"IN",price_checked_at:"2026-10-01T11:59:00Z"}});expect(await currentQuote("https://scrimba.com/a","usd","in")).not.toBeNull();expect(mocks.quote).toHaveBeenCalledWith("https://scrimba.com/a","USD","IN");});
it("does not price an unknown market",async()=>{expect(await currentQuote("https://scrimba.com/a","USD","")).toBeNull();expect(mocks.quote).not.toHaveBeenCalled();});

it("rejects a fresh converted estimate",async()=>{
 mocks.fetch.mockResolvedValue({price:100,currency:"INR",isRealtime:false});
 expect(await currentQuote("https://example.com/course","INR","IN")).toBeNull();
});
it("accepts a verified same-market quote",async()=>{
 mocks.fetch.mockResolvedValue({price:100,currency:"INR",isRealtime:true,verifiedCountry:"IN"});
 expect(await currentQuote("https://example.com/course","INR","IN")).toMatchObject({price:100,currency:"INR"});
});
it.each([
 {currency:"EUR",signals:{price_country:"IN"}},
 {currency:"USD",signals:{price_country:"US"}},
 {currency:"USD",signals:{}},
])("rejects mismatched or missing quote scope: %j",async partial=>{
 mocks.quote.mockResolvedValue({price:50,...partial,signals:{...partial.signals,price_checked_at:"2026-10-01T11:59:00Z"}});
 expect(await currentQuote("https://scrimba.com/a","USD","IN")).toBeNull();
});
it.each([NaN,Infinity,-1])("rejects invalid amounts: %s",async price=>{
 mocks.quote.mockResolvedValue({price,currency:"USD",signals:{price_country:"IN",price_checked_at:"2026-10-01T11:59:00Z"}});
 expect(await currentQuote("https://scrimba.com/a","USD","IN")).toBeNull();
});

it("rejects currency-only evidence even when a provider labels it realtime",async()=>{
 mocks.fetch.mockResolvedValue({price:100,currency:"INR",isRealtime:true});
 expect(await currentQuote("https://example.com/course","INR","IN")).toBeNull();
});
it("does not relabel another market's quote",async()=>{
 mocks.fetch.mockResolvedValue({price:100,currency:"USD",isRealtime:true,verifiedCountry:"US"});
 expect(await currentQuote("https://example.com/course","USD","IN")).toBeNull();
});
