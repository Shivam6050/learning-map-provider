# W3Schools partner integration

The owner supplied the public storefront `https://campus.w3schools.com/SHIVAMSAGAR` and code `SHIVAMSAGAR` on 25 October 2026. The provider currently redirects that storefront to `/discount/SHIVAMSAGAR?dt_id=3606743`. A read-only HTTP check confirmed that adding an internal product `redirect` returns the matching product URL with the partner identifier.

`lib/affiliates/links.ts` applies this route only to exact `campus.w3schools.com` product URLs, including regional product paths. It preserves the course destination, market query, and fragment. Lookalike hosts and free `w3schools.com` tutorials do not receive this offer. Catalog records, AI candidate identities, editorial coverage, and price-fetch URLs remain the original provider URLs.

Paid course cards in selection, optional purchased-course suggestions, and saved roadmaps show an expandable partner offer. Resume links use the same referral helper. Links carry `rel="sponsored noopener noreferrer"`.

The owner's dashboard advertises 20% off selected Certification Exams, Certification Courses and Servers collections. The UI states eligibility and final price are confirmed at provider checkout. The advertised discount is **not** subtracted from budget estimates or represented as universally available. Commission percentages are business terms, not learner-facing price information. No purchase was made and no commission attribution was claimed as verified.

If the provider changes the code or program, update the constants, offer copy and tests together. No secret, environment variable, schema migration, or paid service is needed for this integration.
