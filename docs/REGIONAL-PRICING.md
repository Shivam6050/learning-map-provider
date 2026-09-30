# Regional pricing

Country of residence and display currency are separate. Signup saves residence to Auth user metadata; existing and Google users can set it in Settings. Residence is a preference, not an authorization claim. INR, USD and EUR remain the supported display currencies.

Saved roadmap paid prices use public provider checks cached for five minutes, keyed by URL, country and currency. Next.js may serve the previous quote during revalidation; cards display the check time. These refreshes do not overwrite shared resource rows or change the saved budget. Unknown quotes are excluded from totals and shown as needing checkout confirmation, never free.

GeeksforGeeks batch quotes must explicitly match the requested country. Scrimba must identify the market on the pricing page; its full annual charge is used and shared Pro access is counted once. W3Schools and other public prices without a verified market are estimates. Private checkout discounts, coupon eligibility and personalized regional offers cannot be fetched reliably from public pages. An authorized provider feed/API is still required for guaranteed market-specific prices, especially Scrimba.

No provider feed credentials, SMS service or production deployment was activated by this change.


## October implementation update


Public quote cache keys include the course URL, requested currency and country of residence. Cache refresh is demand-driven, with a five-minute revalidation interval. A separate timestamp check rejects stale values even if Next.js serves stale data during background revalidation. No scheduled market crawler or provider feed has been activated.

Generation and saved-roadmap reads share this cache for catalog courses. Unknown catalog offers remain optional after link verification. They never qualify as free resources or verified budget matches. The shared resource record holds an unknown-price marker rather than one learner's regional quote; quotes are overlaid for the request. Optional-course labels distinguish unknown amounts and full annual charges.

Learners can explicitly confirm existing course access or an active subscription. Only server-offered IDs may be included, and only in matching stages. This is self-reported access, not a verified purchase or an entitlement from the provider. It adds learning resources without adding their price to the selected option's new-purchase budget. Saved-roadmap cost estimates show the current course value, not a receipt or an ownership ledger. Subscription expiry is not tracked.

Exact personalized checkout offers, tax treatment and discount eligibility still require provider-supported data. The Scrimba access request is drafted in scrimba-pricing-request.md and has not been sent. No provider credentials or prices should be fabricated.
