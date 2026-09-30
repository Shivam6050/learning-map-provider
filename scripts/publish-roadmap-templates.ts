import fs from "node:fs";
import {publishRoadmapTemplates} from "../lib/templates/publish";
for(const file of [".env"])if(fs.existsSync(file))process.loadEnvFile(file);
publishRoadmapTemplates(process.argv.includes("--publish")).catch(error=>{console.error(error instanceof Error?error.message:"Template publication failed");process.exitCode=1;});
