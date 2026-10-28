# Saved roadmap preferences

The roadmap now has an expandable “Adjust roadmap” panel below its summary. Learners can edit 1–80 whole weekly hours and a planning budget from 0 to 100,000 (at most two decimal places), matching generation limits.

The preview uses the existing timeline and subscription-cost helpers. It shows remaining study weeks, the full roadmap span, revised estimated purchases, and budget shortfalls. Unknown prices remain unknown. The budget input explicitly identifies the roadmap's saved currency; displayed monetary estimates respect the global currency preference.

Saving updates only `learning_paths.weekly_hours` and `budget_total`. The action authenticates, binds the path to the current user, uses the user-session/RLS client, and compares both previous values atomically to reject stale edits. Stage IDs, courses, notes, topic/project completion, statuses and ownership flags are untouched. The dashboard and roadmap are revalidated. Existing columns and owner grants are used; no SQL migration is required.

Future Calendar exports and insertion requests read the saved weekly hours. Previously imported events are not synchronized automatically; the panel explains that users must review/remove the old schedule before importing a replacement. Budget edits do not regenerate or replace courses.

Validation includes preference boundaries, unauthorized/unowned requests, stale values, database failures, compare-and-set conflicts, a null legacy budget, and subscription/timeline recalculation. A read-only production query verified the required columns exist without returning user rows. Browser checks used sample data: live previews, offer expansion, mobile overflow and the signed-out save failure. A signed-in production save was deliberately not performed against the owner's personal roadmap.

Next separate improvements: course replacement within an existing roadmap, then contextual broken-link/wrong-price reports. Google OAuth verification remains external release work; this feature does not resolve it.
