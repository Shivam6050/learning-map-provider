// Optional audit tool; PGlite is installed separately, never as a production dependency.
// Usage: node scripts/test-resource-management-sql.mjs /path/to/@electric-sql/pglite/dist/index.js
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
if(!process.argv[2])throw new Error("Provide the path to a separately installed PGlite module.");
const {PGlite}=await import(pathToFileURL(resolve(process.argv[2])).href);
const root=new URL("../",import.meta.url);
const db=new PGlite();
try{
 await db.exec(await readFile(new URL("supabase/tests/resource_management_bootstrap.sql",root),"utf8"));
 const migration=await readFile(new URL("supabase/migrations/20261025174543_roadmap_resource_management.sql",root),"utf8");
 await db.exec(migration);await db.exec(migration);
 await db.exec("begin;"+await readFile(new URL("supabase/tests/resource_management.sql",root),"utf8"));
 const {rows}=await db.query("select (select count(*) from auth.users) accounts,(select count(*) from resource_reports) reports,(select count(*) from roadmap_resource_changes) changes");
 if(Object.values(rows[0]).some(value=>Number(value)!==0))throw new Error("Rollback left test data behind");
 console.log("PASS: migration rerun, ownership, RLS, progress preservation, duplicate reports, lookup quota, admin review and rollback.");
}finally{await db.close();}
