# LearningMap authenticated agent access

Users sign in to LearningMap and create a named key under Settings → Agent access (`/settings/agents`). They must explicitly confirm read-only catalog access. Configure a remote MCP client with Streamable HTTP, endpoint `https://learning-map-provider-bice.vercel.app/mcp` and header `Authorization: Bearer YOUR_AGENT_KEY`. Clients must support a custom Authorization header. Automatic browser OAuth sign-in is not implemented; no OAuth discovery document is advertised. Do not select “no authentication”.

Keys contain 256 random bits, expire in 30 days and are shown only in the creation response. Only SHA-256 hashes are stored. Users can have five active keys and create ten per rolling day, enforced atomically under a per-owner transaction lock. Keys can be revoked immediately for subsequent requests. Website logout does not revoke keys. Deleted accounts cascade keys; banned, anonymous and unverified identities are rejected. No key or password is logged or placed in a URL. Keep tokens in client secret storage; never paste them into chat.

Tools: `list_learning_fields`, `get_curriculum_preview`, `search_learning_resources`. Resource: `learningmap://catalog`. These remain read-only catalog/preview tools. They do not expose personal paths, notes, progress, purchase actions, messages or calendars.

Both JSON URLs (`/api/public/catalog`, `/api/public/roadmap?field=backend-development&level=beginner`) now require the same key; the historical URL name does not indicate anonymous access. Success and error responses are no-store and never rely on browser cookies. Browser Origin checks remain enforced; native clients may omit Origin. Browser clients need an exact `MCP_ALLOWED_ORIGINS` entry if hosted elsewhere. CORS has no credential/cookie support. Missing, expired or revoked keys return 401; database/auth failures return 503 and never grant access. Valid-shaped keys are checked in the database on each request; there is no stale authorization cache. An in-flight request authorized before revocation may finish.

`/integrations`, `/llms.txt`, `/robots.txt` and `/sitemap.xml` remain publicly accessible discovery/help pages. Browser GET navigation to `/mcp` opens `/integrations`; actual MCP requests must authenticate. Resource links and free-access classifications are authored catalog data, not live regional price quotes.

## Release

Apply `supabase/migrations/20261003125424_agent_access_keys.sql` before deploying. It is additive and rerunnable, with RLS and owner-only metadata reads, no authenticated client writes, and service-role-only issuance RPC. Keep `SUPABASE_SERVICE_ROLE_KEY` exclusively on the server; agents never receive it. No new provider account or paid service is required. If the migration/configuration is missing the integration fails closed.

Run tests, lint and production build. SQL tests in `supabase/tests/agent_access_keys.sql` use a rolled-back transaction for owner isolation, hash confidentiality, write restrictions, per-owner caps and rollback verification. Real account sign-in/key creation should be smoke-tested after deployment. Set hosting firewall/rate limits on machine endpoints; no distributed rate limiter is claimed here. Bots that support OAuth only will need a later dedicated OAuth integration with database isolation before issuing Supabase login tokens.

## Verification (2026-10-03)

The migration and rolled-back SQL security checks were applied successfully to the linked Supabase project. The suite passed 404 tests (one existing skip), production build passed, and lint completed with no errors (nine existing warnings). A local production build against the real Supabase backend passed all 14 smoke checks, including signed-in issuance, masked credentials, mobile widths, official MCP client access, anonymous rejection and immediate revocation across MCP and JSON endpoints. The isolated test account and its keys were deleted afterward. Redeploy the application code to activate these changes in production, then verify the hosted connection flow.
