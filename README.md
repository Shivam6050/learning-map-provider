# Learning Map

AI-curated, personalized learning paths. Sign up, tell your field,
skill level, weekly hours, and budget, and it generates 3 path options
built from real, discovered, budget-aware resources — pick one, work
through it, track your progress.

This README describes the actual current state of the project across
all phases. Where a design note explains _why_ something works a
particular way, it's usually because an earlier, simpler version had a
real bug — those are called out explicitly rather than hidden.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind), deployed on Vercel
- Supabase (Postgres + Auth), full schema + RLS in `supabase/schema.sql`
  and `supabase/migrations/`
- Gemini API (`GEMINI_API_KEY`) for the AI pipeline — no SDK dependency,
  called directly via `fetch` in `lib/ai/client.ts`
- YouTube Data API for video discovery

## The pipeline, end to end

1. **Skeleton** (`lib/ai/skeleton.ts`) — Gemini generates the stage
   structure from its own knowledge. No search — this is stable,
   general knowledge, and search would only add hallucination risk here.
2. **Discovery** (`lib/youtube/discover.ts`, `lib/web-discovery/discover.ts`)
   — real candidates per topic. YouTube via the Data API (cache-first,
   see below). Web resources (docs, courses, articles) via Gemini's
   **real** Google Search grounding — using the API's `groundingChunks`
   (actual search results), not text the model self-reports, since
   Gemini can't combine search grounding with forced JSON output for
   these models.
3. **Judgment** (`lib/ai/judge.ts`) — Gemini ranks each stage's real
   candidates by trust status and signal quality. Every returned URL is
   validated against the actual candidate set before being trusted —
   this check, not the prompt wording, is what prevents a hallucinated
   URL from ever reaching the database.
4. **Option building** (`lib/ai/build-options.ts`) — three deterministic
   variants (Mastery / Practical / Saver) built from the already-judged
   resources, budget-aware. No LLM call here; it's just selection logic
   over vetted candidates.
5. User picks one at `/onboarding/select` → `confirmSelectedPath`
   persists it for real (`learning_paths`, `stages`, `stage_resources`,
   `stage_progress`).

## Trust system

- `lib/db/trusted-sources.ts` proposes a `trusted_sources` row per
  YouTube channel / web domain encountered during discovery
  (`added_by: 'ai_proposed'`, `approved: false`).
- `/admin/trusted-sources` — approve or reject them. Gated by
  `profiles.role === 'admin'` in the UI, and enforced for real by the
  `trusted_sources_admin_write` RLS policy underneath.
- Once approved, a source's resources count as trusted
  (`on_trusted_allowlist`) in judgment going forward.
- Resource ratings (`/paths/[id]`, star widget) feed an aggregate
  `resources.rating`, recomputed on every new rating — the long-term
  quality signal beyond initial discovery.

**No user is admin by default.** Run once in the Supabase SQL editor:

```sql
update profiles set role = 'admin' where id = 'your-user-uuid';
```

## Security hardening

- **Server-side input validation everywhere a form exists.** `<select>`/
  `<input>` constraints (min/max/required) only stop the UI — a direct
  POST to a server action bypasses all of it. `generatePath`, `signup`,
  and `updateProfile` all re-validate every field server-side (skill
  level enum, hours/budget bounds, currency allowlist, avatar ID against
  the real catalog, name length, password length).
- **Rate limiting on path generation.** Each generation triggers several
  real Gemini + YouTube API calls — real cost, real quota. Capped at 10
  generations/user/day (`app/onboarding/actions.ts`), counted against
  `pending_path_sets`, so a careless or malicious user can't burn both
  for everyone else.
- **URL scheme validation.** `lib/link-check/url-safety.ts` rejects
  anything that isn't a genuine `http(s)` URL before it's stored or
  rendered as an `<a href>` — a `javascript:`/`data:` URI must never
  reach the database, regardless of how unlikely that seems from an
  AI-search-grounded source. Enforced at the one place external URLs
  enter the system (`web-discovery/discover.ts`) and again defensively
  at every render site, including the admin page.
