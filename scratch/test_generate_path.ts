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
import { generateSkeleton } from "../lib/ai/skeleton";
import { ensureSeedCandidates } from "../lib/ai/seed-resources";
import { judgeStage } from "../lib/ai/judge";
import { generatePracticeChecks } from "../lib/ai/practice-checks";
import { buildPathOptions } from "../lib/ai/build-options";

async function testPathGen() {
  console.log("Testing generatePath pipeline step-by-step...");
  const service = createServiceClient();

  const { data: fieldData, error: fieldError } = await service
    .from("fields")
    .select("id")
    .eq("slug", "backend-development")
    .maybeSingle();

  console.log("Field check:", { fieldData, fieldError });

  const skeleton = await generateSkeleton({
    fieldName: "Backend Development",
    skillLevel: "intermediate",
    weeklyHours: 15,
  });
  console.log("Skeleton stages count:", skeleton.length);

  const seedCandidates = await ensureSeedCandidates(skeleton[0].search_topics, "USD", 100);
  console.log("Seed candidates stage 0 count:", seedCandidates.length);

  const options = buildPathOptions({
    skeleton,
    judgedStages: [],
    resourcesByUrl: new Map(),
    budgetTotal: 100,
    practiceChecksByStage: new Map(),
  });
  console.log("Built options count:", options.length);

  const { data: pendingSet, error: pendingError } = await service
    .from("pending_path_sets")
    .insert({
      user_id: "00000000-0000-0000-0000-000000000000",
      field_id: fieldData?.id || "00000000-0000-0000-0000-000000000000",
      skill_level: "intermediate",
      weekly_hours: 15,
      budget_total: 100,
      currency: "USD",
      options,
    })
    .select("id")
    .single();

  console.log("Pending set insert result:", { pendingSet, pendingError });
}

testPathGen().catch((err) => {
  console.error("FATAL TEST ERROR:", err);
});
