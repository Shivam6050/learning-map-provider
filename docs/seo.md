# LearningMap search visibility

## What is indexable

The anonymous homepage, `/roadmaps`, six `/roadmaps/{field}` curriculum guides, integrations, privacy and terms. The guides render real authored beginner, intermediate and advanced milestones, topics and projects as server HTML. They do not call AI or course providers and contain no personal roadmap data. Home field cards and the footer link to the guides; each guide links to its existing field-specific path builder.

Account and personal routes have `X-Robots-Tag: noindex, nofollow`. The existing auth, owner checks and private/no-store cache policy still apply. Robots rules are crawler instructions, not access control. Private paths, account URLs, query strings and API endpoints do not enter the sitemap.

## Search intent

| Page | Useful search intent |
| --- | --- |
| Home | LearningMap, learning map, personalized learning roadmap, budget-aware learning path |
| Roadmap index | learning roadmaps, developer roadmaps, learning roadmap vs mind map |
| Frontend guide | frontend development roadmap, HTML CSS JavaScript React learning path, frontend courses |
| Backend guide | backend development roadmap, Node.js API SQL learning path, backend courses |
| Full-stack guide | full-stack developer roadmap, full stack courses, end-to-end web development |
| AI guide | AI and machine learning roadmap, Python model evaluation learning path |
| Data science guide | data science roadmap, Python SQL statistics learning path |
| DevOps guide | DevOps cloud roadmap, Linux containers CI/CD learning path |

Keywords belong in useful, accurate visible content, page titles, headings and descriptions. Google ignores meta keywords. LearningMap has no mind-map canvas, accredited course offering, guaranteed job outcomes, fabricated reviews or price-based rich snippets. Structured data describes the website, organization and real breadcrumbs only.

## Deployment and Search Console

1. Set `NEXT_PUBLIC_SITE_URL` to `https://learning-map-provider-bice.vercel.app` in Production (or the chosen custom domain). Do not use a unique deployment URL as the canonical origin. Redeploy after changing environment variables.
2. Deploy these code changes, then check `/roadmaps`, a guide, `/robots.txt`, `/sitemap.xml` and the social image. Unknown field slugs must return 404. Check rendered title, canonical, description and breadcrumb JSON-LD; do not just inspect client navigation.
3. In the verified Google Search Console URL-prefix property, submit `https://learning-map-provider-bice.vercel.app/sitemap.xml`. Use URL Inspection on the homepage, roadmap index and a guide to request indexing after they are live. Do not submit private URLs.
4. Review indexing reasons and search queries after Google recrawls. Check mobile Core Web Vitals using real deployed performance evidence. No rank or performance score is promised by adding metadata.
5. Keep curriculum content current and publish original practical examples when they add value. Earn relevant references from real projects and educational communities; avoid keyword stuffing, bought backlinks or mass-generated thin pages.

Google chooses which pages to index and how to rank them. These changes improve discovery, clarity and crawlability; they cannot guarantee first place or an immediate change in search results.


## Brand-search improvements — 21 October 2026

The homepage title, H1 and visible product explanation now describe a personal learning map and use the LearningMap brand consistently. Existing WebSite structured data retains the legitimate alternate name "Learning Map". Organization data points to the project's real public repository and the same map mark used by the website. There are no invented reviews, awards, partners or course-price rich snippets. Native HTML questions explain the product for learners; no FAQ rich-result eligibility is claimed.

The old Vercel triangle in `/favicon.ico` is replaced with LearningMap's existing vector mark. The ICO contains 16, 32, 48, 64, 128 and 256 pixel versions, with a 180-pixel Apple icon and a public 192-pixel logo. Regenerate them from `app/icon.svg` with `node scripts/generate-brand-assets.mjs` after changing that source. This uses the sharp package shipped with the installed Next.js dependency, adds no client JavaScript and makes no external requests.

The public README now names the actual six fields and links directly to the production site and guides. Its older single-field limitation and backend-only quiz description are corrected. Sitemap URLs remain unchanged; do not invent last-modified dates or repeatedly resubmit an already processed sitemap.

### Measuring results after deployment

1. Use URL Inspection on the production homepage to test the deployed title, canonical, content and assets, and request a recrawl once after the changed content is live. A successful sitemap submission is not proof of indexing or ranking.
2. In Search Console Performance, review "learning map" and "learningmap" queries separately. Compare impressions, clicks and average position over comparable periods, segmented by country and device. Average position is a measurement of observed results, not a worldwide rank guarantee. With little traffic, there may not yet be enough data to judge a change.
3. Search engines determine results. A browser can use Google, Bing or another search engine, so no single website change controls every browser's results. Do not infer a universal position from one signed-in search or from a site: query.
4. Publish original examples and keep the six field guides accurate. Share the real site where it is useful to learners and maintain consistent public project links. Do not buy links, invent testimonials, stuff keywords, or create duplicate location pages.
5. A custom domain can make the brand easier to recognize and keep its address stable. It is not required for crawling the current Vercel subdomain, and buying one does not buy a search position. If the address changes later, plan redirects, canonical URLs, sitemap URLs and Search Console ownership together.

The user reported successful sitemap processing on 16 October. No current account-level indexing or position report was available during this local SEO update. The browser runtime could not start, so ranking and current Search Console status must not be reported as verified by these code changes.

Validation: the final production build (including TypeScript) and focused-file ESLint checks passed. All four existing SEO tests passed. Twenty HTTP checks against that production build passed, including the final homepage copy, canonical URLs, JSON-LD relationships, four icon/logo endpoints, ordinary/Bingbot content parity, all 11 sitemap entries, robots rules, the unknown-guide 404 and account noindex headers. Googlebot was used for the default HTTP requests; changing a user-agent string does not prove a request came from Google. The browser runtime could not start, so no new visual browser check or account-level search position check was completed. No deployment, Git push or external indexing submission was performed by this update.
