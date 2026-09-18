import {expect,it,vi,afterEach} from "vitest";
import {contactVerificationEnabled,hasVerifiedContacts} from "./contact-verification";
afterEach(()=>vi.unstubAllEnvs());
it("is disabled until explicitly configured",()=>{vi.stubEnv("AUTH_CONTACT_VERIFICATION_ENABLED","");expect(contactVerificationEnabled()).toBe(false)});
it("requires both trusted confirmations and contact values",()=>{expect(hasVerifiedContacts({email:"a@example.com",email_confirmed_at:"today"})).toBe(false);expect(hasVerifiedContacts({email:"a@example.com",phone:"12025550123",email_confirmed_at:"today",phone_confirmed_at:"today"})).toBe(true);expect(hasVerifiedContacts(null)).toBe(false)});
it("does not accept editable metadata as verification",()=>{expect(hasVerifiedContacts({email:"a@example.com",phone:"12025550123",user_metadata:{email_verified:true,phone_verified:true}} as any)).toBe(false)});
