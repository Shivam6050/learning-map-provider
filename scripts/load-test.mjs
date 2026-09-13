// Read-only HTTP capacity probe. Defaults to localhost; never generates paid AI work.
import { performance } from 'node:perf_hooks';
const base = new URL(process.env.LOAD_BASE_URL || 'http://localhost:3102');
if (!['localhost','127.0.0.1'].includes(base.hostname) && process.env.LOAD_ALLOW_REMOTE !== base.origin) throw new Error('Set LOAD_ALLOW_REMOTE to the exact staging origin to authorize remote traffic.');
const concurrency = Number(process.env.LOAD_CONCURRENCY || 2);
const count = Number(process.env.LOAD_REQUESTS || 10);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 100 || !Number.isInteger(count) || count < 1 || count > 10000) throw new Error('Invalid load bounds');
const paths = (process.env.LOAD_PATHS || '/api/health').split(',');
if (paths.some(p => !p.startsWith('/') || p.startsWith('//') || p.includes('/cron/'))) throw new Error('Only ordinary relative read-only routes are allowed');
let next = 0, failures = 0; const timings = []; const start = performance.now();
await Promise.all(Array.from({length:concurrency},async()=>{
 while(next < count){ const i = next++; const t = performance.now();
  try { const response = await fetch(new URL(paths[i % paths.length],base), {redirect:'manual',signal:AbortSignal.timeout(30000),headers:process.env.LOAD_COOKIE ? {cookie:process.env.LOAD_COOKIE} : {}}); await response.arrayBuffer(); if(response.status !== 200) failures++; }
  catch { failures++; } timings.push(performance.now()-t);
 }
}));
timings.sort((a,b)=>a-b); const percentile=p=>Math.round(timings[Math.min(timings.length-1,Math.ceil(p*timings.length)-1)]);
const result = { requests:count, concurrency, failures, p50_ms:percentile(.5), p95_ms:percentile(.95), p99_ms:percentile(.99), requests_per_second:Number((count/((performance.now()-start)/1000)).toFixed(2)) };
console.log(JSON.stringify(result,null,2));
if(failures || result.p95_ms > Number(process.env.LOAD_P95_MS || 2000)) process.exitCode=1;
