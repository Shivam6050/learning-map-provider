# Contact verification rollout

The application integration is prepared, disabled by default. No SMS provider or paid service has been activated.

1. In Supabase Auth, enable email confirmation. Put {{ .Token }} in the Confirm signup email template. Configure a production email sender.
2. Enable Phone Auth and configure your SMS provider. Enable phone confirmations; do not auto-confirm numbers. Configure provider country restrictions, spending limits and Supabase rate limits before testing.
3. In a staging deployment set AUTH_CONTACT_VERIFICATION_ENABLED=true. Email signup uses the signup OTP; phone verification attaches the phone to the same authenticated account with updateUser and phone_change OTP. Google users verify their phone after sign-in; Google supplies their verified email.
4. Test valid, invalid, expired and resent codes; a phone already used by another account; interrupted signup; Google login; and direct calls to roadmap generation/save. Do not enable this in production until real delivery is tested.
5. Before enforcing verification as a database-wide access requirement, add and test restrictive RLS policies using trusted Auth verification records. Existing ownership RLS remains unchanged. The prepared application gate is not a replacement for database enforcement on direct Supabase API access. Settings and account deletion remain accessible during verification.

The pending email is kept in a short-lived HttpOnly cookie, not URLs. OTPs are validated by Supabase and are never stored or logged by LearningMap. Country is an editable preference, never proof of identity or authorization. SMS is not configured yet, so end-to-end delivery is unverified.

References: https://supabase.com/docs/guides/auth/phone-login and https://supabase.com/docs/reference/javascript/auth-verifyotp
