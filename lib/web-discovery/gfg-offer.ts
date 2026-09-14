/** Read the exact course's regional batch quote, not SEO currency metadata. */
export function parseGfgOffer(html: string, page: string): { amount: number; currency: string; title?: string } | null {
 try {
 const url=new URL(page); if(url.hostname.replace(/^www\./,'')!=='geeksforgeeks.org')return null;
 const slug=url.pathname.split('/').filter(Boolean)[1];
 const match=html.match(/<script\b[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);if(!match)return null;
 const queries=JSON.parse(match[1]).props?.pageProps?.initialState?.listingPageApi?.queries;
 const quotes=[];
 for(const [key,value] of Object.entries(queries??{})) {
  if(!key.startsWith('getLandingPageCourseDetails('))continue;
  const args=JSON.parse(key.slice(key.indexOf('(')+1,-1));if(args.slug!==slug)continue;
  const data=(value as {data?:any}).data;const amount=data?.first_upcoming_batch?.batch_fee;
  const currency=({'₹':'INR','$':'USD','€':'EUR','£':'GBP'} as Record<string,string>)[data?.currency_symbol];
  if(typeof amount!=='number'||!Number.isFinite(amount)||amount<=0||!currency)continue;
  // A dollar sign alone is ambiguous outside the US region.
  if(currency==='USD'&&args.cdnCountryCode!=='US')continue;
  if(currency==='INR'&&args.cdnCountryCode!=='IN')continue;
  quotes.push({amount,currency});
 }
 return quotes.length===1?quotes[0]:null;
 }catch{return null;}
}
