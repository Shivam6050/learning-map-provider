# Google OAuth verification preparation

Status: not submitted; Google approval is outstanding.

Current project branding is Google Workspace MCP Servers, with domains and scopes for other integrations. Do not rename or remove scopes until project ownership and reuse are confirmed. A dedicated LearningMap project avoids changing other clients.

Required preparation:
- LearningMap branding and verified support/developer email.
- Public homepage, privacy policy, and terms on a domain whose ownership can be verified through Google Search Console.
- Only scopes used by LearningMap: identity scopes for sign-in, and calendar.events.owned for optional calendar imports. Confirm the Cloud Console scope classification before submitting.
- A demonstration video showing sign-in, explicit Calendar consent, scheduling preferences, event insertion, and resulting timed events. Do not include secrets or unrelated personal events.
- Calendar scope justification: LearningMap creates the user-requested study schedule in their primary calendar and reads matching deterministic event IDs only on import retries to avoid duplicates. No background sync or unrelated calendar scan.
- Test the live integration before recording or asserting it works. Complete any reviewer access instructions truthfully.

The privacy policy now documents actual Calendar data use and connection retention; deploy it before submitting. Google reviews the submission; publishing is not verification. Final submission or new public access may require confirmation in browser.
