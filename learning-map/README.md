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
