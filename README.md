# Learning Map — Phase 0

This is the Phase 0 foundation from the MVP roadmap: a deployed skeleton
proving auth, RLS, and the Next.js + Supabase stack work together. It does
not yet generate learning paths — that's Phase 1.

## What's here
- Next.js 16 (App Router, TypeScript, Tailwind)
- Supabase auth: signup, login, logout, email confirmation callback
- `middleware.ts`: refreshes the session on every request, redirects
  unauthenticated users away from `/dashboard`
- `/dashboard`: the Phase 0 exit check — shows `Logged in as {email}` and
  the user's `profiles` row, proving RLS is enforced (not just that
  `auth.getUser()` works)
- `supabase/schema.sql`: the full schema with constraints and RLS
  policies, ready to run as a migration
- Three Supabase client helpers in `lib/supabase/`:
  - `client.ts` — browser (Client Components)
  - `server.ts` — server (Server Components, Server Actions)
  - `service.ts` — service-role, **server-only**, bypasses RLS entirely.
    Don't use this until Phase 2's AI pipeline needs to write
    `resources`/`trusted_sources` rows on the backend.

## Setup

1. **Create a Supabase project** at supabase.com (free tier is fine).

2. **Run the schema migration.** In the Supabase dashboard, open the SQL
   Editor and run the contents of `supabase/schema.sql`.

3. **Get your API keys.** In the Supabase dashboard, go to
   Settings → API. You'll need:
   - Project URL
   - `anon` `public` key
   - `service_role` key (keep this secret — never commit it)

4. **Set environment variables.** Copy `.env.local.example` to
   `.env.local` and fill in the three values from step 3.

5. **Configure email redirect (optional but recommended).** In
   Supabase → Authentication → URL Configuration, set the Site URL to
   your local dev URL (`http://localhost:3000`) or your deployed URL,
   and add `{url}/auth/callback` as a redirect URL.

6. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```
   Visit `http://localhost:3000`, sign up, confirm your email, and you
   should land on `/dashboard` showing your profile row.

## Deploying
Push to GitHub, import into Vercel, and add the same three environment
variables in the Vercel project settings. `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe to expose to the browser —
`SUPABASE_SERVICE_ROLE_KEY` must only ever be set as a server-side env
var, never referenced from client code.

## Note on `middleware.ts`
Next.js 16 shows a deprecation warning suggesting the file be renamed to
`proxy.ts`. It still works and is fully supported — this wasn't renamed
here to avoid depending on an unverified convention change, but worth
revisiting when you next upgrade Next.js.

## Next step
Phase 1 in the roadmap: hardcode one field (Backend Development), build
the onboarding form (skill level, weekly hours, budget), and wire up the
Stage 1 (skeleton) + Stage 4 (assembly) prompts from
`ai-pipeline-prompts.md` against a small hand-seeded set of resources.

## Phase 1 additions

Wires up Stage 1 (skeleton) and a combined Stage 3+4 (selection +
assembly) against a **hand-seeded resource pool** for one hardcoded
field, per the roadmap's "walking skeleton" approach.

### What's new
- `lib/ai/client.ts` — Anthropic client + a `callForJson` helper that
  strips stray markdown fences and parses defensively
- `lib/ai/skeleton.ts` — Stage 1 prompt, no web search
- `lib/ai/seed-resources.ts` — the Phase 1 placeholder resource pool for
  Backend Development. **Read the caveat comment at the top of that
  file** — these are stable, well-known sources chosen to unblock
  testing, not a vetted allowlist. Review before pointing real users at it.
- `lib/ai/assemble.ts` — the combined selection + assembly prompt.
  Collapses Stage 3 and Stage 4 because Phase 1 has no real Stage 2
  discovery output to hand it — see the comment at the top of that file
  for why this changes once Phase 2 lands.
- `lib/db/ensure-seed-data.ts` — upserts the hardcoded field and seed
  resources via the **service-role** client, since `fields` and
  `resources` have no client write policy in the schema
- `app/onboarding/` — the onboarding form + server action running the
  full pipeline: skeleton → assembly → **URL validation against the
  candidate pool** (the actual anti-hallucination guardrail, not just
  the prompt wording) → writes to the database
- `app/paths/[id]/page.tsx` — read-only display of the generated path

### Additional setup for Phase 1
Add your Gemini API key to `.env.local`:
```
GEMINI_API_KEY=your-gemini-api-key
```
Get one at aistudio.google.com if you don't have one yet.

### Try it
Log in → Dashboard → "Generate a new path" → fill in the form → wait
~10-20s → you should land on `/paths/{id}` with real stages and matched
resources from the seed pool.

### Known Phase 1 limitations (by design, not bugs)
- Only "Backend Development" exists as a field — hardcoded, per the roadmap
- Resources come from the static seed pool, not real search/API discovery
  (that's Phase 2)
- No progress-tracking UI yet, even though `stage_progress` rows get
  created to hold the `practice_check` text (Phase 4 builds the UI for this)
- No admin approval flow for resources — everything in the seed pool is
  marked `trust_status: 'allowlisted'` directly (Phase 5)

