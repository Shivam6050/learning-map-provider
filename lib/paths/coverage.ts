import {courseLink} from "@/lib/affiliates/links";
// Editorial review of specific provider pages, not claims inferred from titles or AI output.
export const coverageReviews:Record<string,{topics:string[];summary:string;source:string;checkedAt:string}>={
 "https://www.geeksforgeeks.org/courses/mern-full-stack-live-course-ibm-certifications":{"topics":["html.semantic","css.layout","js.functions","react.components","react.state","node.runtime","api.contracts","auth.sessions"],"summary":"Provider syllabus lists web foundations, React, Node/Express APIs and account authentication.","source":"https://www.geeksforgeeks.org/courses/mern-full-stack-live-course-ibm-certifications","checkedAt":"2026-10-02"},
 "https://campus.w3schools.com/products/sql-course":{"topics":["sql.schema","sql.queries"],"summary":"Provider syllabus includes relational constraints, queries and joins.","source":"https://campus.w3schools.com/products/sql-course","checkedAt":"2026-10-02"},
 "https://campus.w3schools.com/products/javascript-course":{"topics":["js.functions"],"summary":"Provider syllabus lists functions, collections and DOM interaction; async coverage is not assumed.","source":"https://campus.w3schools.com/products/javascript-course","checkedAt":"2026-10-02"},
 "https://www.w3schools.com/python":{"topics":["python.collections"],"summary":"Tutorial includes Python collections, functions and file operations.","source":"https://www.w3schools.com/python/","checkedAt":"2026-10-02"},
 "https://www.w3schools.com/css":{"topics":["css.layout"],"summary":"Tutorial includes responsive layout, Flexbox and Grid.","source":"https://www.w3schools.com/css/","checkedAt":"2026-10-02"},
 "https://www.w3schools.com/js":{"topics":["js.functions","js.async"],"summary":"Tutorial includes functions, collections, promises and asynchronous operations.","source":"https://www.w3schools.com/js/","checkedAt":"2026-10-02"},
 "https://scrimba.com/learn-react-c0e":{topics:["interface","react.components","react.state"],summary:"Components, JSX, props, state, forms and side effects; described by the provider.",source:"https://scrimba.com/articles/how-to-learn-react/",checkedAt:"2026-10-02"},
 "https://scrimba.com/frontend-path-c0j":{topics:["interface","html.semantic","css.layout","js.functions","react.components","react.state"],summary:"HTML, CSS, JavaScript and React, including Advanced React; described by the provider.",source:"https://scrimba.com/articles/how-to-learn-react/",checkedAt:"2026-10-02"},
 "https://www.w3schools.com/sql":{topics:["data","sql.schema","sql.queries"],summary:"SQL queries, joins, table definitions and constraints.",source:"https://www.w3schools.com/sql/",checkedAt:"2026-10-02"},
 "https://react.dev/learn":{topics:["interface","react.components","react.state"],summary:"React components, rendering, events and state.",source:"https://react.dev/learn",checkedAt:"2026-10-02"},
 "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch":{topics:["http","http.methods","js.async"],summary:"HTTP requests, request options and response handling with Fetch.",source:"https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch",checkedAt:"2026-10-02"},
};
export function reviewedCoverage(rawUrl:string,linkStatus:string,now=Date.now()) {
 const safe=courseLink(rawUrl).href;
 if(!safe||linkStatus==="broken")return null;
 const url=new URL(safe);const key=url.origin+url.pathname.replace(/\/+$/,"");
 const review=coverageReviews[key];if(!review)return null;
 const age=now-Date.parse(review.checkedAt+"T00:00:00Z");
 return age>=0&&age<=COVERAGE_REVIEW_DAYS*86400000?review:null;
}

export const COVERAGE_REVIEW_DAYS=90;
export const COVERAGE_NOTICE_DAYS=14;
/** Read-only editorial queue. A working URL does not renew a syllabus review. */
export function coverageReviewQueue(now=Date.now()) {
 return Object.entries(coverageReviews).map(([url,review])=>{
  const checked=Date.parse(review.checkedAt+"T00:00:00Z"),expires=checked+COVERAGE_REVIEW_DAYS*86400000;
  const daysRemaining=Math.floor((expires-now)/86400000);
  return {url,source:review.source,checkedAt:review.checkedAt,expiresAt:Number.isFinite(expires)?new Date(expires).toISOString():null,daysRemaining,
   status:!Number.isFinite(checked)||checked>now?"invalid":daysRemaining<0?"expired":daysRemaining<=COVERAGE_NOTICE_DAYS?"due":"current"};
 }).sort((a,b)=>a.daysRemaining-b.daysRemaining||a.url.localeCompare(b.url));
}
export function coverageReviewState(rawUrl:string,now=Date.now()) {
 const safe=courseLink(rawUrl).href;if(!safe)return "unreviewed";
 const url=new URL(safe),key=url.origin+url.pathname.replace(/\/+$/,"");
 return coverageReviewQueue(now).find(item=>item.url===key)?.status??"unreviewed";
}
