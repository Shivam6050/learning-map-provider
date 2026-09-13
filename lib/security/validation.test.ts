import { describe,it,expect } from 'vitest';
import { safeRedirectPath,requireUuid } from './validation';
describe('security input boundaries',()=>{
 it('rejects external and backslash redirects',()=>{for(const v of ['https://evil.example','//evil.example','/\\evil.example','/ /evil.example','/\n/evil.example'])expect(safeRedirectPath(v)).toBe('/dashboard')});
 it('preserves local navigation',()=>{expect(safeRedirectPath('/reset-password?x=1')).toBe('/reset-password?x=1')});
 it('rejects path and query injection as identifiers',()=>{for(const v of ['../settings','id?foo=bar','', 'null'])expect(()=>requireUuid(v)).toThrow()});
});
