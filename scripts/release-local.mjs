// Start the already built app without usable credentials, test it, then stop only our child.
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
import {runSmoke,smokeConfig} from './release-smoke.mjs';
const port=3210,base=`http://127.0.0.1:${port}`;
try{await fetch(base,{signal:AbortSignal.timeout(500)});throw new Error('Port 3210 is already in use. Stop that server or choose another test setup.');}catch(error){if(error.message?.startsWith('Port '))throw error;}
const inherited=Object.fromEntries(['PATH','Path','SystemRoot','SYSTEMROOT','TEMP','TMP','HOME','USERPROFILE'].filter(key=>process.env[key]).map(key=>[key,process.env[key]]));
// Override local dotenv names without logging or forwarding their values.
const cleared={};
for(const filename of ['.env','.env.local','.env.production','.env.production.local']){
 try{for(const match of readFileSync(filename,'utf8').matchAll(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/gm))if(!Object.hasOwn(inherited,match[1]))cleared[match[1]]='';}catch(error){if(error.code!=='ENOENT')throw error;}
}
const env={...cleared,...inherited,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_URL:'',SUPABASE_PUBLISHABLE_KEY:'',SUPABASE_SECRET_KEY:'',CRON_SECRET:'',NEXT_PUBLIC_SITE_URL:process.env.SMOKE_CANONICAL_ORIGIN||'https://learningmap.example'};
const child=spawn(process.execPath,[resolve('node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{env,stdio:['ignore','inherit','inherit'],windowsHide:true});
let spawnError;child.on('error',error=>{spawnError=error;});
try{
 let ready=false,lastStatus='no response';
 for(let attempt=0;attempt<12;attempt++){
  if(spawnError)throw spawnError;if(child.exitCode!==null)throw new Error('Production server exited before readiness.');
  try{const response=await fetch(base+'/robots.txt',{signal:AbortSignal.timeout(5000)});lastStatus=`HTTP ${response.status}`;await response.body?.cancel();if(response.status===200){ready=true;break;}}catch(error){lastStatus=error.name;}
  await delay(500);
 }
 if(!ready)throw new Error(`Production server did not become ready (${lastStatus}).`);
 const result=await runSmoke(smokeConfig({SMOKE_BASE_URL:base,SMOKE_CANONICAL_ORIGIN:env.NEXT_PUBLIC_SITE_URL,SMOKE_OFFLINE:'1'}));if(result.failed)process.exitCode=1;
}finally{child.kill();}
