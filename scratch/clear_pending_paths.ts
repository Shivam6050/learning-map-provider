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

async function main() {
  const service = createServiceClient();
  
  const { data: beforeCount, error: countErr } = await service
    .from("pending_path_sets")
    .select("id, user_id, created_at");
  
  console.log("Existing pending_path_sets count:", beforeCount?.length, "Error:", countErr);

  const { data: deleted, error: delErr } = await service
    .from("pending_path_sets")
    .delete()
    .gte("created_at", "1970-01-01T00:00:00Z")
    .select("id");

  console.log("Deleted pending_path_sets count:", deleted?.length, "Error:", delErr);
}

main().catch(console.error);
