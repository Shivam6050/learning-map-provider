import { fetchRealtimePrice, fetchUdemyApiPrice } from "@/lib/web-discovery/price-fetcher";

async function testFetch() {
  const url = "https://www.udemy.com/course/sql-and-postgresql-for-beginners/";
  console.log("Testing live fetch for:", url);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "en-IN,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  console.log("Status:", res.status);
  const html = await res.text();
  console.log("HTML length:", html.length);

  // Search for course ID or price in HTML
  const courseIdMatch = html.match(/data-course-id="(\d+)"/) || html.match(/"course_id"\s*:\s*(\d+)/) || html.match(/"id"\s*:\s*(\d+)/);
  console.log("Course ID match:", courseIdMatch?.[1]);

  const priceMatches = html.match(/₹\s*[\d,]+/g) || html.match(/"amount"\s*:\s*([\d.]+)/g) || html.match(/"price_string"\s*:\s*"([^"]+)"/g);
  console.log("Price matches sample:", priceMatches?.slice(0, 10));

  // Let's also check if Udemy's unauthenticated price endpoint works
  if (courseIdMatch && courseIdMatch[1]) {
    const courseId = courseIdMatch[1];
    const priceApiUrl = `https://www.udemy.com/api-2.0/pricing/?course_ids=${courseId}&fields[pricing_result]=price,discount_price,list_price`;
    const priceRes = await fetch(priceApiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
      },
    });
    console.log("Price API Status:", priceRes.status);
    if (priceRes.ok) {
      const priceData = await priceRes.json();
      console.log("Price API Data:", JSON.stringify(priceData, null, 2));
    }
  }
}

testFetch().catch(console.error);
