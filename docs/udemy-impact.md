# Udemy paid courses and affiliate links

Generation uses the Impact partner catalog API. The old Udemy Affiliate API was discontinued; storefront bot challenges must not remove an otherwise verified, available catalog course.

Add these server-only settings to `.env.local` (never `NEXT_PUBLIC_*`):

```dotenv
IMPACT_ACCOUNT_SID=
IMPACT_AUTH_TOKEN=
UDEMY_IMPACT_CATALOG_ID=
```

Use the approved publisher account's API credentials with catalog read access. If you do not know the catalog ID, set the first two variables and run:

```sh
node scripts/check-udemy-catalog.mjs
```

The command lists accessible Udemy catalog IDs, names and currencies without printing tokens or catalog download credentials. Set the desired catalog ID, run the check again, then restart the development server and generate new options. Existing generated options do not acquire courses retroactively.

The integration searches stage topics, reads `CurrentPrice` and `Currency`, rejects unavailable/expired listings, converts valid amounts before budgeting, and preserves the partner-specific `Url` returned by Impact. The app does not follow these tracking URLs during validation, avoiding artificial clicks. Saved course availability is rechecked using its exact catalog item ID.

High and middle tiers retain their budget caps. If the catalog is disconnected, unavailable, or has no suitable affordable courses, the paid tier is explicitly unavailable rather than shown as another free path. Affiliate links are disclosed and tagged `rel="sponsored"`; commission rates do not affect ranking.

Catalog amounts remain estimates: regional checkout prices, promotions and taxes may differ. Fresh catalog availability is not a guarantee that the provider website can be reached from every user's network.

References:
- https://www.udemy.com/developers/affiliate/
- https://integrations.impact.com/partner-api-reference/reference/catalogs/catalogs
- https://integrations.impact.com/partner-api-reference/reference/catalogs/models
