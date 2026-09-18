import {it,expect} from 'vitest';import {parseGfgOffer} from './gfg-offer';
const url='https://www.geeksforgeeks.org/courses/mern';
function html(country:string,symbol:string,fee:number,slug='mern'){return '<script id="__NEXT_DATA__" type="application/json">'+JSON.stringify({props:{pageProps:{initialState:{listingPageApi:{queries:{['getLandingPageCourseDetails('+JSON.stringify({cdnCountryCode:country,slug})+')']:{data:{currency_symbol:symbol,first_upcoming_batch:{batch_fee:fee}}}}}}}}})+'</script>'}
it('preserves USD regional price instead of relabelling INR',()=>expect(parseGfgOffer(html('US','$',119.98),url)).toEqual({amount:119.98,currency:'USD'}));
it('reads Indian batch price',()=>expect(parseGfgOffer(html('IN','₹',5999),url)).toEqual({amount:5999,currency:'INR'}));
it('rejects unrelated courses and ambiguous dollars',()=>{expect(parseGfgOffer(html('IN','₹',5999,'other'),url)).toBeNull();expect(parseGfgOffer(html('CA','$',119.98),url)).toBeNull()});

it('rejects another country even when display currency matches',()=>{expect(parseGfgOffer(html('US','$',119.98),url,'IN')).toBeNull();expect(parseGfgOffer(html('IN','₹',5999),url,'IN')).toEqual({amount:5999,currency:'INR'})});
