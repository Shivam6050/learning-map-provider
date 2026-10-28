# Weekly reminder reliability

## What changed

The weekly reminder route now distinguishes finishing the path scan from resolving email delivery outcomes. Previously, a failed status update could still lead to a successful response; the next request could also report success immediately when the scan checkpoint was complete, hiding unresolved claims.

- Every completed scan now checks this week's durable delivery ledger. Any `claimed` or `uncertain` record produces HTTP 503 with `reason: delivery_unresolved`, even on later requests.
- A failed or zero-row delivery-status update returns a structured 503 before advancing the checkpoint.
- Checkpoint failures, including after a successful email send and at final completion, are caught and reported consistently.
- The database claim and provider idempotency key are retained. Neither an error response nor a retry deletes claims or automatically resends uncertain emails.
- All responses use private/no-store caching. Logs contain operation codes, period, aggregate counters and elapsed time, never recipient addresses, roadmap IDs, provider payloads or credentials.
- Database requests in this route have bounded abort signals. The existing service client and email provider timeouts still apply; the scan budget is not a guarantee against a hosting platform terminating an in-flight request.

## Reading results

Look for `[cron/weekly-reminders]` in the deployment's server logs. No new external alert service or webhook was enabled.

`sent`, `claimed` and `uncertain` count work in the current invocation. `sent` means the provider accepted the send request, not that the email reached an inbox. `outstanding` counts unresolved delivery records across the current week. `incomplete` describes the path scan, not email delivery.

A 200 with `outstanding: 0` means that the scanned week's recorded deliveries have no unresolved claims. It does not verify inbox delivery, email authentication, or that the scheduler actually invoked the route on time.

A completed scan can return `incomplete: false` and HTTP 503 when deliveries need attention. A concurrently active sender may temporarily leave a `claimed` row; this is unresolved work, not proof that delivery failed.

## Recovery

1. For `configuration` or `email_not_configured`, check the server-only database and chosen email-provider settings. Never paste secrets into logs or issue reports.
2. For `checkpoint_read`, `candidate_read`, `recipient_read`, `delivery_claim`, `checkpoint_write`, or `delivery_summary`, check service availability and schema permissions. After resolving the cause, the normal scheduled run can resume from its checkpoint.
3. For `delivery_status_write`, `email_send`, or `delivery_unresolved`, compare the retained ledger with the provider's delivery logs in the private administration consoles. A send may have succeeded even when the request or status write failed. Do not delete claims or blindly retry messages. Reconcile only after checking provider evidence.
4. For `time_budget`, the next scheduled invocation resumes scanning. Monitor repeated incomplete scans; they indicate throughput or provider latency needs attention.

The route is protected by the existing cron secret. Public health checks still report database reachability only. This change does not introduce a public operations dashboard or expose delivery data to learners.

## Release boundary

No new migration, provider subscription or environment variable is required. Deploy the updated application to activate the fix. Tests use mocked email delivery and simulated database failures; no production email/SMS or reminder run was triggered during implementation. Successful production scheduling and delivery still need separate evidence.

Validation completed: 35 cron/email regression tests, targeted ESLint, TypeScript, and the production build all passed.
