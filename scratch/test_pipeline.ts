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

import { generateSkeleton } from "../lib/ai/skeleton";
import { ensureSeedCandidates } from "../lib/ai/seed-resources";
import { judgeStage } from "../lib/ai/judge";
import { generatePracticeChecks } from "../lib/ai/practice-checks";
import { buildPathOptions } from "../lib/ai/build-options";
import type { DiscoveredResource } from "../lib/youtube/discover";

async function testPipeline() {
  const fieldName = "Frontend Development";
  const skillLevel = "intermediate";
  const weeklyHours = 15;
  const budgetTotal = 100;
  const currency = "USD";

  console.log(`=== DEBUG PIPELINE FOR: ${fieldName}, Budget: $${budgetTotal} ===`);

  const skeleton = await generateSkeleton({ fieldName, skillLevel, weeklyHours });

  const resourcesByUrl = new Map<string, DiscoveredResource>();
  const candidatesByStage = new Map<number, DiscoveredResource[]>();

  for (const stage of skeleton) {
    const seedCandidates = await ensureSeedCandidates(stage.search_topics, currency, budgetTotal);
    candidatesByStage.set(stage.order_index, seedCandidates);
    console.log(`Stage ${stage.order_index} [${stage.title}] candidates count: ${seedCandidates.length}`);
    for (const c of seedCandidates) {
      console.log(`  - Candidate: "${c.title}" | Price: $${c.price} | Platform: ${c.platform}`);
      if (!resourcesByUrl.has(c.url)) resourcesByUrl.set(c.url, c);
    }
  }

  const judgedStages = await Promise.all(
    skeleton.map((stage) => judgeStage(stage, candidatesByStage.get(stage.order_index) ?? []))
  );

  const practiceChecksByStage = await generatePracticeChecks(skeleton);

  const options = buildPathOptions({
    skeleton,
    judgedStages,
    candidatesByStage,
    resourcesByUrl,
    budgetTotal,
    practiceChecksByStage,
  });

  for (const opt of options) {
    console.log(`\n==================================================`);
    console.log(`PATH: [${opt.id}] ${opt.name}`);
    console.log(`Tagline: ${opt.tagline}`);
    console.log(`Total Cost: $${opt.total_cost} | Total Hours: ${opt.total_hours}h`);
    for (const stage of opt.stages) {
      console.log(`\n  Stage ${stage.order_index + 1}: ${stage.title} (${stage.estimated_hours}h)`);
      for (const sr of stage.stage_resources) {
        console.log(`    - [${sr.resources.platform}] "${sr.resources.title}" | Price: $${sr.resources.price} | URL: ${sr.resources.url}`);
      }
    }
  }
}

testPipeline().catch(console.error);
