import { createServiceClient } from "@/lib/supabase/service";

async function fixDocsPrices() {
  const service = createServiceClient();
  console.log("Updating docs, article, and video resource prices to 0 in Supabase...");

  const { data: rows } = await service.from("resources").select("id, platform, resource_type, price, title");
  if (!rows) return;

  const toUpdateIds: string[] = [];
  for (const r of rows) {
    const isFree =
      r.price > 0 &&
      (r.platform === "docs" ||
        r.platform === "article" ||
        r.platform === "youtube" ||
        r.platform === "mslearn" ||
        r.resource_type === "docs" ||
        r.resource_type === "article" ||
        r.resource_type === "video" ||
        r.title.toLowerCase().includes("documentation") ||
        r.title.toLowerCase().includes("mdn"));
    if (isFree) {
      toUpdateIds.push(r.id);
      console.log("Fixing price to 0 for:", r.title, "(Old price:", r.price, ")");
    }
  }

  if (toUpdateIds.length > 0) {
    const { error } = await service
      .from("resources")
      .update({ price: 0 })
      .in("id", toUpdateIds);
    if (error) console.error("Update error:", error.message);
    else console.log(`Fixed ${toUpdateIds.length} resources to price 0.`);
  } else {
    console.log("No non-zero documentation resources found in database.");
  }
}

fixDocsPrices().catch(console.error);
