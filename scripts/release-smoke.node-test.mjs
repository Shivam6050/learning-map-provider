import {test} from 'node:test';
import assert from 'node:assert/strict';
import {smokeConfig,sitemapPaths,checkPrivateRedirect,checkPublicPage,runSmoke} from './release-smoke.mjs';
test('remote checks require exact authorization and HTTPS',()=>{
 assert.throws(()=>smokeConfig({SMOKE_BASE_URL:'https://example.com'}));assert.throws(()=>smokeConfig({SMOKE_BASE_URL:'http://example.com',SMOKE_ALLOW_REMOTE:'http://example.com'}));
 assert.equal(smokeConfig({SMOKE_BASE_URL:'https://example.com',SMOKE_ALLOW_REMOTE:'https://example.com'}).base,'https://example.com');
 assert.throws(()=>smokeConfig({SMOKE_BASE_URL:'https://user:secret@example.com',SMOKE_ALLOW_REMOTE:'https://example.com'}));
 assert.throws(()=>smokeConfig({SMOKE_BASE_URL:'https://example.com',SMOKE_ALLOW_REMOTE:'https://example.com',SMOKE_OFFLINE:'1'}));
});
test('sitemap targets cannot cause external or private-route requests',()=>{
 const wrap=url=>`<urlset><url><loc>${url}</loc></url></urlset>`;
 assert.deepEqual(sitemapPaths(wrap('https://example.com/'),'https://example.com'),['/']);
 for(const url of ['https://evil.test/','https://example.com/api/cron/check-links','https://example.com/settings','https://example.com/?x=1'])assert.throws(()=>sitemapPaths(wrap(url),'https://example.com'));
 assert.throws(()=>sitemapPaths('<urlset/>','https://example.com'));
});
test('private redirects must stay on site and prevent caching',()=>{
 const headers={'cache-control':'private, no-store','x-robots-tag':'noindex','location':'/login?next=%2Fsettings'};
 checkPrivateRedirect(new Response(null,{status:307,headers}),'','https://example.com');
 assert.throws(()=>checkPrivateRedirect(new Response(null,{status:307,headers:{...headers,location:'https://evil.test/login'}}),'','https://example.com'));
 assert.throws(()=>checkPrivateRedirect(new Response('secret',{status:200,headers}),'','https://other.test'));
 checkPrivateRedirect(new Response(null,{headers:{'cache-control':'no-store','x-robots-tag':'noindex'}}),'<meta http-equiv="refresh" content="0;url=/login">','https://example.com');
});
test('public checks fail closed on bad canonical, status, headings and indexing',()=>{
 const html='<title>Example</title><link rel="canonical" href="https://example.com/"><h1>Home</h1>';
 const response=new Response('',{headers:{'content-type':'text/html','x-frame-options':'DENY','x-content-type-options':'nosniff'}});
 checkPublicPage(response,html,'/','https://example.com');
 checkPublicPage(response,html.replace('https://example.com/','https://example.com'),'/','https://example.com');
 assert.throws(()=>checkPublicPage(response,html.replace('https://example.com/','/'),'/','https://example.com'));
 assert.throws(()=>checkPublicPage(response,html+'<h1>Duplicate</h1>','/','https://example.com'));
 assert.throws(()=>checkPublicPage(response,html+'<meta name="robots" content="noindex">','/','https://example.com'));
 assert.throws(()=>checkPublicPage(response,html,'/','https://wrong.test'));
});
test('failed requests produce failing smoke results without sending credentials or POSTs',async()=>{
 const requests=[];
 const result=await runSmoke({base:'http://localhost:3210',canonical:'https://example.com',offline:true},async(url,options)=>{requests.push({url,options});throw new Error('offline');},()=>{});
 assert.ok(result.failed>0);for(const {options} of requests){assert.equal(options.redirect,'manual');assert.equal(options.method,undefined);assert.equal(options.headers.authorization,undefined);assert.equal(options.headers.cookie,undefined);}
});
