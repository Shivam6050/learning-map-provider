# LearningMap website review — 25 October 2026

## Verdict

The sampled core journeys work in the current production deployment. LearningMap already has substantial learning functionality; another visual redesign or a large collection of unrelated features is not the immediate priority. Finish the external OAuth release work, make existing roadmaps adjustable, and give learners a way to report resource problems.

This is a functional and product review with source inspection and automated tests. It is not a fresh penetration test, load test, Lighthouse benchmark, or certification that every production integration works.

## Evidence collected

- Signed-in dashboard: both existing paths loaded. Search filtered correctly, the completed-path filter showed a useful empty state, and clearing filters restored the list.
- Resume learning: the dashboard milestone link opened the corresponding saved roadmap and stage anchor.
- Roadmap: stage accordion opened the requested stage and closed the previous stage. Resource links, prerequisites, topic checks, project milestones, practice notes, ratings, and course coverage controls were present. Existing progress and notes were not changed.
- Assessment: changing the learning field changed the questions. An eight-answer correct frontend assessment returned “8/8 · Expert / Advanced”. No new roadmap was generated during this review.
- Currency: changing INR to USD updated the onboarding budget currency; INR was restored afterward.
- Profile: the country combobox worked, including a narrow viewport. The profile, reminder preference, account-deletion controls, and security settings loaded. An existing authenticator was shown as enabled; it was not modified.
- Agent access: the page loaded and explained password confirmation, verified email, scoped read-only keys, expiry, and revocation. No credential was created or revoked. Unauthenticated requests to MCP and the agent catalog/curriculum endpoints returned 401.
- Calendar: the timed ICS schedule downloaded. It contained 31 sessions totaling 87 hours, with 17 hours in each full week and a final two-hour week, matching the selected commitment. Dates were timed local events, not all-day windows. No external calendar events were created.
- Responsive layout: the sampled roadmap, settings, country picker, and agent-access views had no horizontal document overflow at a 390px viewport. This does not establish compatibility with every phone or browser.
- Public routes: all 11 sitemap pages returned 200 with the expected self-canonical URL, one H1, and no noindex directive. Unknown pages returned 404. Robots and brand-icon assets were reachable. Health reported the database reachable.
- Automated suite: 81 test files passed; 552 tests passed and one live-provider test was skipped. The skipped provider check means this run does not prove live course-price accuracy.

## Release work still pending

### 1. Google branding and Calendar verification — confirmed blocker

Google Cloud currently reports that branding is not shown to users and Calendar data access is not verified. The branding issues panel specifically reports that ownership of the homepage URL was not recognized by the previous verification attempt. The verification centre requires verified/published branding before sensitive-scope verification can proceed.

Next steps: resolve the ownership recognition issue through reverification or Google's additional-review route as appropriate, then complete the consent-and-calendar demonstration video and sensitive-scope review. Do not treat a successful sitemap submission or URL-prefix indexing as proof that OAuth ownership checks have accepted the property. No Google configuration or submission was changed in this review.

### 2. Hosting eligibility for the affiliate business — confirmed plan, policy decision needed

The Vercel project currently displays Hobby. Vercel restricts Hobby to non-commercial personal use. Because this product is intended to earn affiliate revenue, confirm its eligibility with Vercel before commercial launch or choose suitable hosting. This review did not purchase a plan or change billing.

Sources: https://vercel.com/docs/limits/fair-use-guidelines and https://vercel.com/docs/plans/hobby

### 3. Exact regional checkout prices — integration limitation

Current pricing code distinguishes fresh regional quotes, estimates, subscriptions, and unknown prices. That is useful, but a public quote cannot establish every user's personalized checkout discount, coupon, tax, or renewal offer. Exact checkout matching still needs provider-supported regional price data or a permitted partner feed. Keep the checked-at time, billing period, total payable, and final-price-at-provider explanation visible.

Do not replace unknown quotes with fabricated zero prices. Scrimba's free Node.js course is correctly described as free by its official public page; its presence alone is not a paid-course integration bug.

### 4. Operational release evidence — not established by this review

