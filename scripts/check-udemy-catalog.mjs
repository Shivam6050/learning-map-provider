import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const name of [".env.local", ".env"]) if (fs.existsSync(path.join(root, name))) process.loadEnvFile(path.join(root, name));
const sid = process.env.IMPACT_ACCOUNT_SID?.trim(), token = process.env.IMPACT_AUTH_TOKEN?.trim();
const catalog = process.env.UDEMY_IMPACT_CATALOG_ID?.trim();
if (!sid || !token) {
  console.error("Set IMPACT_ACCOUNT_SID and IMPACT_AUTH_TOKEN in .env.local. Do not paste tokens into chat.");
  process.exitCode = 1;
} else {
  try {
    const suffix = catalog ? `/${encodeURIComponent(catalog)}/Items?PageSize=3` : "";
    const response = await fetch(`https://api.impact.com/Mediapartners/${encodeURIComponent(sid)}/Catalogs${suffix}`, {
      headers: { Accept: "application/json", Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}` },
      redirect: "error", signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Impact returned HTTP ${response.status}. Check token permissions and Udemy catalog access.`);
    const data = await response.json();
    if (!catalog) {
      console.log("Accessible Udemy catalogs (set the correct Id as UDEMY_IMPACT_CATALOG_ID):");
      console.table((data.Catalogs ?? []).filter(c => /udemy/i.test(`${c.Name} ${c.AdvertiserName} ${c.CampaignName}`)).map(c => ({ Id: c.Id, Name: c.Name, Currency: c.Currency })));
    } else {
      console.log("Catalog connected. Sample entries (catalog amounts, before conversion):");
      console.table((data.Items ?? []).slice(0, 3).map(item => ({ Course: item.Name, Price: item.CurrentPrice, Currency: item.Currency, Availability: item.StockAvailability })));
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
