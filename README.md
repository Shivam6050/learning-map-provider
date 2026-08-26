# Learning Map

AI-curated, personalized learning paths. Sign up, tell it your field,
skill level, weekly hours, and budget, and it generates 3 path options
built from real, discovered, budget-aware resources — pick one, work
through it, track your progress.

This README describes the actual current state of the project across
all phases. Where a design note explains *why* something works a
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

## Setup

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
