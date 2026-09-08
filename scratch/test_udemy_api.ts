import { fetchRealtimePrice, fetchUdemyApiPrice } from "@/lib/web-discovery/price-fetcher";
import fs from "fs";
import path from "path";

// Manually load .env into process.env for standalone script
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex !== -1) {
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
} catch (e) {
  console.error("Failed to parse .env:", e);
}

async function runTest() {
  console.log("--- Testing Public Frontend Udemy Endpoints ---");
  const slug = "sql-and-postgresql-for-beginners";

  const publicEndpoints = [
    `https://www.udemy.com/api-2.0/course-landing-pages/find_by_slug/?slug=${slug}&fields[course]=id,title,price,price_detail,discount_price`,
    `https://www.udemy.com/api-2.0/pricing/?course_ids=2259166&fields[pricing_result]=price,discount_price,list_price`,
  ];

  for (const apiUrl of publicEndpoints) {
    console.log("\nFetching URL:", apiUrl);
    try {
      const response = await fetch(apiUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-IN,en;q=0.9",
        },
      });

      console.log("Status:", response.status, response.statusText);
      const text = await response.text();
      console.log("Response:", text.slice(0, 300));
    } catch (e) {
      console.error("Error:", e);
    }
  }
}

runTest().catch(console.error);

