# Private course library — 26 October 2026

## Release status

Implemented at `/settings/library`, linked from Account Settings and course controls on saved roadmaps. The additive migration `20261026073036_learning_access_library.sql` was applied to project `jkfnjxqournqjvcgihbg`. Application changes are local and require deployment.

## Behavior

- Search reviewed catalog courses and record self-reported ownership, optional expiry, and active/paused status.
- Record Scrimba Pro with a mandatory paid-through date. Only the reviewed Pro modules in the current catalog are covered; future automatic renewals are never assumed.
- Reuse covered access in saved-roadmap purchase estimates, pace previews, and replacement decisions. Coverage must last through the final planned use of a resource, based on remaining hours and weekly pace. Expiry includes the entire UTC day.
- Access can be paused or renewed. Changes do not remove courses, edit notes, reset progress, modify calendar events, or make purchases.
- Existing per-roadmap ownership confirmations remain separate. Expiring library access is never copied into a permanent per-roadmap confirmation when replacing a course.
- Current scope is saved roadmaps. The initial three-option generation/selection estimates retain their existing pricing logic; library deductions appear after saving. Adding an owned-course-aware generation strategy is a separate improvement.

## Data protection

The new table is owner scoped, with the same restrictive enrolled-MFA check as other private tables. Anonymous access is denied. Authenticated clients have SELECT only; writes use an explicitly service-only invoker function after server-side authentication and input validation. Administrators do not receive access to other learners' libraries. Server code derives the owner from the session and ignores submitted owner/price fields.

Database constraints validate entry shape and subscription expiry. A per-owner transaction lock serializes saves, unique indexes prevent duplicate entries, a 200-entry cap bounds reads, and optimistic timestamps prevent stale updates. Catalog courses must be available and allowlisted. Library read failures preserve roadmap availability but never assume a new discount.

## Verification

- 679 unit tests passed; one existing live-provider test skipped.
- 26 isolated PGlite database permission/validation checks passed, including owner isolation, MFA, admin isolation, anonymous denial, direct write/RPC denial, duplicates, stale updates, supported plans, course availability, and entry limits.
- Migration applied twice locally to verify replay safety.
- Scoped ESLint, TypeScript and production build passed; build includes `/settings/library` among 39 generated pages.
- Hosted metadata verified: RLS enabled, both owner/MFA policies installed, anonymous reads disabled, authenticated inserts and RPC execution disabled, service RPC execution enabled.
- No synthetic user entries were inserted in production. Authenticated visual smoke testing of the new deployed page remains a release check.

Local SQL check:

```powershell
node scripts/test-learning-access.mjs /absolute/path/to/@electric-sql/pglite/dist/index.js
```

After deployment: open Account Settings → Course library, add an access entry that you actually have, review the matching roadmap estimate, then pause the entry and confirm its deduction disappears. Do not run the local fixture bootstraps on hosted Supabase.