The code has scheduled maintenance and reminder routes, logging, health checks, and automated tests. This review did not establish recent successful production runs of every scheduled job, email delivery, a database restore drill, or real-user performance. Health only establishes database reachability, not end-to-end delivery. CI runs lint, type checks, unit tests, and a build, but does not include a complete authenticated browser journey.

Add a small staging browser smoke suite and operational alerts for generation failures, stale link/price checks, failed reminder batches, and delivery failures. Retest email and Calendar insertion with an explicitly approved test account. SMS remains intentionally paused at the owner's request.

## Product additions, in recommended order

| Priority | Addition | Why it matters | Suggested acceptance criteria |
| --- | --- | --- | --- |
| High | Adjust an existing roadmap | Learners cannot currently change weekly pace/budget or replace a course within their saved roadmap. | Recalculate future sessions, preview the change, preserve completed topics/projects/notes, and avoid duplicate calendar events. |
| High | Report and replace a resource | Star ratings do not identify a broken link, wrong price, outdated course, or difficulty mismatch. | Provide contextual reasons, attach the resource identity automatically, queue reports for review, and offer an equivalent replacement without resetting progress. |
| Medium | Owned-course and subscription library | Existing access can be declared during path selection, but there is no persistent access/expiry management journey. | Record provider, access type, optional renewal/expiry, and active status; reuse valid access across roadmaps. Never imply purchase verification from an unchecked self-report. |
| Medium | Export learning data | Calendar export exists, but notes/progress/roadmap export does not. | Owner-scoped Markdown or JSON export containing stages, resource references, topic/project completion, and notes. PDF can follow. |
| Medium | Optional graded stage knowledge checks | The field-level assessment exists; stage practice checks are informal and ungraded. | Use reviewed answer keys, explanations, retry feedback, and accessible interaction. Keep project work and self-reported completion distinct from assessment scores. |

Later, when usage justifies it: durable background generation with job status/retry/cancellation, and standard MCP OAuth for clients that cannot configure a custom Bearer header. The existing scoped-key agent flow is not a substitute for OAuth compatibility, but it is an intentional access method rather than an unauthenticated endpoint.

## Small polish issues

- The footer still offers Sign In and Create Account to signed-in users.
- Several private pages inherit the general homepage document title instead of a contextual title such as Settings or the roadmap name. This is a navigation/accessibility improvement; these pages are not intended as public SEO landing pages.
- Optional exploration renders “1 ideas” for a single item.

## Useful existing functionality — do not rebuild as missing

Notes, topic completion, project milestones, prerequisites, course coverage, resume learning, field assessments, currency preferences, timed calendar export, MFA, agent-key access, reminder preference, and account deletion are already implemented.

## Test boundaries and changes

No production email/SMS was sent. No external calendar insertion, deletion, purchase, password change, account deletion, key rotation, or live course-price transaction was performed. No user path, notes, resource rating, or completion record was changed. Signup, recovery delivery, direct Google Calendar insertion, and destructive account actions were not re-executed end to end. Generation was inspected in source and covered by the automated suite, but not triggered against live providers during this review.

Application source was not modified. This report is the only repository addition from the review. Ranking first in search, universal security, and large-scale concurrent capacity cannot be concluded from these checks.
## Implementation update — 26 October 2026

The adjustable-roadmap and report/replacement features are implemented locally; see `ROADMAP-PREFERENCES.md` and `RESOURCE-MANAGEMENT.md`. The private course/subscription library is also implemented for saved roadmaps, with its database migration applied and permissions verified. See `COURSE-LIBRARY.md` for scope, tests, and deployment checks. These updates do not replace the production observations or resolve external OAuth/hosting/price-feed limitations above.

Private learning-data export is now implemented locally in JSON and Markdown from Settings or an individual roadmap. See `LEARNING-DATA-EXPORT.md` for scope and release checks. Optional graded stage knowledge checks are now implemented locally as temporary formative checks; see `STAGE-KNOWLEDGE-CHECKS.md`. Deployment and authenticated browser smoke tests remain outstanding.

