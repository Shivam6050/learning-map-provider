# Maintenance operations

## Broken links

`/api/cron/check-links` requires CRON_SECRET and runs daily. Each invocation uses a 40-second work budget inside a 60-second route, five concurrent checks and a maximum of MAX_LINK_CHECKS_PER_RUN (default 1000, maximum 5000). Resource timestamps form the durable work queue: finished records leave the due set and subsequent invocations continue oldest first. Unknown checks preserve the previous link status and advance the check timestamp; provider unavailability is not evidence of a broken link. Persistence errors return 503 rather than claiming success.

The response reports checked/broken/unknown, remaining backlog, dailyTarget (catalog size / 14 days), capacityWarning and incomplete. A normal remaining backlog is not itself a failed invocation. If capacityWarning persists, configure more authorized runs or move maintenance to a worker with adequate hosting/provider limits. The cap is not a throughput guarantee. Concurrent invocations may repeat checks, though updates are idempotent; avoid launching overlapping manual runs.

## Coverage reviews

`/api/cron/review-coverage` requires CRON_SECRET and runs weekly. It reports provider pages due for human syllabus review, with a 14-day notice before the 90-day expiry. Dates are never automatically renewed. Expired mappings are withheld and labelled in the roadmap. Follow the editorial workflow in remediation-status.md. Cron output and warnings appear in hosting logs; no external alert service or outgoing notification was configured by this change.

## Curriculum identity

New saved paths persist authored curriculum_ref.id/version in the existing practice JSON document. Guidance and topic validation resolve this identity ahead of display titles. No database migration or automatic rewrite of old user paths is needed. Keep old versions when publishing changed outcomes. Custom stages without an authored identity use general guidance; they do not acquire invented detailed curricula.

## Candidate verification — 2 October 2026

288 tests passed, one live-provider test skipped. Production build, changed-code lint and diff whitespace checks passed. Isolated headless Edge tests passed at 1440, 390 and 320 pixels using actual roadmap components and mocked server actions: keyboard expansion, topic/milestone interaction, coverage table, resume navigation, next-stage opening and no document overflow. These do not replace live authenticated or cron deployment checks. No paid provider requests, production messages or database migrations were performed for this maintenance batch.
