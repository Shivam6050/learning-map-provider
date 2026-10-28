# Saved-template loading and fallback

## Behavior

Path generation first reads the latest published, unexpired curriculum and its free resources. These two database reads now share a three-second abort signal instead of each using the service client's default fifteen-second timeout. Expired responses are rejected before the next query or template use. This is a cooperative network timeout, not a guarantee about total request duration or event-loop scheduling.

Missing, invalid, expired, incomplete, or unavailable templates return to the existing generation pipeline. Every stage must retain a usable free resource. Paid, unverified, rejected, broken, and unsafe candidates remain excluded; learner currency remains attached to accepted free resources. The template is checked for expiry again after resource loading. Course discovery, budget selection, quotas and the generation fallback are unchanged.

Database/configuration errors report a fixed operation name through Next.js `after`, keeping the monitoring webhook off the generation critical path. No raw database error, credential, learner data or provider response is forwarded. Outside a supported request context the loader logs the sanitized operation locally. After-response reporting is best effort and remains subject to the hosting platform's execution limits.

## Verification and release

The focused template and onboarding-action suite passes 61 tests across five files. Coverage includes the shared signal, expiry between reads, rejection of late responses, incomplete resource coverage, existing filtering and currency behavior, and deferred sanitized reporting. Targeted lint, TypeScript and the production build also passed. Providers and database calls are mocked; no production generation or external monitoring message was triggered.

No migration or new environment variable is needed. Deploy with the other pending changes, then confirm a normal template-backed generation completes. Monitor `templates/load` operation messages for repeated fallback. A slow database can cause more requests to use the more expensive generation pipeline, so sustained fallback warrants investigation rather than increasing this timeout blindly. This change does not establish a measured end-to-end speed improvement or remove external provider latency.
