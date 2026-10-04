# LearningMap Google verification demo — recording script

Prepared 5 October 2026. Status: recording plan ready; no video recorded or uploaded, live Calendar insertion and retry verified, no Google review submitted.

## Recording setup

Use a dedicated test roadmap and the consenting owner's account. Set browser and Google Account UI to English. Record readable browser content and the address bar at 1080p if available. Hide notifications, bookmarks and unrelated personal events. Do not record passwords, OTPs, tokens, client secrets, environment variables or the OAuth callback code. Leave the public OAuth client ID visible on the Google authorization screen as required by Google. Pause recording for password entry and the callback transition; resume on the app's success screen.

Project: project-a1137c70-4ead-4c48-aa3

LearningMap web client ID: 214519630977-ngpban563pc266v499esgupc9bk5aoom.apps.googleusercontent.com

Homepage: https://learning-map-provider-bice.vercel.app/

Privacy: https://learning-map-provider-bice.vercel.app/privacy

Terms: https://learning-map-provider-bice.vercel.app/terms

Calendar callback: https://learning-map-provider-bice.vercel.app/auth/google-calendar/callback

Review the project's Clients page before filming. Google's form requires coverage of every OAuth client assigned to the project. Do not delete other clients casually or imply this recording covers an untested client.

## Shots and narration (about 3–4 minutes)

| Time | Show | Narration |
| --- | --- | --- |
| 0:00–0:25 | Public LearningMap homepage and visible privacy/terms links | "LearningMap helps people follow personalized learning roadmaps. Connecting Google Calendar is optional and separate from signing in." |
| 0:25–0:50 | Sign-in entry point and the actual sign-in flow, omitting password entry | "A learner signs in to their own LearningMap account. Their roadmap belongs to that account." |
| 0:50–1:15 | Open the temporary one-stage roadmap and Add to calendar | "This test roadmap requires one hour per week. The learner chooses when to study before importing a schedule." |
| 1:15–1:55 | Connect Google Calendar, account choice, warning and consent in English; keep app name and client ID visible | "The learner explicitly connects Google Calendar and reviews the permission to manage events on calendars they own. The account owner handles this warning and decides whether to grant access." |
| 1:55–2:15 | Returned roadmap; connection status, selected weekdays, date, start time and timezone | "The connection is temporary. Choose one Monday session from 09:00 to 10:00 in Asia/Calcutta, starting on a future Monday. The app has not added anything yet." |
| 2:15–2:45 | Click Add sessions once, show the actual success count, then show that event in Google Calendar | "Selecting Add sessions creates this timed study session in the connected account's primary calendar. Its title and description come from the roadmap, and its duration follows the learner's study hours." |
| 2:45–3:10 | Retry the exact same schedule, show existing-session result; verify one event remains | "An identical retry preserves the existing LearningMap event. The app reads only the matching deterministic event ID to verify a duplicate; it does not scan unrelated events." |
| 3:10–3:35 | Disconnect control and privacy section | "Tokens are encrypted in a user-bound HTTP-only cookie and expire within one hour. The app retains no refresh token. Calendar data is not sent to Gemini, sold, used for advertising or used to train AI models. Disconnect ends the app's temporary connection; previously imported events remain in Google Calendar." |

Record what actually happens. If consent, insertion or retry fails, stop and fix it before filming; do not narrate a success that did not occur. Show the unverified-app screen while the review is pending. Only the account owner should advance that warning and approve consent.

## Test and cleanup

Use a future study date at recording time. The current approved fixture is "LearningMap release check — temporary", with one one-hour stage and one hour per week. The pending date is 5 October 2026, 09:00–10:00 Asia/Calcutta; choose a later Monday if that time has passed. Do not import a full real roadmap for this demo. Only one temporary event is approved. A repeated identical import must not create another event. Remove the specific temporary event and fixture after the check; never alter original roadmaps or unrelated calendar entries.

## YouTube and submission

Suggested title: LearningMap — Google OAuth and Calendar scope verification demo

Suggested description: Demonstration of LearningMap sign-in, explicit Google Calendar consent, user-selected timed study session import, duplicate prevention, and disconnection. Scope: https://www.googleapis.com/auth/calendar.events.owned. Homepage and privacy policy: https://learning-map-provider-bice.vercel.app/ and /privacy.

After reviewing the recording for exposed credentials and unrelated user information, upload it to YouTube Studio with Visibility set to Unlisted. Anyone with the link, including Google reviewers, can view it. Review the exact video before authorizing upload. Do not use a placeholder URL. Confirm that the final video plays without additional permission.

Paste the actual video URL into Google Auth Platform > Data access > YouTube link, save it with the prepared scope justification, and reopen Prepare for verification. Re-enter the ownership appeal and additional information from google-oauth-verification.md if browser drafts were lost. Review the resulting scopes, domains and attestations before final submission. Publishing the OAuth audience does not mean Google has verified the app.

Requirements: https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification

Client inventory verified 5 October 2026: Google Cloud lists one OAuth web client, Learning-map, with the client ID above. The recording can cover this client through both website sign-in and the separate Calendar connection flow. Recheck the inventory if the project configuration changes.


Live test completed 5 October: the fixture produced one session on 12 October, 09:00–10:00 Asia/Calcutta; identical retry preserved that one event. The event was then deleted and the browser connection disconnected. The fixture remains for recording. When recording a new insertion, choose a different future study date: reusing the deleted event's exact schedule encounters Google's cancelled-event tombstone, which LearningMap deliberately does not overwrite. No demo video has been recorded by the automation.