## Release-check update - 27 October 2026

CI now includes an advisory audit, isolated database regression suites, and credential-free HTTP checks against the production build. The patched build passed all 27 HTTP checks, 733 application unit tests, five checker tests, all three database suites, lint, and TypeScript. Dependency updates resolved the eight reported advisories; the latest audit returned zero known vulnerabilities. See `RELEASE-CHECKS.md` for commands, coverage, and limitations. Authenticated browser testing, production delivery evidence, restore testing, and the external OAuth/hosting/provider-feed work remain separate requirements. These changes have not been deployed by the agent.

## Navigation polish update - 27 October 2026

The three navigation/copy findings above are fixed locally. The footer uses the root layout's existing verified display state, including its MFA gate: signed-in learners see Dashboard, course library, and settings; guests see Sign In and Create Account. No extra authentication request was added. Twelve previously untitled account, onboarding, dashboard, roadmap, and administration pages now have contextual static titles and explicit noindex metadata. The private roadmap uses a generic roadmap title without querying or exposing a learner's field in metadata. Optional exploration now uses "1 idea" and plural "ideas" correctly.

Validation: guest/member footer rendering and zero/one/multiple exercise rendering passed; production build, TypeScript, and all 27 credential-free HTTP release checks passed. These are local results; the changes still need deployment and a signed-in browser review.

## Reminder reliability update - 27 October 2026

Fixed false-success reporting in weekly reminders: a delivery-status write failure now stops the scan with a structured 503, checkpoint failures are caught, and completed scans check the current week's unresolved claims instead of immediately reporting success. Durable claims continue to prevent automatic duplicate sends. Aggregate structured logs and private/no-store responses improve diagnosis without exposing recipient data. See `REMINDER-OPERATIONS.md` for the meaning of each counter and safe recovery steps.

All 35 related cron/email regression checks passed with mocked providers, including overlapping claims, post-send checkpoint failures, missing status rows, completed-but-unresolved scans, and opt-out handling. TypeScript passed. No real reminder email was sent and no hosted database was changed. Production scheduling/delivery evidence and operational alert configuration remain outstanding.

## Link-maintenance reliability update - 28 October 2026

Link verification now confirms the updated resource ID before counting a check, waits for all current-batch writes to settle, and preserves confirmed partial progress when persistence fails. Initialization and unavailable-count failures return private structured errors; monitoring receives fixed operation names instead of raw database/provider messages. The due filter, authorization, concurrency and batch limits remain unchanged. See `LINK-MAINTENANCE-RELIABILITY.md`.

All 64 related cron, link-check and email regression tests passed, along with TypeScript and the production build. No production maintenance job or provider message was triggered, and no new migration is required. Deployment and live scheduling evidence remain outstanding.

## Template-refresh reliability update - 28 October 2026

Scheduled template verification now has a 30-second scheduling budget, and publication queries have bounded timeouts. Incomplete verification stops before publication; uncertain insert/confirmation outcomes are explicitly reported with the candidate version instead of incorrectly claiming old templates were retained. Stored unknown prices cannot be coerced into free resources, and templates are structurally validated before insertion. See `TEMPLATE-REFRESH-RELIABILITY.md` for recovery and the limits of this deadline approach.

All 71 template/cron regression tests, targeted lint, TypeScript and the production build passed. No production publication was triggered and no migration is required. Deployment, successful production job evidence, and a durable background workflow for catalogs that repeatedly exceed the deadline remain separate work.

## Saved-template fallback update - 28 October 2026

The two saved-template reads now share one three-second network abort budget, and late or expired results fall back to the existing generation pipeline. Error monitoring runs after the response with fixed operation names, avoiding extra webhook latency and raw database details. Resource eligibility and learner currency behavior remain unchanged. See `TEMPLATE-LOAD-FALLBACK.md` for timeout and deployment limitations.

All 61 focused template/onboarding regression tests, targeted lint, TypeScript and the production build passed. No production generation or monitoring message was triggered. No migration is required; deployment and live latency observations remain outstanding.
