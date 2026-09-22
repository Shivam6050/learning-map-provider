# Stored free roadmaps

Generation loads the latest published, unexpired curriculum for the selected field and skill level. It reuses free resource IDs and practice checks, skips AI curriculum/judging and free web/YouTube searches, then runs the existing paid-course discovery and budget selection. Prices remain country/currency aware. Existing saved paths remain independent snapshots.

Coverage: six supported fields, three skill levels each. These initial curricula use the existing level-specific fallback stages; they are not a universal catalog for arbitrary goals. Missing, malformed, expired, or incomplete templates fall back to the existing pipeline.

## Activate

1. Apply only supabase/migrations/20260922192831_roadmap_templates.sql to the project database. Do not blindly push older migrations previously applied manually.
2. From the repository with server credentials in .env.local, run npx tsx scripts/publish-roadmap-templates.ts to validate links without writes.
3. Run npx tsx scripts/publish-roadmap-templates.ts --publish to insert and verify a complete version.

Publishing checks public link availability and excludes unavailable resources. This is not a guarantee of educational quality or continued free access; review curriculum and provider access terms when editing blueprints. A conflict with an existing paid/rejected resource stops publication rather than overwriting it.

Versions expire after 30 days. Review and republish before expiry to retain the fast flow. No external scheduler or paid service is required or configured. Retire a faulty version by setting its status to retired in the database; the next valid version or discovery fallback takes over. Never edit published stages in place.

The table uses RLS and denies anon/authenticated direct access. Only the server service role reads/publishes templates. Generation logs source, version, field, level and elapsed time without user data. Compare these logs in production before claiming a speed improvement; provider latency still affects paid paths.
