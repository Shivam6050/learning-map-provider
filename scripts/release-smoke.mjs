// Bounded, credential-free HTTP release checks. No login, generation or mutations.
import {pathToFileURL} from 'node:url';
export function smokeConfig(env=process.env){
 const base=new URL(env.SMOKE_BASE_URL||'http://127.0.0.1:3210');
 if(!['http:','https:'].includes(base.protocol)||base.username||base.password||base.search||base.hash||base.pathname!=='/')throw new Error('SMOKE_BASE_URL must be a plain HTTP(S) origin.');
 const local=['localhost','127.0.0.1','[::1]'].includes(base.hostname);
 if(!local&&(base.protocol!=='https:'||env.SMOKE_ALLOW_REMOTE!==base.origin))throw new Error('Authorize remote checks with SMOKE_ALLOW_REMOTE set to the exact HTTPS origin.');
 const canonical=new URL(env.SMOKE_CANONICAL_ORIGIN||base.origin);
 if(canonical.username||canonical.password||!['http:','https:'].includes(canonical.protocol)||canonical.pathname!=='/'||canonical.search||canonical.hash)throw new Error('Invalid canonical origin.');
 const offline=env.SMOKE_OFFLINE==='1';if(offline&&!local)throw new Error('Offline expectations are only allowed for localhost.');
 return {base:base.origin,canonical:canonical.origin,offline};
}
const decode=value=>value.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'");
export function attributes(tag){const result={};for(const match of tag.matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g))result[match[1].toLowerCase()]=decode(match[2]);return result;}
export function sitemapPaths(xml,canonical){
 const urls=[...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(match=>new URL(decode(match[1].trim())));
 if(!urls.length||urls.length>50)throw new Error('Sitemap must contain 1–50 public URLs.');
 for(const url of urls)if(url.origin!==canonical||url.search||url.hash||!/^\/(?:roadmaps(?:\/[a-z0-9-]+)?|integrations|privacy|terms)?$/.test(url.pathname))throw new Error('Unexpected sitemap target; refusing to follow it.');
 const paths=urls.map(url=>url.pathname);if(new Set(paths).size!==paths.length||!paths.includes('/'))throw new Error('Duplicate sitemap URL or missing homepage.');return paths;
}
function assert(value,message){if(!value)throw new Error(message);}
export function checkPublicPage(response,html,path,canonical){
 assert(response.status===200,`HTTP ${response.status}`);
 assert(response.headers.get('content-type')?.includes('text/html'),'Expected HTML');
 assert((html.match(/<h1(?:\s|>)/gi)||[]).length===1,'Expected one H1');
 assert(/<title>[^<]+<\/title>/i.test(html),'Missing title');
 const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(match=>attributes(match[0]));
 assert(links.some(link=>link.rel==='canonical'&&/^https?:\/\//.test(link.href??'')&&new URL(link.href).href===new URL(path,canonical).href),'Canonical URL mismatch');
 const robots=[...html.matchAll(/<meta\b[^>]*>/gi)].map(match=>attributes(match[0])).filter(meta=>meta.name==='robots').map(meta=>meta.content).join(' ');
 assert(!/noindex/i.test(robots+' '+response.headers.get('x-robots-tag')),'Public page unexpectedly noindexed');
 assert(response.headers.get('x-content-type-options')==='nosniff','Missing MIME protection');
 assert(response.headers.get('x-frame-options')==='DENY','Missing framing protection');
}
export function checkPrivateRedirect(response,html,base){
 let location=[301,302,303,307,308].includes(response.status)?response.headers.get('location'):null;
 if(!location&&response.status===200){const refresh=[...html.matchAll(/<meta\b[^>]*>/gi)].map(match=>attributes(match[0])).find(meta=>meta['http-equiv']?.toLowerCase()==='refresh');location=refresh?.content?.match(/url=(.*)$/i)?.[1];}
 assert(location,'Signed-out page did not redirect to sign-in');
 const target=new URL(location,base);assert(target.origin===base&&target.pathname==='/login','Unexpected sign-in redirect destination');
 assert(/no-store/i.test(response.headers.get('cache-control')??''),'Private page may be cached');
 assert(/noindex/i.test(response.headers.get('x-robots-tag')??''),'Private page missing noindex header');
}
export async function runSmoke(config,fetcher=fetch,report=console.log){
 let passed=0,failed=0;
 async function request(path,accept='text/html'){
  const response=await fetcher(config.base+path,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:{accept,'user-agent':'LearningMap-release-smoke/1.0'}});
  const html=await response.text();assert(html.length<2_000_000,'Response exceeded smoke-check size limit');return {response,html};
 }
 async function check(label,fn){try{await fn();passed++;report('PASS '+label);}catch(error){failed++;report('FAIL '+label+': '+(error instanceof Error?error.message:'Request failed'));}}
 let paths=[];
 await check('sitemap',async()=>{const {response,html}=await request('/sitemap.xml','application/xml');assert(response.status===200,'Sitemap not reachable');paths=sitemapPaths(html,config.canonical);});
 for(const path of paths)await check('public '+path,async()=>{const {response,html}=await request(path);checkPublicPage(response,html,path,config.canonical);});
 await check('robots',async()=>{const {response,html}=await request('/robots.txt','text/plain');assert(response.status===200&&html.includes(config.canonical+'/sitemap.xml'),'Robots sitemap mismatch');assert(/Disallow: \/settings/.test(html),'Private settings missing from robots');});
 await check('unknown public roadmap',async()=>{const {response}=await request('/roadmaps/release-check-not-a-field');assert(response.status===404,'Unknown guide must return 404');});
 for(const path of ['/dashboard','/settings','/settings/library','/settings/agents','/admin/resource-reports'])await check('signed-out '+path,async()=>{const {response,html}=await request(path);checkPrivateRedirect(response,html,config.base);});
 for(const path of ['/mcp','/api/public/catalog','/api/public/roadmap','/settings/export'])await check('protected API '+path,async()=>{const {response}=await request(path,'application/json');assert(response.status===401,`Expected 401, got ${response.status}`);assert(/no-store/.test(response.headers.get('cache-control')??''),'Protected response may be cached');});
 if(config.offline)for(const path of ['/api/cron/check-links','/api/cron/weekly-reminders','/api/cron/review-coverage'])await check('cron guard '+path,async()=>{const {response}=await request(path,'application/json');assert(response.status===401,'Unauthenticated cron request must be denied');});
 await check('database health',async()=>{const {response,html}=await request('/api/health','application/json');const value=JSON.parse(html);assert(config.offline?response.status===503&&value.status==='unavailable':response.status===200&&value.status==='ok'&&value.database==='reachable',config.offline?'Offline build did not fail health closed':'Database health is not ready');});
 report(`Release smoke: ${passed} passed, ${failed} failed. No authenticated journeys or delivery tests were run.`);
 return {passed,failed};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{const result=await runSmoke(smokeConfig());if(result.failed)process.exitCode=1;}catch(error){console.error(error.message);process.exitCode=1;}}
