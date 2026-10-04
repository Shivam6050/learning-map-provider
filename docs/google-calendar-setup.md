> Mobile verification is paused. The retired `AUTH_CONTACT_VERIFICATION_ENABLED` flag is ignored. `AUTH_MOBILE_VERIFICATION_ENABLED` defaults to false; leave it disabled until SMS delivery is working. Email confirmation remains enabled in Supabase. Deploy this change to remove the existing production gate.

# Google Calendar setup

Enable Google Calendar API in the Google Cloud project owning GOOGLE_CLIENT_ID. Add the calendar.events.owned scope to the OAuth consent screen and configure required test users or verification for external publication.

Register these exact authorized redirect URIs on that OAuth web client:
- https://learning-map-provider-bice.vercel.app/auth/google-calendar/callback
- http://localhost:3102/auth/google-calendar/callback

Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALENDAR_COOKIE_KEY in the hosting environment. The cookie key must be a random 32-byte value encoded as 64 hexadecimal characters. A private local value is in .env; never commit it. All instances must share the key. Deploy only after configuring these values.

Users connect separately from sign-in, then explicitly add timed sessions. The connection uses an encrypted, user-bound HttpOnly cookie and expires within one hour. No refresh token or ongoing sync is stored. Events go into the consenting Google account's primary calendar. Retrying the same schedule preserves existing matching events rather than duplicating them. Changing the schedule creates different events; remove obsolete events manually. Downloaded ICS imports do not share the Google API duplicate protection.

Verify consent, denied consent, connection expiry, two different user accounts, partial import retry, and the displayed study hours against real Google Calendar before releasing. Provider configuration and live event insertion remain unverified until these checks complete.

## Configuration verified on 2026-10-02

The production callback was saved to the existing Learning-map OAuth client. Google Calendar API is enabled and calendar.events.owned was added to the consent configuration. GOOGLE_CALENDAR_COOKIE_KEY was saved as a Vercel Production secret; redeploy to load it. The private local key was rotated before saving after accessibility output exposed the previous, undeployed value.

The OAuth audience remains External / Testing. Google lists two approved test users, and publication is disabled until branding configuration is completed. This integration is therefore not available to arbitrary Google accounts yet. Public release requires completing branding and Google's applicable consent verification, not merely deploying application code.

The localhost callback above remains a setup instruction; only the production callback was configured during this session. Real user consent and event insertion remain unverified. The deployed application currently requires phone verification when AUTH_MOBILE_VERIFICATION_ENABLED=true; if SMS is deferred, that requirement can prevent unverified accounts from reaching the calendar connection flow.

## Live status checked 5 October 2026

The OAuth audience is now In production (published with user approval). This supersedes the earlier Testing observation. Branding and sensitive-scope verification are still outstanding. The project currently contains one OAuth web client. Search Console confirms ownership, but automated branding review still reports an ownership mismatch; a manual-review explanation is prepared, not submitted. No verification video is configured and the signed-in YouTube channel has no videos. See google-oauth-verification.md and google-oauth-demo-script.md.

The deployed calendar controls were checked, but real event insertion is still pending account-owner consent. Do not claim Google Calendar is fully verified or that publishing removes the warning. SMS remains deferred and mandatory mobile verification remains intentionally disabled.


Follow-up on 5 October: fresh consent, one real 60-minute event, identical retry with no duplicate, test-event cleanup, and app disconnection all passed. This supersedes the pending-insertion observation above. Google branding and sensitive-scope verification are still not submitted; the required demo video URL is missing.
