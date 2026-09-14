# Security review — 2026-09-14

Status: partial review with fixes; NOT a penetration-test certificate or launch approval.

## Fixed in code
- Progress/note actions now bind the stage to the submitted path using user-session RLS before writing; identifier and 10,000-character note validation added.
- Authentication callback no longer trusts x-forwarded-host and rejects backslash/control-character redirect tricks.
- Missing service-role configuration throws instead of silently returning successful empty database operations.
- Login messages no longer recommend disabling CAPTCHA. Password inputs capped at 128 characters.

## Database fix awaiting application
Apply supabase/migrations/010_security_boundaries.sql in Supabase SQL Editor. It removes direct client writes to generated option JSON, requires ownership of a stage's parent path for progress access, makes individual rating rows private, and pins privileged helper function search paths. Existing saved paths are not deleted.

The prior pending-options policy allowed authenticated clients to modify their own generated JSON, bypassing server curation before service-role confirmation. Stage-progress ownership only checked the row's user_id, not ownership of its referenced stage. Application checks alone cannot protect direct REST calls; migration 010 is required.

## Verification
TypeScript passed; 67 tests passed, one live-provider test skipped. Anonymous read probes returned no rows or denied access on profiles, learning_paths, stages, stage_progress, pending_path_sets and resource_ratings. Empty tables alone do not prove RLS correctness. Cross-account allow/deny tests must run after migration 010.

## Outstanding before public release
- Apply migration 010 and test owner versus second-account select/insert/update/delete and role escalation using disposable test accounts.
- Review all deployed database policies/functions and storage buckets; local schema may differ from deployment.
- Server URL checks reject obvious local IPs but do not pin DNS resolution. DNS rebinding/private-address resolutions remain an SSRF risk for arbitrary discovered URLs. Use isolated outbound fetch workers with egress restrictions before untrusted broad discovery at scale.
- Configure and test CAPTCHA, email verification, auth rate limits and session revocation in Supabase. Application quotas are not a substitute for edge abuse/DDoS controls.
- Review CSP with nonces in a production browser, dependency advisories, all authentication recovery flows, provider webhook redaction, secret rotation procedures, and backup restore.
- No active attacks, account deletions, or changes to real learners' data were performed. No assurance of zero vulnerabilities is made.

## Dependency and logging follow-up
Upgraded Next.js and eslint-config-next to 16.3.5 and applied compatible npm audit fixes. npm reported zero known dependency vulnerabilities after the update (2026-09-14). This is advisory coverage, not proof of exploit immunity. Error reporting now redacts configured secret values and sensitive URL parameters and omits stack traces from webhook payloads.
