import { fetchRealtimePrice, fetchUdemyApiPrice } from "@/lib/web-discovery/price-fetcher";

async function runTest() {
  console.log("--- Testing Real-Time Udemy Price & Course Fetcher ---");
  const testUrl = "https://www.udemy.com/course/the-complete-nodejs-developer-course-2/";
  
  const hasClientKeys = Boolean(process.env.UDEMY_CLIENT_ID && process.env.UDEMY_CLIENT_SECRET) || Boolean(process.env.UDEMY_API_KEY);
  console.log("Udemy API Credentials Detected in .env:", hasClientKeys ? "YES ✅" : "NO ❌");

  if (hasClientKeys) {
    const apiResult = await fetchUdemyApiPrice(testUrl, "INR");
    console.log("Udemy Direct API Result (INR):", apiResult);
  } else {
    console.log("Skipping direct API call (no keys found). Testing fallback pricing logic:");
    const resFallbackInr = await fetchRealtimePrice(testUrl, "INR");
    console.log("Fallback Price (INR):", resFallbackInr);

    const resFallbackUsd = await fetchRealtimePrice(testUrl, "USD");
    console.log("Fallback Price (USD):", resFallbackUsd);
  }
}

runTest().catch(console.error);

