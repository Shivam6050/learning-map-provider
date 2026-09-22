import fs from 'node:fs';
import { templateBlueprints } from '../lib/templates/blueprints';
import { loadRoadmapTemplate } from '../lib/templates/load';
async function main(){
 for(const file of ['.env.local','.env']) if(fs.existsSync(file)) process.loadEnvFile(file);
 let checked=0; const started=Date.now();
 for(const blueprint of templateBlueprints()) {
  for(const currency of ['INR','USD']) {
   const loaded=await loadRoadmapTemplate(blueprint.field_slug,blueprint.skill_level,currency);
   if(!loaded || loaded.stages.some(stage=>!stage.candidates.length || stage.candidates.some(r=>r.price!==0 || r.currency!==currency))) throw new Error('Invalid template: '+blueprint.field_slug+' / '+blueprint.skill_level+' / '+currency);
   checked++;
  }
 }
 console.log('Verified',checked,'live template loads across INR and USD in',Date.now()-started,'ms total.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
