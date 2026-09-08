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
  console.log("--- Testing Field Permutations on Udemy API ---");
  const clientId = process.env.UDEMY_CLIENT_ID;
  const clientSecret = process.env.UDEMY_CLIENT_SECRET;
  const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
  const slug = "sql-and-postgresql-for-beginners";

  const queries = [
    `https://www.udemy.com/api-2.0/courses/?search=${encodeURIComponent(slug)}`,
    `https://www.udemy.com/api-2.0/courses/?search=${encodeURIComponent(slug)}&fields[course]=title,price`,
    `https://www.udemy.com/api-2.0/courses/?search=${encodeURIComponent(slug)}&fields[course]=title,price,price_detail,discount_price`,
    `https://www.udemy.com/api-2.0/courses/?search=${encodeURIComponent(slug)}&fields[course]=@default,price_detail,discount_price`,
  ];

  for (const apiUrl of queries) {
    console.log(`\nTesting URL: ${apiUrl}`);
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
        "User-Agent": "UdemyAPI/2.0",
      },
    });
    console.log("Status:", response.status, response.statusText);
    const text = await response.text();
    console.log("Body snippet:", text.slice(0, 400));
  }
}

runTest().catch(console.error);

