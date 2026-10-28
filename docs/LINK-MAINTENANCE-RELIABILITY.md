# Link maintenance reliability

## Fix

Link checks now count a resource as checked only after its update returns the matching resource ID. An update that affects no row, a database error, or a transport rejection is reported as an unconfirmed write rather than successful maintenance.

All writes in the current concurrency batch settle before the verifier returns or throws. If some writes fail, the error carries confirmed progress from earlier batches and successful writes in the current batch. The route adds that progress once, returns HTTP 503 with `reason: resource_persistence`, and stops scheduling further batches.

Database initialization is now inside the failure boundary. Missing total or backlog counts no longer become a misleading zero. All responses use private/no-store caching; monitoring receives only a fixed operation name, never the original database/provider error containing possible URLs, credentials or personal data.

## Result fields

- `checked`: resource checks whose persistence was confirmed in this invocation.
- `broken` and `unknown`: subsets of those confirmed checks. An inconclusive check still preserves the previous stored link status, as before.
- `failed`: writes not confirmed in the failed batch. A response timeout can occur after a database commit, so this is not proof that a row remained unchanged.
- `remaining`: available on a successful backlog count, including ordinary capacity-limited runs.
- `incomplete`: true when work remains or the run failed.
- `reason`: the fixed operation that failed, such as `configuration`, `resource_count`, `candidate_read`, `resource_verification`, `resource_persistence`, or `backlog_count`.

The existing batch cap, cron authorization, concurrency bound and 14-day due filter remain in place. A capacity-limited run can still return 200 with `incomplete: true` and `capacityWarning`; operators must inspect those fields rather than interpreting every 200 as an empty backlog.

## Recovery and limits

Investigate database availability and service permissions for persistence failures. Subsequent scheduled runs select resources still due using their saved timestamps; do not manually rewrite timestamps to make a failed job appear complete. A resource deleted during verification can produce a zero-row update and a visible failure rather than an inflated success count.

No new schema migration, environment variable, paid monitoring service or notification integration is required. No hosted maintenance run, production resource update, provider message or database migration was performed during this fix. Local tests mock provider and database calls; they do not establish live provider availability or successful production scheduling.

Validation passed: 64 related maintenance, link-check and email regression tests, targeted ESLint, TypeScript and the production build. The application changes are ready for deployment; these checks do not replace live scheduling evidence.
