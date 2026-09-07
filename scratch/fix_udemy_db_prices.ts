import { createServiceClient } from "../lib/supabase/service";

async function fixUdemyDbPrices() {
  const service = createServiceClient();

  // 1. Update resources table for all Udemy courses
  const { data: udemyResources } = await service
    .from("resources")
    .select("id, url, price, currency")
    .or("platform.eq.udemy,url.ilike.%udemy.com%");

  if (udemyResources && udemyResources.length > 0) {
    console.log(`Found ${udemyResources.length} Udemy resources in DB.`);
    for (const res of udemyResources) {
      const newPrice = res.currency === "INR" ? 486 : 13;
      await service.from("resources").update({ price: newPrice }).eq("id", res.id);
      console.log(`Updated resource ${res.id} (${res.url}) price to ${newPrice} ${res.currency}`);
    }
  }

  // 2. Clear out old pending_path_sets so new roadmap generations compute fresh Option totals with 486 INR
  const { error: deleteErr } = await service.from("pending_path_sets").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Cleared old pending path sets:", deleteErr ? deleteErr.message : "Success");
}

fixUdemyDbPrices();