- **Baseline browser security headers** (`next.config.ts`) —
  `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`. A different attack surface than the RLS/
  validation work above (clickjacking, MIME-sniffing), not a substitute
  for it.
- Everything from the earlier flaw-fix pass still applies: real RLS on
  every table, `is_admin()`-gated writes, no service-role key ever
  reachable from client code, no silent fallback-to-fake-data on
  external call failure.

## Avatars & the game-board path

At signup, pick an avatar (`lib/profile/avatars.ts` — a small emoji set,
no image storage needed) — stored on `profiles.avatar_id` via the
`handle_new_user` trigger (updated in migration 005).

`/paths/[id]` renders `components/PathBoard.tsx`: stages as nodes on a
winding trail (plain SVG, no charting library), colored by status
(gray outline = not started, amber = in progress, green checkmark =
completed). The avatar sits on the first non-completed stage — "you are
here" — and moves forward automatically as `stage_progress` updates,
since the board is just a render of the same status data used
everywhere else, not a separate game-state to keep in sync. The
position is a CSS `transition`, so when you mark a stage complete the
avatar animates to its new spot rather than snapping — no client-side
state needed for that, just a transition on a value that changes across
the server re-render. Clicking a node scrolls to that stage's detail
below.

`/settings` lets you change your avatar and name after signup —
`app/settings/actions.ts` re-validates the avatar ID against the real
catalog server-side, same as the signup flow.

## Dashboard charts & deleting paths

- `components/PieChart.tsx` — plain SVG donut, no charting library
  (recharts etc. would be real weight for a handful of static
  segments). One aggregate chart across every path, plus a small one
  per path in the list.
- `components/DeletePathButton.tsx` — deletes a `learning_paths` row
  with a confirm dialog. Cascades handle cleanup: stages,
  stage_resources, and stage_progress all have `on delete cascade` back
  to their parent already in `schema.sql`, so deleting the path is
  enough — no manual child-row cleanup needed.

No AI model prevents link rot — a course or video can be genuinely real
at discovery time and dead weeks later. This is solved at the
application layer, not by model choice:

- **YouTube:** `videos.list` (the same call discovery already makes for
  view/like stats) tells us definitively whether a video still exists —
  a deleted/private video simply isn't in the response. More reliable
  than an HTTP status check, since YouTube often still serves a 200 page
  shell for content that's actually gone.
- **Everything else:** a real HTTP HEAD-then-GET check
  (`lib/link-check/check-url.ts`) before a URL is ever inserted or
  reused as a candidate.
- A resource that fails this check is marked `link_status: 'broken'`
  and is **never offered to judgment** — `fetchResourcesByIds` in both
  discovery modules filters broken links out at the query level, not
  just in the UI.
- **Ongoing maintenance:** `app/api/cron/check-links` (Vercel Cron,
  daily, see `vercel.json`) re-checks resources already sitting in
  saved paths that a fresh discovery run won't naturally re-touch. If a
  link goes dead after a path was generated, the path page shows a
  "link unavailable" state instead of sending the user to a 404 — see
  the `isBroken` handling in `app/paths/[id]/page.tsx`.
- Requires `CRON_SECRET` (any random string) so the endpoint can't be
  triggered by anyone who finds the URL.

## Skill assessment

Onboarding blends two signals, per the original design decision
("combination of a short questionnaire AND a real skill-check"):

- Self-reported level (dropdown)
- A 5-question backend fundamentals quiz (`lib/onboarding/skill-quiz.ts`)

