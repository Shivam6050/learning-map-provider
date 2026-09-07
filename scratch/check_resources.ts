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
import { BASE_SEED_RESOURCES } from "../lib/ai/seed-resources";

async function main() {
  const service = createServiceClient();
  const seed = BASE_SEED_RESOURCES[0];
  const { data: existing, error: selectErr } = await service
    .from("resources")
    .select("*")
    .eq("url", seed.url);
  console.log("Select result:", { existing, selectErr });
}

main().catch(console.error);
