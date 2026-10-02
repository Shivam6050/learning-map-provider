# Current remediation status — 2 October 2026

This is the current checklist. Older dated audit reports are historical evidence, not the deployed release status. Local implementation, hosted configuration and live verification are separate.

## Implemented locally

- Owner-scoped, retry-safe roadmap persistence and progress/notes saves.
- Three budget tiers; paid offers must match explicit country and currency evidence. Unverified offers remain unknown and are excluded from budgets. Scrimba annual access is counted as an upfront shared subscription.
- Topic checks, project milestones, course coverage, resumable learning and roadmap overview. New saved canonical stages persist a curriculum ID and version; title-only lookup remains for legacy paths. Custom stages retain clearly labelled general guidance.
- Transactional rating save with ownership/membership checks and a serialized average. The rating SQL migration is prepared and verified in a rolled-back test, not permanently applied.
- Link maintenance runs multiple bounded batches, prioritizes oldest checks, persists each check, and reports backlog, daily target and insufficient capacity. Weekly editorial coverage maintenance reports reviews due within 14 days and expired reviews without renewing claims automatically.
- Google Calendar timed-session insertion with retry-safe event IDs, plus ICS export for other calendar applications. This is an import, not ongoing synchronization.
- Authentication email configuration and Brevo application email support. Mobile verification is intentionally paused at the user's request.

## Previously observed hosted configuration

Supabase quota RPC and relevant roadmap columns were verified read-only. Brevo configuration, Google Calendar API/callback and calendar cookie key were configured in earlier work. Google OAuth audience was published with approval and Search Console ownership was verified. Google branding/sensitive-scope approval remains outstanding; publishing is not verification. Current delivery and configuration must be retested before a public release.

## Verification evidence

See `roadmap-verification.md` for actual component tests at 1440, 390 and 320 pixels and their limitations. See `rating-and-regional-pricing-release.md` for the rating migration and market-evidence changes. Tests and build results are reported for the current candidate after each change; older counts are not current release gates.

Interactive authenticated browser tooling is unavailable on this machine. Fixture browser tests and mocked provider tests do not establish live account, calendar, email, cross-device or provider behavior.

## Remaining release gates

1. Review and deploy this candidate with its required rating migration in a coordinated window. New maintenance schedules require deployment; no new schema is needed for the medium-priority maintenance changes.
2. Test signup/email confirmation, Google sign-in, password recovery, notes/progress, owned courses, cross-account denial, cross-device resume and actual Calendar insertion using dedicated test accounts.
3. Verify Brevo authentication/reminder delivery and cron authorization/configuration. SMS testing remains deferred.
4. Finish Google verification when branding/reviewer requirements are met; never represent it as approved prematurely.
5. Confirm regional provider evidence and personalized-offer limitations. No supported personalized checkout feed has been configured.
6. Establish operational capacity through staging tests, provider allowance checks, backups/restore and monitoring. The application still performs synchronous generation; no claim of lakhs or crores of concurrent users is supported.

## Editorial workflow

The protected `/api/cron/review-coverage` endpoint runs weekly and returns due/expired provider-source URLs. Inspect Vercel cron logs or call it with server-side CRON_SECRET. Review the actual provider syllabus, update only supported topic mappings and checkedAt in `lib/paths/coverage.ts`, run tests, then deploy. Do not update dates merely because a page responds successfully. Expired reviews remain visibly labelled and their mappings are withheld.

Keep curriculum IDs unchanged when renaming titles. For materially changed outcomes, retain the old unit/version and publish a new version; do not silently reinterpret existing completed checks. New saves retain the chosen ID/version in owner-scoped practice data. Legacy paths are not rewritten automatically.
