# Google OAuth verification preparation

Status: not submitted; Google approval is outstanding.

The project was repurposed for LearningMap with user approval. Branding and scopes were updated and the OAuth audience published. Google approval remains outstanding; the dated observations below describe the last verified hosted state.

Required preparation:
- LearningMap branding and verified support/developer email.
- Public homepage, privacy policy, and terms on a domain whose ownership can be verified through Google Search Console.
- Only scopes used by LearningMap: identity scopes for sign-in, and calendar.events.owned for optional calendar imports. Confirm the Cloud Console scope classification before submitting.
- A demonstration video showing sign-in, explicit Calendar consent, scheduling preferences, event insertion, and resulting timed events. Do not include secrets or unrelated personal events.
- Calendar scope justification: LearningMap creates the user-requested study schedule in their primary calendar and reads matching deterministic event IDs only on import retries to avoid duplicates. No background sync or unrelated calendar scan.
- Test the live integration before recording or asserting it works. Complete any reviewer access instructions truthfully.

The privacy policy now documents actual Calendar data use and connection retention; deploy it before submitting. Google reviews the submission; publishing is not verification. Final submission or new public access may require confirmation in browser.

Search Console ownership setup: the official downloaded challenge is saved as public/googlec6f0da9702df187b.html. Deploy it, confirm the production URL returns the exact challenge, then use VERIFY in Search Console. This proves URL-prefix ownership only; OAuth domain acceptance remains subject to Google review. Keep the file deployed to maintain ownership. Branding has been saved as LearningMap with production policy links.

2026-10-02: Search Console confirms the LearningMap URL-prefix property is verified. Unrelated Drive, Gmail, Chat, Contacts, directory and unused calendar scopes were removed and saved. Audience changed to In production with user approval. Automated branding verification started; outcome pending. Calendar sensitive-scope verification has not been submitted.

Automated branding review returned: homepage ownership not registered to you; verify ownership, then wait 24 hours before retrying for Google systems to update. Search Console already confirms ownership, so do not repeatedly retry or claim domain rejection. Retry after propagation; Calendar scope review remains blocked until branding is verified and published.

## Verified status on 5 October 2026

No demo URL is configured in Data access or Prepare for verification. The signed-in Shivam Sagar YouTube Studio channel shows "No content available" under Videos. No existing uploaded verification demo was found there; another account or an unpublished recording on disk was not inspected.

Search Console still reports verified ownership of the exact LearningMap URL-prefix property (added 1 October). A fresh automated branding retry still reports homepage ownership is not registered to the owner. The manual-review preparation form was opened and an ownership explanation drafted, but **no review request has been submitted**. Confirm is disabled until the sensitive-scope justification and demo URL are complete. The justification below was entered into the Data access form, but Save also remains disabled without the video URL. These are browser drafts, not saved hosted changes.

### Calendar justification (916 characters)

LearningMap uses calendar.events.owned for an optional, user-initiated study schedule import into the user's primary Google Calendar. After connecting, the user chooses the start date, weekdays, start time and timezone, then selects Add sessions. The backend creates timed events using the roadmap stage title, description and allocated study hours. It reads only events with deterministic LearningMap IDs to verify duplicates when retrying an import; it does not browse unrelated events. Read-only scopes cannot create sessions; calendar.events is broader because it also covers shared calendars. The app does not require calendar list, calendar settings, or full calendar access. Access tokens are encrypted in HTTP-only cookies, bound to the signed-in user and expire within one hour; no refresh token is retained. Google Calendar data is not used for advertising, sold, sent to Gemini or used to train AI models.

### Homepage ownership appeal

Google Search Console confirms that the support account is a verified owner of the exact URL-prefix property https://learning-map-provider-bice.vercel.app/. The property was added on 1 October 2026, and ownership is still verified on 5 October 2026. This same Google account owns the Cloud project. The homepage, privacy policy, and terms are publicly accessible on that property. Automated branding reverification still reports that the homepage is not registered to me. Please manually review ownership of this Vercel-hosted application subdomain; I am not claiming ownership of vercel.app itself.

### Additional reviewer information

LearningMap provides personalized learning roadmaps. Google Calendar connection is optional and separate from sign-in. The calendar integration creates timed study sessions only after the user selects Add sessions, and reads matching LearningMap events only to prevent duplicate imports. Access tokens are held in encrypted HTTP-only cookies for up to one hour; no refresh token is retained. Google Calendar data is not sent to Gemini or used for advertising or AI training. Privacy disclosure: https://learning-map-provider-bice.vercel.app/privacy.

See [the prepared recording script](google-oauth-demo-script.md) for the required real workflow. Google requires an unlisted YouTube demo that includes the OAuth grant process, app name, client ID in the browser address bar, and actual sensitive-scope functionality. A storyboard or simulated video is not a substitute. The account owner must handle the unverified-app warning and consent; the approved Calendar insertion has not happened yet.

Official requirements: https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification


## Follow-up live verification on 5 October 2026

The account owner completed fresh consent. The approved temporary roadmap imported exactly one event on Monday 12 October 2026, 09:00–10:00 Asia/Calcutta. Google Calendar displayed the stage title and a 60-minute session. Retrying the identical schedule left one matching event, confirming live duplicate prevention. The specific test event was deleted afterward; Google Calendar search returned no results. The app connection was disconnected. This supersedes the earlier pending-insertion observation. The temporary roadmap remains available for recording; original roadmaps were not changed.

Two unrelated authorised domains, antigravity.google and backend-capstone-llm-metering-pied.vercel.app, were removed and the branding changes saved. The production LearningMap, configured preview and Supabase domains remain. The newly opened verification draft reflects these changes and includes an ownership appeal and live-test evidence. Confirm is still disabled for missing scope justification and demo video because Data access cannot save the prepared justification without a valid YouTube URL. No review has been submitted and the app is not Google-verified.

The available browser tooling supports screenshots but has no video-recording capability. Existing screenshots prove the integration test, but cannot replace Google's required video showing the actual OAuth consent flow and client ID. The account owner must supply an unlisted recording URL using the prepared script. Once available, save it together with the justification and complete the review submission, subject to the final attestations.
