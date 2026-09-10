import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fetchUdemyApiPrice, fetchRealtimePrice } from "./price-fetcher";

describe("Udemy API & Realtime Price Fetcher", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("returns null when no Udemy API credentials are provided", async () => {
    delete process.env.UDEMY_CLIENT_ID;
    delete process.env.UDEMY_CLIENT_SECRET;
    delete process.env.UDEMY_API_KEY;

    const res = await fetchUdemyApiPrice("https://www.udemy.com/course/the-complete-nodejs-developer-course-2/");
    expect(res).toBeNull();
  });

  it("keeps the price unknown when credentials and public offers are unavailable", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Provider unavailable"));
    delete process.env.UDEMY_CLIENT_ID;
    delete process.env.UDEMY_CLIENT_SECRET;
    delete process.env.UDEMY_API_KEY;

    const res = await fetchRealtimePrice("https://www.udemy.com/course/the-complete-nodejs-developer-course-2/", "INR");
    expect(res).toEqual({
      price: null,
      currency: "INR",
      isRealtime: false,
    });
  });

  it("successfully parses Udemy API response when credentials exist", async () => {
    process.env.UDEMY_CLIENT_ID = "test_client_id";
    process.env.UDEMY_CLIENT_SECRET = "test_client_secret";

    const mockResponse = {
      results: [
        {
          title: "The Complete Node.js Developer Course",
          headline: "Learn Node.js by building real-world applications",
          url: "/course/the-complete-nodejs-developer-course-2/",
          rating: 4.67,
          discount_price: { amount: 14.99, currency: "USD", price_string: "$14.99" },
          price_detail: { amount: 84.99, currency: "USD", price_string: "$84.99" },
          visible_instructors: [{ title: "Andrew Mead" }],
        },
      ],
    };

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const res = await fetchUdemyApiPrice(
      "https://www.udemy.com/course/the-complete-nodejs-developer-course-2/",
      "USD"
    );

    expect(res).toEqual({
      price: 14.99,
      currency: "USD",
      isRealtime: true,
      title: "The Complete Node.js Developer Course",
      headline: "Learn Node.js by building real-world applications",
      rating: 4.7,
      instructor: "Andrew Mead",
    });
  });
});
