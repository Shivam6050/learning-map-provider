# Saved-template refresh reliability

## Refresh boundaries

The scheduled refresh reserves 30 seconds for verifying the authored resource pool. Before every six-resource batch and after the final batch, the publisher checks that deadline. If verification runs out of time, it stops before database publication. A started batch can finish using the existing per-request timeouts; this is a bounded scheduling budget, not an instantaneous cancellation of all work.

Each database request has a three-second abort signal. The route retains its 60-second maximum duration, with time reserved for the active verification batch, database calls and error reporting. The manual CLI remains available without the cron verification deadline for a larger catalog; its default mode remains read-only validation.

Every stage must retain a verified resource. Stored null, empty, boolean or paid prices no longer pass as free through numeric coercion. Templates are validated against the loader's structural contract before insertion. The entire version is inserted in one request; previous versions are not deleted. Confirmation checks field/level identities and version, not just row count.

## Understanding errors

Responses are private/no-store. Error reporting uses fixed operation names and omits provider/database messages.

- `publication: not_started`: the template insertion was never attempted. Existing template versions were not replaced. Resource registration may already have happened if failure occurred after resource storage began.
- `publication: unknown`: insertion was attempted, or an unexpected error prevents establishing the outcome. A database write may have committed even if confirmation timed out. The response includes the candidate `version` when known.
- `status: published`: the expected field/level entries for that version were read back successfully.

For `verification_deadline` or `resource_coverage`, inspect provider availability and verified stage coverage before retrying. Repeated deadline failures require a longer-running manual publication or future durable background workflow; this patch does not implement resumable verification.

For `schema_check`, `resource_write` or `resource_read`, check database availability and permissions. For `template_validation`, inspect resource identities/prices and authored curriculum structure. For `template_write` or `publication_confirmation`, inspect the candidate version in the private database console before retrying. Never assume a 503 means no new version exists.

## Release scope

No migration or new environment variable is required. Tests use mocked provider/database requests; no production template, resource row, email or scheduled job was changed during implementation. The current production deployment still requires deployment and separate evidence of a successful scheduled refresh.

Validation passed: 71 template and cron regression tests, targeted ESLint, TypeScript and the production build.
