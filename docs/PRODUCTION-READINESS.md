# Production release gates — 2 October 2026

Production readiness is not cleared by unit tests alone. The current status lives in [remediation-status.md](remediation-status.md); previous audit reports remain historical.

## Implemented protections

Authenticated generation, owner-scoped pending options, server-side assessment grading, atomic per-user/global attempt quotas, source URL validation, regional quote checks, retry-safe roadmap writes, explicit cron authorization, bounded maintenance and reminder checkpoints are implemented. Quota installation was verified previously; do not treat old “migration not applied” notes as current evidence. The new atomic rating migration is still staged for coordinated deployment.

## Required release checks

- Deploy the reviewed production build with the rating migration; verify the actual deployed commit and all maintenance schedules.
- Run dedicated authenticated journeys covering email confirmation, Google callback, recovery, generation/selection, saved path ownership, notes/progress, course ownership, resume and calendar insertion. Check actual email delivery and reminder opt-out. SMS verification remains intentionally disabled.
- Verify cron secrets, maintenance backlog, editorial due reports, reminder checkpoints and provider allowances. A timeout-bounded daily worker has finite capacity: increase capacity or use additional authorized runs/a worker when reported throughput falls below the maintenance target.
- Complete Google's branding and Calendar scope verification; a published OAuth app is not an approved app.
- Perform backup/restore rehearsal, cross-user RLS tests and staging query/concurrency checks. Record incident ownership and recovery targets.
- Use staged authenticated load tests at agreed traffic levels with multiple accounts. Current generation is synchronous; durable jobs/workers and measured provider budgets are still needed before a large-scale claim.
- Roll out gradually and retain a compatible rollback build. Do not undo additive database contracts while running code depends on them.

## Load probe limitations

`scripts/load-test.mjs` downloads HTML; it does not emulate JavaScript, AI generation or database writes. A successful liveness probe does not establish real user capacity. Use staging and explicit test accounts; avoid experiments against production provider credits or personal data. Keep session cookies private.
