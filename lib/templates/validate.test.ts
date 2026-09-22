import { describe, expect, it } from 'vitest';
import { validTemplate } from './validate';
const make=()=>({field_slug:'backend-development',skill_level:'beginner',version:1,valid_until:'2099-01-01T00:00:00Z',stages:[{order_index:0,title:'HTTP',description:'Learn HTTP',estimated_hours:4,search_topics:['http'],practice_check:'Build an endpoint',resource_ids:['12345678-1234-1234-1234-123456789abc']}]});
describe('roadmap template validation',()=>{
 it('accepts a complete matching curriculum',()=>expect(validTemplate(make(),'backend-development','beginner')).toBe(true));
 it('rejects wrong field and level',()=>{expect(validTemplate(make(),'frontend-development','beginner')).toBe(false);expect(validTemplate(make(),'backend-development','advanced')).toBe(false)});
 it.each([null,{}, { ...make(),stages:[null] },{ ...make(),stages:[] },{ ...make(),valid_until:'2000-01-01' },{ ...make(),version:0 }])('rejects malformed or expired records',value=>expect(validTemplate(value,'backend-development','beginner')).toBe(false));
 it('rejects missing resource coverage and invalid identifiers',()=>{const t=make();t.stages[0].resource_ids=[];expect(validTemplate(t,'backend-development','beginner')).toBe(false);t.stages[0].resource_ids=['------------------------------------'];expect(validTemplate(t,'backend-development','beginner')).toBe(false)});
 it('rejects reordered and invalid duration stages',()=>{const t=make();t.stages[0].order_index=2;expect(validTemplate(t,'backend-development','beginner')).toBe(false);t.stages[0].order_index=0;t.stages[0].estimated_hours=NaN;expect(validTemplate(t,'backend-development','beginner')).toBe(false)});
});
