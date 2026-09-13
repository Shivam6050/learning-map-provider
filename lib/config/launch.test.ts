import { describe, it, expect } from 'vitest';
import { launchLimits } from './launch';
describe('launch spending controls',()=>{
 it('defaults to a small allowance and no grounded search',()=>{expect(launchLimits({})).toEqual({userDaily:3,globalDaily:20,paused:false,searchEnabled:false})});
 it('rejects invalid or excessive limits',()=>{for(const value of ['0','-1','NaN','Infinity','1001','2.5']) { const limits=launchLimits({MAX_GENERATIONS_PER_DAY:value,MAX_GLOBAL_GENERATIONS_PER_DAY:value});expect(limits.userDaily).toBe(3);expect(limits.globalDaily).toBe(20)}});
 it('only enables optional search explicitly and supports a pause',()=>{expect(launchLimits({GENERATION_PAUSED:'true',ENABLE_GROUNDED_SEARCH:'true',MAX_GENERATIONS_PER_DAY:'2'})).toMatchObject({paused:true,searchEnabled:true,userDaily:2})});
});
