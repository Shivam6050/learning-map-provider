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
