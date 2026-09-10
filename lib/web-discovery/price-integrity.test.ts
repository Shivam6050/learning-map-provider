import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRealtimePrice, fetchUdemyApiPrice } from "./price-fetcher";
vi.mock("@/lib/currency/convert", () => ({getConversionRate:vi.fn(async()=>null)}));
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
describe("price identity",()=>{
  it("does not borrow another course's price",async()=>{vi.stubEnv("UDEMY_CLIENT_ID","test");vi.stubEnv("UDEMY_CLIENT_SECRET","test");vi.spyOn(global,"fetch").mockResolvedValue(new Response(JSON.stringify({results:[{url:"/course/unrelated/",price_detail:{amount:10,currency:"USD"}}]})));expect(await fetchUdemyApiPrice("https://www.udemy.com/course/requested/","USD")).toBeNull();});
  it("does not invent a Coursera subscription cost",async()=>{expect((await fetchRealtimePrice("https://www.coursera.org/learn/example","INR")).price).toBeNull();});
  it("does not consider a lookalike free platform free",async()=>{expect((await fetchRealtimePrice("https://youtube.com.evil.example/watch?v=test")).price).toBeNull();});
  it("does not relabel an unconverted foreign price",async()=>{vi.stubEnv("UDEMY_CLIENT_ID","test");vi.stubEnv("UDEMY_CLIENT_SECRET","test");vi.spyOn(global,"fetch").mockResolvedValue(new Response(JSON.stringify({results:[{url:"/course/requested/",price_detail:{amount:10,currency:"USD"}}]})));expect(await fetchUdemyApiPrice("https://www.udemy.com/course/requested/","INR")).toBeNull();});
});
