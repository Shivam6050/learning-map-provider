import fs from "fs";
import path from "path";

const envFile = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    process.env[key] = val;
  }
}

import { createServiceClient } from "../lib/supabase/service";

async function testInsert() {
  const service = createServiceClient();
  const seed = {
    title: "The Complete CSS Masterclass — Udemy",
    url: "https://www.udemy.com/course/test-css-masterclass-123/",
    platform: "udemy",
    resource_type: "course",
    price: 40,
    currency: "USD",
  };

  console.log("Checking existing...");
  const { data: existing, error: selectErr } = await service
    .from("resources")
    .select("*")
    .eq("url", seed.url)
    .maybeSingle();

  console.log("Select result:", { existing, selectErr });

  console.log("Inserting...");
  const { data: inserted, error: insertErr } = await service
    .from("resources")
    .insert({
      title: seed.title,
      url: seed.url,
      platform: seed.platform,
      resource_type: seed.resource_type,
      price: seed.price,
      currency: seed.currency,
      trust_status: "allowlisted",
      signals: {},
      link_status: "ok",
    })
    .select("id")
    .single();

  console.log("Insert result:", { inserted, insertErr });
}

testInsert().catch(console.error);
