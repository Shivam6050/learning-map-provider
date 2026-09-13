# Production release gates

Status: NOT cleared for production or high concurrency. No capacity claim has been established.

## Implemented in this hardening pass
- Authenticated generation; pending options require the signed-in owner and a valid expiry for both reads and confirmation.
- Production generation quota uses an atomic server-only SQL function. Apply migration 008 before deployment. Missing function fails closed. Development keeps the previous count check.
- Cron endpoints reject requests if CRON_SECRET is absent.
- Monitoring webhook has a three-second deadline; recoverable route error screen added.
- CI type checking and unit tests; read-only load probe with explicit remote target authorization.

## Required before launch
1. Apply migrations on staging and verify cross-account RLS and SQL quota races with two test users. Migration 008 has NOT been applied or integration-tested by this change.
2. Move generation into durable jobs with a dedicated worker, leases, idempotent completion, bounded retries, and status polling. Current generation still runs inside a server action and can exceed hosting deadlines. Do not claim large-scale readiness while this remains.
3. Add a global provider concurrency/cost budget and edge IP abuse limits. Per-user quotas do not stop account farms. Set MAX_GENERATIONS_PER_DAY deliberately (suggest starting at 10).
4. Configure MONITORING_WEBHOOK_URL, CRON_SECRET, provider budgets and production-only secrets. Exercise an alert; verify webhook redaction before sending sensitive production diagnostics.
5. Validate database backups with a restore rehearsal, RLS tests, query plans and connection limits. Record RPO/RTO and incident ownership.
6. Build and deploy a staging production artifact. Smoke-test login, settings, generation, selection, saving, ownership denial, progress and calendar export.
7. Load-test authenticated dashboard and roadmap reads on staging at 10, 50, then 100 concurrent clients. Use multiple test accounts; monitor database, provider quotas, errors and memory. Establish capacity only for measured infrastructure and traffic mix.
8. Roll out gradually with alerts and rollback to the preceding deployment; do not roll back additive schema while deployed code depends on it.

## Load probe
Run node scripts/load-test.mjs for a tiny local liveness baseline. It does not establish user capacity.
Set LOAD_BASE_URL, LOAD_ALLOW_REMOTE (exact staging origin), LOAD_PATHS, LOAD_CONCURRENCY and LOAD_REQUESTS for authorized staging runs. LOAD_COOKIE can hold a test-account session cookie in the environment; do not commit or print it. Redirects are failures so login redirects cannot masquerade as successful authenticated traffic. Default p95 gate is 2000 ms; adjust LOAD_P95_MS for an agreed SLO.

The probe downloads HTML only: it does not emulate client JavaScript, database mutations or AI generation. Use browser journey tests and a job/provider test environment to cover those separately. Never stress a production database or paid generation API as a capacity experiment.


## Verification — 2026-09-14
User applied migrations 008 and 009. Live REST checks confirmed reserve_launch_generation is installed, rejects invalid inputs, and denies anonymous execution. Both quota tables are readable by the service role and block anonymous access. No quota was consumed. Concurrency, authenticated cross-user isolation, and end-to-end generation tests remain outstanding.
