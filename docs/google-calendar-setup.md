# Google Calendar setup

Enable Google Calendar API in the Google Cloud project owning GOOGLE_CLIENT_ID. Add the calendar.events.owned scope to the OAuth consent screen and configure required test users or verification for external publication.

Register these exact authorized redirect URIs on that OAuth web client:
- https://learning-map-provider-bice.vercel.app/auth/google-calendar/callback
- http://localhost:3102/auth/google-calendar/callback

Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALENDAR_COOKIE_KEY in the hosting environment. The cookie key must be a random 32-byte value encoded as 64 hexadecimal characters. A private local value is in .env; never commit it. All instances must share the key. Deploy only after configuring these values.

Users connect separately from sign-in, then explicitly add timed sessions. The connection uses an encrypted, user-bound HttpOnly cookie and expires within one hour. No refresh token or ongoing sync is stored. Events go into the consenting Google account's primary calendar. Retrying the same schedule preserves existing matching events rather than duplicating them. Changing the schedule creates different events; remove obsolete events manually. Downloaded ICS imports do not share the Google API duplicate protection.

Verify consent, denied consent, connection expiry, two different user accounts, partial import retry, and the displayed study hours against real Google Calendar before releasing. Provider configuration and live event insertion remain unverified until these checks complete.