The two are averaged (not "trust whichever is lower/higher" — that would
be a value judgment about the learner this product doesn't need to
make) into the level actually used for generation. Shown transparently
on `/onboarding/select` ("self-reported: X, quiz suggested: Y, blended
to: Z") rather than silently overriding what the learner said about
themselves.

## Timeline

Each stage shows a computed week range (e.g. "Weeks 2–3") based on
cumulative `estimated_hours` against the path's `weekly_hours` — pure
arithmetic in `app/paths/[id]/page.tsx`, no schema change or AI call
needed, since both numbers already existed.

## Ratings feed back into judgment

`resource_ratings` doesn't just display — `judge.ts`'s ranking prompt
now includes each candidate's aggregate `community_rating` and is
instructed to prefer highly-rated resources over merely high-signal
ones, and to weight a real low rating over good raw metadata. This is
the actual "long-term moat" mechanism from the original vision doc: it
starts contributing the moment a single rating exists, not after some
separate migration.

## Progress tracking

Self-reported only (`not_started → in_progress → completed`) via
`app/paths/[id]/actions.ts`. Deliberately not verified/gated — real
quiz-gated progression was scoped out of v1 in the original vision doc
as its own mini-LMS-sized feature.

## Error handling — the one thing worth reading carefully

Earlier versions of this pipeline (and an earlier version of the Gemini
migration) had a systemic bug: every external call — Gemini, Supabase —
had a silent "pretend it worked" fallback instead of a real error.
Paths were also briefly stored in a process-global JS `Map`
(`lib/db/in-memory-paths.ts`, since deleted), which doesn't survive
across Vercel's serverless instances. Both are fixed now:

- `lib/ai/client.ts` throws a real error (with per-model failure
  reasons) if every Gemini model fails, instead of returning fabricated
  fallback content.
- Pending path options live in the `pending_path_sets` table (RLS
  owner-scoped), not memory.
- `/paths/[id]` calls `notFound()` on a missing/inaccessible path — a
  real 404, never fake data.

If you see an error redirect (`/onboarding?error=...`) or a 404 where
you expected a path, that's this design working as intended — check the
server console for the real underlying error rather than assuming
something is silently fine.

## Production readiness (accounts, legal, testing, worldwide reach)

**Account lifecycle**

- Password reset (`/forgot-password`, `/reset-password`) via Supabase's
  standard recovery-link flow, reusing `/auth/callback`.
- Google OAuth on login and signup (`components/GoogleSignInButton.tsx`)
  — needs a Google OAuth client configured in your Supabase dashboard
  (Authentication → Providers → Google); not something I can set up
  from code.
- Account deletion in Settings — password re-verification + typed
  "DELETE" confirmation before calling `auth.admin.deleteUser`, which
  cascades through every table via the FKs already in `schema.sql`.

**Legal**

- `/terms` and `/privacy` — real, specific to what this app actually
  does, with an honest banner saying "have a lawyer review this" rather
  than pretending to be finished legal text. Signup requires accepting
  both, enforced server-side.

**Testing & CI**

- Vitest, 13 unit tests on the logic most likely to silently break:
  `blendSkillLevel`, `buildPathOptions` (including "saver never picks
  paid" and "never selects a resource that wasn't offered"), and
  `isSafeHttpUrl`. `npm test` to run them.
- `.github/workflows/ci.yml` — typecheck + tests + build on every push/PR.

**Monitoring**

- `lib/monitoring/log-error.ts` — deliberately a plain webhook POST,
  not `@sentry/nextjs`. I couldn't verify that SDK's compatibility with
  Next.js 16 + Turbopack from here, and didn't want to risk breaking
  your build on an unverified dependency. Set `MONITORING_WEBHOOK_URL`
  to Sentry's inbound webhook, a Slack channel, or anything that
  accepts JSON — one env var, no code change, no vendor lock-in.

**Worldwide reach**

- **Currency conversion is now real**, not cosmetic — resources are
  always discovered priced in USD; `lib/currency/convert.ts`
  (frankfurter.app, ECB rates, DB-cached — no in-memory cache repeat of
  the earlier mistake) converts to the path's currency for display.
  This also fixed a real pre-existing bug: total cost was summing raw
  USD and labeling it with whatever currency the user picked.
- **YouTube region targeting** — `regionCode` now passed to search,
  derived from the user's chosen currency as a loose proxy
  (`lib/youtube/region.ts` — documented as an approximation, not a real
  locale signal). Cache keys fold in region too, so a US result can't
  leak into an IN request for the same topic.
- **Multi-field support** — turned out lightweight, since the pipeline
  (skeleton, discovery, judgment) was already field-agnostic. Six
  fields in `lib/fields/catalog.ts` now; the skill-check quiz (Backend
  Development only, since writing a good quiz per field is real content
  work) shows or hides live based on the selected field.
- **Accessibility**: skip-to-content link, `role="alert"`/`aria-live`
  on every error/success banner site-wide, icon-only buttons already
  had `aria-label`.
- **i18n was deliberately NOT done in this pass.** Mechanically
  translating every string without native-speaker review risks shipping
  _wrong_ translations — which actively hurts trust for a product whose
  whole pitch is trustworthiness. This needs either real translators or
  a carefully-reviewed MT pass, not a global find-replace.

**Retention**

- `app/api/cron/weekly-reminders` — finds users with an inactive
  (7+ days, `stage_progress.updated_at`), incomplete path and emails a
  nudge via Resend (`lib/email/send.ts` — plain REST call, no SDK).
  Relies on the cron's own weekly schedule to avoid double-emailing,
  not a separate "last reminded" column — simpler for now, would need
  that tracking added if the schedule ever runs more often than weekly.
- `.ics` calendar export (`/paths/[id]/ics`, "Add to calendar" button)
  — stage week-ranges use the exact same math as the page display
  (`lib/paths/timeline.ts`, extracted so the two can't silently diverge).

**Additional setup for all of the above:**

```
RESEND_API_KEY=...          # resend.com
EMAIL_FROM_ADDRESS=...      # a verified sending domain in Resend
MONITORING_WEBHOOK_URL=...  # optional
```

Plus running `supabase/migrations/006_exchange_rates.sql` and
`007_stage_progress_updated_at.sql`, and adding the Google OAuth
provider in the Supabase dashboard if you want that sign-in option live.

1. **Create a Supabase project**, run `supabase/schema.sql`, then every
   file in `supabase/migrations/` in order.
2. **Get API keys:**
   - Supabase: Settings → API → Project URL, `anon` key, `service_role` key
   - Gemini: aistudio.google.com → API key
   - YouTube: Google Cloud Console → enable "YouTube Data API v3" → Credentials
3. **Set environment variables** — copy `.env.local.example` to
   `.env.local` and fill in all values.
4. **Configure email redirect** in Supabase → Authentication → URL
   Configuration: Site URL to your dev/deployed URL, and add
   `{url}/auth/callback` as a redirect URL.
5. **Make yourself admin** — see the SQL above, after your first signup.
6. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```

## Deploying

Push to GitHub, import into Vercel, add the same environment variables
in Vercel's project settings. `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe client-side.
`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, and `YOUTUBE_API_KEY` must
only ever be server-side env vars.

## Known limitations (by design, not bugs)

- Only "Backend Development" exists as a field — hardcoded. A field
  picker and multi-field support is the next real scope expansion.
- YouTube discovery is cached per topic for 7 days (quota-driven — see
  the comment in `lib/youtube/client.ts` for the actual numbers this is
  built around) — a brand-new upload won't surface until the cache expires.
- `lib/ai/seed-resources.ts` (Phase 1's static resource pool) and
  `lib/db/ensure-seed-data.ts`'s `ensureSeedResources`/`getSeedResourcePool`
  are unused by the live pipeline — kept for local dev/testing without
  API keys configured.
- Verified/gated progress tracking, non-tech fields, and monetization
  are explicitly out of scope for this stage — see the original vision
  doc.

## Note on `middleware.ts`

Next.js 16 shows a deprecation warning suggesting the file be renamed to
`proxy.ts`. Still fully supported — not renamed here to avoid depending
on an unverified convention change, worth revisiting on your next Next.js
upgrade.
