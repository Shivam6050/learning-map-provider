export function contactVerificationEnabled() { return process.env.AUTH_CONTACT_VERIFICATION_ENABLED === "true"; }
export function hasVerifiedContacts(user: {email?:string;phone?:string;email_confirmed_at?:string;phone_confirmed_at?:string} | null) {
 return Boolean(user?.email && user?.phone && user.email_confirmed_at && user.phone_confirmed_at);
}
