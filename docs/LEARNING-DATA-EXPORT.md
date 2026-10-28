# Learning-data export

Implemented 26 October 2026. Application changes are local; deploy to enable the feature. No database migration or provider configuration is required.

## Where to find it

- Account Settings: download all saved roadmaps.
- Saved roadmap: expand **Download roadmap & notes** to download that roadmap only.
- Choose Markdown for a readable record or JSON for structured data (`schema_version: 1`).

Exports include roadmap title, level, weekly commitment, original budget/currency, stages, resource references, saved notes, practice prompts, topic completion, project milestones, authored project briefs, and per-roadmap ownership confirmations. Older saved check IDs are preserved even when their curriculum version is unavailable.

This is a learning record, not an account backup, certificate, purchase receipt or import/restore feature. Account profile/contact data, authentication material, raw provider metadata, ratings, library entries, and calendar connections are outside this export's scope. Course prices are deliberately omitted because stored values may be stale. Progress/ownership remain self-reported.

## Access and handling

`GET /settings/export?format=json|markdown&path=<optional roadmap UUID>` validates the real session and enrolled MFA, uses the user's Supabase session client/RLS, explicitly filters roadmap and progress ownership, and restricts child reads to returned owner paths. It never uses a service-role client or accepts an owner ID from the request. An inaccessible roadmap returns the same 404 as a missing roadmap.

All responses are private/no-store, noindex, no-referrer and nosniff. Successful downloads use fixed, nonpersonal attachment filenames. Cross-site browser requests are denied. Errors do not include database diagnostics or produce an attachment. The UI prevents duplicate clicks and supports retry and sign-in/MFA recovery.

The export allowlists fields instead of serializing complete database objects. Markdown escapes HTML and Markdown control characters in notes/titles, so saved text is not rendered as raw HTML or embedded images. Downloads still contain personal notes and should be kept private.

Reads are paginated with exact counts and stable ordering. Missing pages, changed counts, and database errors fail explicitly. All-roadmap exports are bounded to 100 roadmaps, 2,000 stages, 10,000 resource references, and a 3 MB final response; oversized accounts can export individual roadmaps. Data is read across several queries, not a transactionally frozen snapshot. Avoid editing roadmaps during a download.

## Validation

- 26 focused tests cover export preservation, old curriculum data, Markdown escaping, missing joins, pagination caps/failures, explicit ownership filters, sign-in/MFA, forged owner inputs, private headers, fixed filenames, oversize files, and safe errors.
- Full unit suite: 705 passed, one existing live-provider test skipped.
- Scoped ESLint passed.
- Hosted schema probe validated required columns/joins with `WHERE false`; no personal data was returned or modified.
- Authenticated download/browser smoke testing remains a deployment check: download JSON/Markdown from Settings and one roadmap, inspect notes/checklists, and confirm a signed-out request cannot download data.

Relevant framework docs were read from installed Next.js 16.3.5. Pagination follows the current [Supabase range documentation](https://supabase.com/docs/reference/javascript/range).
