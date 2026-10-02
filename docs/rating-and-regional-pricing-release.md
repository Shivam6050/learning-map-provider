# Rating and regional pricing fixes — 2 October 2026

## Ratings
The server action derives the user from the authenticated session and calls a service-role-only, SECURITY INVOKER database function. The function checks roadmap ownership and course membership, locks the resource before saving the vote, then calculates the average in the same transaction. Direct authenticated INSERT/UPDATE/DELETE privileges on ratings are revoked so API callers cannot bypass this protocol. No provider calls occur while holding the database lock.

The SQL test installs the function temporarily, creates isolated records, verifies permissions, repeat voting, ownership, membership and shared-course averages, then rolls back everything. It does not modify existing user records. Unit tests verify input validation, authenticated identity and error handling. A simultaneous-client load test is not claimed.

## Regional quotes
Currency does not establish a country. A non-subscription quote must carry explicit provider market evidence matching the requested residence, as well as the requested currency. GFG regional data supplies that evidence only for an exact matching course and country. W3Schools public Shopify currency and legacy Udemy API responses are not enough to verify a regional quote. Scrimba requires an explicit regional marker and uses the annual upfront charge; missing country evidence is rejected.

Public verified quotes refresh on a five-minute cache. Expired or unverified quotes are excluded from budget totals. Saved roadmaps already refresh paid quotes on load and show unknown prices as “Check current price on provider.” Personalized, account-specific or coupon-only offers cannot be guaranteed without provider-supported access; no such feed has been configured by this change. This fix prevents false prices, it does not promise every provider's personalized checkout price.

## Release order
The migration is `supabase/migrations/20261002174939_atomic_resource_rating.sql`. It was verified in a rolled-back transaction and is not yet permanently applied. Apply it together with deploying the new application code. Applying it before deployment disables the old rating write path; deploying first causes the new action to report an error until the function exists. Prefer a brief coordinated release window. Do not restore direct browser write privileges as a workaround.

No environment changes or new paid services are needed. Private .env contents remain untouched.
