import { BASE_SEED_RESOURCES } from "../lib/ai/seed-resources";
import { checkUrlAlive } from "../lib/link-check/check-url";

async function auditSeedLinks() {
  console.log(`Auditing ${BASE_SEED_RESOURCES.length} seed resources...\n`);
  let totalChecked = 0;
  let okCount = 0;
  let brokenCount = 0;

  for (const resource of BASE_SEED_RESOURCES) {
    totalChecked++;
    const isAlive = await checkUrlAlive(resource.url);
    if (isAlive) {
      okCount++;
      console.log(`[OK] ${resource.platform.toUpperCase()} | "${resource.title}" -> ${resource.url}`);
    } else {
      brokenCount++;
      console.log(`[BROKEN] ${resource.platform.toUpperCase()} | "${resource.title}" -> ${resource.url}`);
    }
  }

  console.log(`\n=== AUDIT SUMMARY ===`);
  console.log(`Total Checked: ${totalChecked}`);
  console.log(`Live Links: ${okCount}`);
  console.log(`Broken Links: ${brokenCount}`);
}

auditSeedLinks().catch(console.error);
