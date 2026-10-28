# Roadmap resource replacement and reports

## Release steps

1. Apply `supabase/migrations/20261025174543_roadmap_resource_management.sql` to the hosted project before deploying the application changes. This is an additive, rerunnable migration: three private tables and four service-only functions. It does not modify existing accounts, roles, paths, courses or progress.
2. Completed on 26 October 2026: the owner-designated, verified account was promoted through the existing `profiles.role` mechanism. The first-admin bootstrap used a short, exclusive-lock transaction; the role-protection trigger was restored before commit and verified enabled. Admin access also permits the existing trusted-source approval workflow.
3. Deploy the application. Open a saved roadmap, expand a stage and use “Change resource or report a problem”. Verify with an owner-approved test roadmap. The administration route is `/admin/resource-reports`, linked from trusted-source administration.

## Replacement behaviour

Alternatives come from exact curated catalog URLs matched to the stage topic and learning field, plus the owner's previous resources in this stage. No AI call or arbitrary learner-supplied URL is accepted. Only allowlisted resources enter the pool; links and regional prices are rechecked before saving. Unavailable alternatives are excluded, and the choice is validated again on the server rather than trusting the radio input.

The preview recomputes the whole roadmap's purchase estimate with existing subscription deduplication. Free alternatives remain available when another course price is unknown. Paid options whose price is unknown or whose total cannot fit the budget require explicit existing-access confirmation. This is self-reported access, not payment verification. Within-budget paid recommendations still require purchase at the provider; LearningMap does not charge the learner.

The database transaction binds the authenticated user, owned path, stage, old resource, replacement, and current pace/budget/currency. It changes the existing resource slot, preserving order and primary status, and records private replacement history. Concurrent or stale changes fail. Notes, topic/project completion, stage status and completion timestamps remain intact. Confirmed access is merged into the latest progress JSON for matching resources in this roadmap, rather than replacing the JSON document.

Broken resources remain visible as unavailable, non-clickable cards so their owner can replace/report them. They are excluded from purchase estimates and resume links. Curriculum stages, estimated stage hours and imported calendar events are unchanged.

## Feedback workflow and boundaries

Reports identify a stage/resource and one of: broken link, wrong price/billing period, outdated content, difficulty mismatch, or other. Details are limited to 1,000 characters. Active duplicates are acknowledged without another row. A resolved issue can be reported again; previous review records are retained.

Learners can check their own recent report statuses and review notes from the resource controls. Administrators can filter/paginate the private queue and mark reports reviewing/resolved/dismissed with a 500-character note. Review updates compare both status and the previous review timestamp, including same-status edits. Drafts are controlled inputs and survive failed submissions.

An ordinary report does not change the shared course price, hide a resource for everyone, approve a publisher or resolve the issue automatically. Admin review records the outcome; actual price/link maintenance uses the existing provider verification and catalog process. No email, SMS or external calendar action is sent by this workflow.

The new history table is owner-readable, the report table is owner/admin-readable, and quota rows are service-only. Authenticated/anonymous clients have no direct write grants or RPC execution permission. The privileged server actions authenticate/authorize every request. Functions use invoker security and an empty search path. Account/path cascades remove the related personal records.

Limits are persisted and enforced transactionally: 20 provider lookups per user in 10 minutes, 30 replacements per user in 24 hours, and 20 new reports per user in 24 hours. Provider checks happen outside the short mutation transaction.

## Validation

Unit tests cover trusted matching, owner binding, unsupported selections, tampered prices, self-reported access, unverified links/prices, lookup limits, report validation, private status reads, and admin authorization/version checks.

The migration and SQL fixture suite ran in isolated local PostgreSQL (PGlite 0.5.11), not against the production database. Tests cover rerunning the migration, RLS, grants, duplicate/recurrent reports, quotas, stale edits, same-status review conflicts, exact resource-slot preservation and progress JSON preservation. Fixtures are rolled back.

To reproduce, install `@electric-sql/pglite@0.5.11` in a separate audit folder and run:

```text
node scripts/test-resource-management-sql.mjs /absolute/path/to/@electric-sql/pglite/dist/index.js
```

`supabase/tests/resource_management_bootstrap.sql` is a minimal LOCAL test harness, not a migration. Never run the bootstrap or synthetic fixture suite on the hosted project. Production fixture testing was rejected by automatic approval review because temporary auth-user and role mutations carry side-effect risk even with rollback.

Release verification: 635 unit tests passed, one live-provider check skipped; lint, TypeScript and the production build passed. Mobile sample-data checks confirmed no horizontal overflow, correct unknown/owned-price previews, and preserved report drafts on signed-out submission. The temporary preview route and generated development cache were removed before the production build. Hosted schema activation and owner-authorized administrator designation completed on 26 October 2026. Read-only verification confirmed all three tables have RLS, owner/admin SELECT policies, no anonymous access or direct authenticated writes, and all four RPCs are invoker functions with an empty search path and service-only execution. Database advisors reported no warnings on these new objects; the existing RLS performance warnings were subsequently cleared by the 26 October database-policy release; native Auth leaked-password protection remains disabled. The designated account has verified MFA enrolled; a simulated session without MFA correctly cannot read its profile or pass is_admin(). The saved admin role is confirmed, but browser access must be checked after the owner completes MFA. Application changes still need deployment.
