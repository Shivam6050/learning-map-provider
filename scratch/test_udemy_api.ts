import { fetchRealtimePrice, fetchUdemyApiPrice } from "@/lib/web-discovery/price-fetcher";

async function runTest() {
  console.log("--- Testing Real-Time Udemy Price Fetcher ---");
  const testUrl = "https://www.udemy.com/course/the-complete-nodejs-developer-course-2/";
  
  const resNoKeys = await fetchRealtimePrice(testUrl, "INR");
  console.log("Without API Keys fallback:", resNoKeys);

  const resUsd = await fetchRealtimePrice(testUrl, "USD");
  console.log("USD pricing:", resUsd);
}

runTest().catch(console.error);
