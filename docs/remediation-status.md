# Remediation status — 25 September 2026

## Implemented

- Atomic, retry-safe roadmap persistence; database rollback and retry verification passed.
- Owner-scoped stage progress saves and note timestamps.
- OAuth country completion, stronger profile-save errors, and reauthentication for deletion.
- Currency changes require a new budget; regional course lookup retains subscription billing periods.
- Server-side assessment grading, eight questions per field including applied scenarios, and distinct intermediate/advanced curricula.
- Eighteen curricula published to Supabase; weekly refresh endpoint prepared for deployment.
- DNS-pinned public resource requests, bounded response sizes, and redirect validation.
- Reminder opt-out and database delivery claims to suppress duplicate sends.
- Database-aware health endpoint, stricter typing, CI checks, and bounded build workers.

## Verification

- Original application unit suite: 28 files; 113 passed, one live-provider test skipped. Nested .kilo worktree copies are excluded from discovery.
- Atomic-save rollback, stable retry IDs and preserved completion verified in a rolled-back database transaction.
- Three new database migrations applied to the linked project.
- Database security advisor confirms trigger-function permission and search-path findings resolved.

## Remaining release work

- Application edits are local, not deployed. Deploy only after reviewing changes and passing the final build.
- Configure a verified Resend sender domain; the current test sender is unsuitable for general public delivery.
- Apply supabase/templates/magic-link.html to the Supabase magic-link email template and test the account-deletion email-code flow. Preparing the file does not configure the hosted Auth service.
- Remove production SMS test OTP entries before enabling public phone verification. The CLI did not apply the attempted expiry setting.
- Review leaked-password protection and MFA options. The is_admin function remains callable intentionally because RLS policies require it; it only reports the current caller's admin status.
- Authenticated browser regression checks, real email/SMS delivery and destructive account deletion have not been exercised. Browser automation was unavailable.
- Calendar support is an ICS import, not automatic Google Calendar insertion or ongoing sync.
- Regional checkout prices cannot be guaranteed without provider-supported regional feeds. Unknown quotes must not be presented as confirmed prices.
- No high-concurrency capacity claim is supported by these tests. Reminder processing remains bounded per invocation and needs a durable cursor/queue before a large backlog.

## Additional release checks

- Production dependency audit: zero known vulnerabilities (`npm audit --omit=dev`).
- Email delivery now requires an explicit non-test sender; reminders skip unverified email addresses.
- Account deletion revokes refresh sessions before deleting the identity and stops if revocation fails. Access JWTs still expire normally; this does not claim immediate JWT invalidation.
- Six focused email/deletion regression tests passed without sending mail or deleting users.
- The live Scrimba provider check was explicitly run and FAILED: the public pricing HTML returned HTTP 200 but contained neither the required annual billing amount nor the regional price marker. Do not claim live Scrimba price synchronization works. The quote remains unknown rather than using a fabricated price.

## Hosted Auth configuration handoff

Browser automation could not initialize on this machine. CLI configuration diff did not recognize the email body or SMS test-code expiry patch; neither was applied.

1. In Supabase Authentication > Email Templates > Magic Link, paste the contents of `supabase/templates/magic-link.html` and save. It includes both the one-time token and the existing sign-in link.
2. In Authentication > Providers > Phone, remove all test phone/OTP entries before public phone verification is enabled. Keep the existing real Twilio credentials private.
3. Verify a sending domain in Resend, then configure a sender on that domain in Supabase SMTP and in Vercel `EMAIL_FROM_ADDRESS`. Keep `RESEND_API_KEY` server-only. Merely setting a non-test address does not prove domain verification.
4. Check signup email, password reset, Google callback and deletion-code delivery using a dedicated test account. Check SMS delivery only when configured; it may consume provider credits.
5. Deploy the reviewed candidate and repeat authenticated flows. Do not remove email confirmation to work around delivery problems.

- Final release build passed compilation, TypeScript and static page generation.
- Read-only local production smoke checks: login/signup HTTP 200; dashboard anonymous redirect; settings streamed login redirect with no profile form; health HTTP 200 with no-store; unauthenticated reminders endpoint HTTP 401. Temporary server stopped after checks.
- These HTTP checks do not replace authenticated interactive browser testing.

## No-domain email alternative

Brevo support is implemented for application reminders; five email tests pass. See `docs/brevo-setup.md` for Supabase SMTP and sender verification. The user has no domain, so the verified Resend-domain plan is superseded by Brevo Free with temporary sender rewriting. Provider activation, credentials, hosted configuration and live delivery are still pending.
