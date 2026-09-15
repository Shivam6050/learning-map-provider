# Lighthouse review

Audited the local production homepage with Lighthouse 12.8.2, Chromium Edge, and default mobile simulation. Reports are in D:/LearningMap-audits.

| Metric | Before | Final repeat load |
|---|---:|---:|
| Performance | 92 | 86 |
| Accessibility | 94 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| Server response | 2150 ms | 60 ms |
| Largest contentful paint | 2.8 s | 3.2 s |
| Total blocking time | 180 ms | 310 ms |
| Layout shift | 0 | 0 |

The final run reported a slow host CPU warning. These are individual local runs, not production field data or evidence of an overall performance-score gain. The cache-empty intermediate run still took 2410 ms for its initial document. Public exchange-rate results are cached for five minutes; existing database freshness and conversion behavior remain intact. Sessions and user data are not shared-cached.

Fixed low contrast in the homepage's secondary sage text and footer heading hierarchy. Preserved learning generation, resource selection, budgets, account authorization and stage progress logic.

Validation: production build passed; 148 tests passed, 2 skipped. Lighthouse reports completed; the first audit encountered a Windows temporary browser-file cleanup lock after saving its reports.

Remaining: audit deployed cold starts and authenticated dashboard/roadmap pages with a user-authorized signed-in browser session. Recheck performance on an idle machine; do not remove security no-store headers or framework compatibility code merely to improve Lighthouse scores. These changes have not been deployed to Vercel.
