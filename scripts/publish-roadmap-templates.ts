/** Run with tsx. Default is read-only validation; --publish writes a new version. */
import fs from "node:fs";
import { templateBlueprints } from "../lib/templates/blueprints";
import { inspectUrl } from "../lib/link-check/check-url";
import { createServiceClient } from "../lib/supabase/service";
import { getVideoStats } from "../lib/youtube/client";

async function main() {
 for (const file of [".env.local", ".env"]) if (fs.existsSync(file)) process.loadEnvFile(file);
 const publish=process.argv.includes("--publish");
 const blueprints=templateBlueprints();
 const seeds=[...new Map(blueprints.flatMap(t=>t.stages.flatMap(s=>s.resources)).map(r=>[r.url,r])).values()];
 const alive=new Set<string>();
 for(let i=0;i<seeds.length;i+=6) {
  await Promise.all(seeds.slice(i,i+6).map(async seed=>{
   try {
    if(seed.platform==="youtube") {
     const id=new URL(seed.url).searchParams.get("v");
     if(id && (await getVideoStats([id])).length) alive.add(seed.url);
    } else if((await inspectUrl(seed.url)).status==="ok") alive.add(seed.url);
   } catch { /* Unverifiable resources are omitted, never silently approved. */ }
  }));
  console.log("Checked",Math.min(i+6,seeds.length),"of",seeds.length,"public resources");
 }
 const ready=blueprints.map(t=>({...t,stages:t.stages.map(s=>({...s,resources:s.resources.filter(r=>alive.has(r.url))}))}));
 const incomplete=ready.flatMap(t=>t.stages.filter(s=>!s.resources.length).map(s=>t.field_slug+" / "+t.skill_level+" / "+s.title));
 console.log(JSON.stringify({templates:ready.length,verifiedResources:alive.size,incompleteStages:incomplete},null,2));
 if(incomplete.length) throw new Error("Publication stopped: every stage must have at least one verified free resource.");
 if(!publish) {console.log("Validation complete. No database writes. Use --publish to store a new version.");return;}
 const client=createServiceClient();
 // Verify schema before creating resource records.
 const {error:schemaError}=await client.from("roadmap_templates").select("version").limit(1);
 if(schemaError) throw new Error("Apply the roadmap_templates migration before publishing.");
 const verified=seeds.filter(r=>alive.has(r.url));
 const {error:insertError}=await client.from("resources").upsert(verified.map(r=>({title:r.title,url:r.url,platform:r.platform,resource_type:r.resource_type,price:0,currency:"USD",trust_status:"allowlisted"})),{onConflict:"url",ignoreDuplicates:true});
 if(insertError) throw new Error("Could not store template resources: "+insertError.message);
 const {data:rows,error:readError}=await client.from("resources").select("*").in("url",verified.map(r=>r.url));
 if(readError || !rows) throw new Error("Could not load stored resource identifiers.");
 const byUrl=new Map(rows.filter(r=>Number(r.price)===0 && r.link_status!=="broken" && r.trust_status!=="rejected").map(r=>[r.url,r.id]));
 const version=Math.floor(Date.now()/1000);
 const checked=new Date();const validUntil=new Date(checked.getTime()+30*86400000).toISOString();
 const records=ready.map(t=>({field_slug:t.field_slug,skill_level:t.skill_level,version,status:"published",reviewed_at:checked.toISOString(),valid_until:validUntil,stages:t.stages.map(({resources,...stage})=>({...stage,resource_ids:resources.flatMap(r=>byUrl.has(r.url)?[byUrl.get(r.url)!]:[])}))}));
 if(records.some(t=>t.stages.some(s=>!s.resource_ids.length))) throw new Error("Existing resource records conflict with the free catalog; publication stopped.");
 const {error}=await client.from("roadmap_templates").insert(records);
 if(error) throw new Error("Could not publish templates: "+error.message);
 const {data:stored,error:verifyError}=await client.from("roadmap_templates").select("field_slug,skill_level,version").eq("version",version);
 if(verifyError || stored?.length!==records.length) throw new Error("Publication could not be verified.");
 console.log("Published and verified",stored.length,"templates; version",version,"expires",validUntil);
}
main().catch(error=>{console.error(error instanceof Error?error.message:"Template publication failed");process.exitCode=1;});
