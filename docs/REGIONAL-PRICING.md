# Regional pricing

Country of residence and display currency are separate. Signup saves residence to Auth user metadata; existing and Google users can set it in Settings. Residence is a preference, not an authorization claim. INR, USD and EUR remain the supported display currencies.

Saved roadmap paid prices use public provider checks cached for five minutes, keyed by URL, country and currency. Next.js may serve the previous quote during revalidation; cards display the check time. These refreshes do not overwrite shared resource rows or change the saved budget. Unknown quotes are excluded from totals and shown as needing checkout confirmation, never free.

GeeksforGeeks batch quotes must explicitly match the requested country. Scrimba must identify the market on the pricing page; its full annual charge is used and shared Pro access is counted once. W3Schools and other public prices without a verified market are estimates. Private checkout discounts, coupon eligibility and personalized regional offers cannot be fetched reliably from public pages. An authorized provider feed/API is still required for guaranteed market-specific prices, especially Scrimba.

No provider feed credentials, SMS service or production deployment was activated by this change.
