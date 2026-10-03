# LearningMap public MCP and bot access

After deployment, connect a remote MCP client to `https://learning-map-provider-bice.vercel.app/mcp` using Streamable HTTP, no authentication. Set `NEXT_PUBLIC_SITE_URL` to the canonical deployed origin. The official MCP SDK handles protocol negotiation and stateless requests; no Redis, paid AI call, database migration or new service credential is needed.

Tools: `list_learning_fields`, `get_curriculum_preview` (field slug, beginner/intermediate/advanced level), `search_learning_resources` (query, optional limit 1–20). Resource: `learningmap://catalog`.

Ordinary web clients can GET `/api/public/catalog` and `/api/public/roadmap?field=backend-development&level=beginner`. Discovery is in `/llms.txt`, `/robots.txt`, `/sitemap.xml`, and the footer's `/integrations` guide. `llms.txt` is informational, not a universal registration protocol. No Dots/Grok compatibility or automatic indexing is claimed; each client must support remote MCP or ordinary web access.

## Boundaries

All responses project authored, repository-controlled public data. The endpoints do not fetch arbitrary URLs, call Gemini, read user cookies, refresh sessions, query personal tables or mutate anything. No live regional prices are exposed. Resource references are not asserted to have been verified in real time. All tools are annotated read-only and idempotent. Inputs are validated, requests are bounded to 16 KiB and resource results to 20. No long-lived subscriptions are offered.

Native/server MCP clients may omit Origin. Browser callers must use the site origin or an exact origin listed in `MCP_ALLOWED_ORIGINS` (comma-separated, no wildcard; never put credentials there). CORS does not send cookies or allow credentials. Public JSON GET endpoints use wildcard CORS because they contain no private data. Robots rules are crawling preferences; existing authentication/RLS remains the protection for private pages.

For traffic protection use the hosting platform's firewall/rate limits for `/mcp` and `/api/public/*`; do not rely on per-process memory counters on serverless hosts. No global rate limiter is claimed by this implementation. Monitor invocation quotas before advertising broad crawler access. Do not exempt every request claiming to be a bot from firewall controls.

## Verification

Run `npm test`, `npm run lint`, `npm run build`. MCP route tests exercise real SDK initialization, tool discovery/calls, resource reads, validation, origin controls, payload bounds and private-tool rejection. Production smoke test with a real MCP client after deployment. Browsing `/mcp` directly may return 405; clients must POST MCP messages. That is expected for stateless HTTP.

Future personal access requires user-granted, revocable OAuth scopes and ownership checks for each tool. Do not expose a service-role key, reuse browser cookies in third-party clients, or make existing private roadmap routes public.

## Verification recorded 2026-10-03

- 359 tests passed; one existing live-provider test skipped.
- Production build and TypeScript passed. Lint: zero errors, nine pre-existing unused-variable warnings.
- Official current MCP client connected over real HTTP to the local production build and read a curriculum; route tests also cover legacy 2025-11-25 initialization.
- Discovery and public JSON endpoints returned 200 without Set-Cookie. Integration guide: no browser errors or horizontal overflow at 1440, 390 and 320px.
- Changes have not been deployed or registered with third-party bots by this task.
- Dependency audit reports seven existing advisories (six in development tooling, one in Next 16.3.5's next/og ImageResponse). No MCP package advisory was reported. Repository search found no next/og or ImageResponse use; this does not establish whole-application security. Track the Next patch update and development dependency advisories separately; no forced framework downgrade was applied.
