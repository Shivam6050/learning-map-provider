# Release checks

## Automated checks

The CI workflow runs lint, TypeScript, unit tests, a high-severity dependency audit, a production build, and bounded HTTP smoke checks against that build. The existing Verify/checks job now runs the isolated database suites instead of duplicating unit tests. Both workflows retain read-only repository permissions and cancel superseded runs on the same ref.

`npm run test:db` uses pinned development-only PGlite to run resource-management, RLS-optimization, and private-library regression tests. Fixtures exist only in local in-memory databases; the runner does not load `.env`, connect to Supabase, or create hosted test users.

`npm run test:release-runner` checks the HTTP test runner itself, including target restrictions and failure handling.

`npm run test:release` starts an already built production app on 127.0.0.1:3210, overrides dotenv configuration values, runs signed-out HTTP checks, and stops its own child process. It refuses to reuse an occupied port. The build and test must use the same public canonical origin:

```powershell
$env:NEXT_PUBLIC_SITE_URL = 'https://learningmap.example'
npm run build
$env:SMOKE_CANONICAL_ORIGIN = 'https://learningmap.example'
npm run test:release
```

The script does not create or rewrite `.env` files. A configured local canonical origin is not a reason to change the production site's canonical URL.

## Read-only deployed check

After deploying, run:

```powershell
$env:SMOKE_BASE_URL = 'https://learning-map-provider-bice.vercel.app'
$env:SMOKE_ALLOW_REMOTE = $env:SMOKE_BASE_URL
$env:SMOKE_CANONICAL_ORIGIN = $env:SMOKE_BASE_URL
npm run test:deployed
```

Remote checks require the exact HTTPS origin. No cookies, bearer tokens, passwords, provider keys or browser sessions are used. Requests are bounded, sequential GETs, with no automatic redirect following. Sitemap targets must be public paths on the expected canonical origin; unexpected targets are rejected before fetching.

Coverage:

- Sitemap reachability, safe unique targets and homepage presence.
- Public guide pages: HTTP status, title, one H1, expected canonical, indexability, framing and MIME headers.
- Robots sitemap location and private settings exclusion.
- Unknown public guide returns a real 404.
- Dashboard, Settings, library, agent settings and report administration redirect signed-out users to same-origin sign-in, with private/no-store and noindex headers.
- Agent APIs and learning exports reject missing authentication.
- In the credential-free local build only, maintenance endpoints reject requests without cron authorization. Remote checks never request job endpoints.
- Deployed database health returns ready. The credential-free local build must instead fail health closed with 503.

Failures exit nonzero and fail the CI job. No external notification service, paid monitoring, scheduled automation, or deployment was configured. Repository branch protection must require the CI jobs if failing checks are intended to block merges; workflow files alone do not block Vercel deployments.

## Limits

These are HTTP integration checks, not browser interaction tests, a load test, or proof of production email/calendar delivery. Authenticated browser journeys, successful scheduled-job evidence, OAuth verification, and a restore drill remain separate release work. A passing dependency audit reports the registry's known advisories at that time; it is not a universal security guarantee.

## Validation — 27 October 2026

- Production build and TypeScript passed on Next.js 16.4.3.
- Application unit suite: 733 passed, one live-provider test skipped.
- Full CI lint scope passed.
- All three isolated database suites passed, including 117 RLS assertions and 26 library checks.
- Release-checker regression tests: 5 passed.
- Built-app HTTP checks: 27 passed, zero failed. No production credentials or authenticated browser session were used.
- Dependency audit: zero known vulnerabilities after compatible patched dependency updates (including Next.js 16.4.3 and Zod 4.6.7).

The dependency updates need deployment to protect the running application. These results describe the local patched build, not the currently deployed Vercel version. No database migration is required for these release-check or dependency changes.
