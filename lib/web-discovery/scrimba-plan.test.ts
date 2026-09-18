import { expect, it } from 'vitest';
import { parseScrimbaPlan } from './paid-catalog';
import { pathCost } from '@/lib/pricing/path-cost';
it('uses the full annual INR charge instead of its monthly equivalent',()=>{
 expect(parseScrimbaPlan('₹415.33 / month Billed annually for ₹4,983.99','INR')).toEqual({price:4983.99,currency:'INR',interval:'year'});
});
it('rejects another currency and ambiguous annual offers',()=>{
 expect(parseScrimbaPlan('Billed annually for USD49','INR')).toBeNull();
 expect(parseScrimbaPlan('Billed annually for ₹4983.99 Billed annually for ₹5999','INR')).toBeNull();
 expect(parseScrimbaPlan('₹415.33 / month','INR')).toBeNull();
});
it('counts a shared annual plan once across different courses, never as a monthly charge',()=>{
 const a={url:'https://scrimba.com/a',price:4983.99,signals:{price_source:'scrimba_regional_plan',billing_interval:'year'}};
 const bill=pathCost([{estimated_hours:40,resources:[a]},{estimated_hours:40,resources:[{...a,url:'https://scrimba.com/b'}]}],10);
 expect(bill.total).toBe(4983.99);expect(bill.subscriptions[0].periods).toBe(1);
});
it('excludes unverified legacy quotes from budget totals',()=>{
 expect(pathCost([{estimated_hours:20,resources:[{url:'https://scrimba.com/a',price:4702,signals:{price_source:'scrimba_monthly',price_unverified:true}}]}]).total).toBe(0);
});

import {scrimbaMatchesMarket} from './paid-catalog';
it('does not confuse a currency with a verified market',()=>{expect(scrimbaMatchesMarket('Billed annually for ₹4983.99','IN')).toBe(false);expect(scrimbaMatchesMarket('IN Price discounted based on your region','IN')).toBe(true);expect(scrimbaMatchesMarket('US Price discounted based on your region','IN')).toBe(false)});
