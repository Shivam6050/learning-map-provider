# Database policy release — 26 October 2026

Applied `supabase/migrations/20261025183647_optimize_existing_rls_policies.sql` to the hosted LearningMap project.

## Changes

- Owner identity checks on learning paths, stages, stage-resource links and rating write policies now use statement-level subqueries. Target roles are explicit `authenticated`.
- Catalog reads use the verified database role instead of deprecated per-row `auth.role()` calls.
- Trusted-source administration has separate INSERT/UPDATE/DELETE policies. The overlapping ALL/SELECT policy was removed. Existing admin role checks and restrictive MFA policies remain in effect.
- Removed unused PUBLIC/anonymous catalog grants, inherited column grants, and authenticated TRUNCATE/TRIGGER/REFERENCES privileges. Signed-in users can read resources; trusted-source writes still require an administrator through RLS. Existing service-role maintenance grants were preserved.

No learner, course, progress, account role or MFA data was rewritten by this migration. It runs transactionally with short lock/statement timeouts and can be rerun. Public catalog discovery continues through the existing server API.

## Verification

- Isolated PostgreSQL/PGlite regression suite: 117 assertions passed, including before/after owner isolation, own-path edits, rejected reassignment, admin/non-admin writes, enrolled MFA, service maintenance, table/column grant removal and migration rerun.
- EXPLAIN confirmed an InitPlan for the identity lookup and no per-row auth.uid() in the roadmap plan. This is plan evidence, not a production latency benchmark.
- Existing resource-management SQL regression suite passed.
- New test runner lint and git diff whitespace checks passed. No application runtime code changed in this release, so the previously successful application build was not repeated.
- Live read-only checks confirmed catalog grants, owner policies, all nine existing restrictive MFA policies, the designated admin role, and enabled role-protection trigger.
- Supabase advisors: all eight previously reported performance warnings cleared. The remaining warning is native Auth leaked-password protection being disabled; this migration does not change Auth settings or enable a paid service.
- Reloaded the signed-in production dashboard and opened a saved Full-Stack roadmap; stages and Scrimba, GeeksforGeeks and W3Schools resource cards loaded. The existing Trusted Sources Admin page also authorized the signed-in administrator and loaded. No browser console errors were observed. No progress, notes, reports, ratings, calendar events or external messages were changed.

To reproduce the local SQL checks (never run the bootstrap against a hosted database):

```text
node scripts/test-rls-optimization.mjs /absolute/path/to/@electric-sql/pglite/dist/index.js
```

PGlite 0.5.11 is installed in the separate audit folder, not in application dependencies. The bootstrap snapshots the previous affected policy definitions and extends the minimal local resource-management schema; it does not copy production user data.

## Release state

Database changes are active immediately. The earlier W3Schools partner, roadmap preferences, replacement and report UI changes are still local and require application deployment. Google OAuth verification and provider-supported regional checkout pricing remain external integration work described in the website review.