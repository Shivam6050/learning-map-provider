# Roadmap verification — 2 October 2026

Cross-device resume stores validated resource identifiers and a server timestamp in the existing owner-scoped `stage_progress.practice_check.resource_visit` document. Saves use comparison-and-retry updates to preserve notes, owned courses, topic checks and milestone checks. Resource visits do not mark stages complete. No schema migration is required.

## Browser checks

The Codex interactive browser and computer-use runtimes failed to initialize with a missing kernel-assets path. A temporary headless Edge harness used the actual roadmap components, production CSS and sample data with explicitly mocked server actions. No production accounts or messages were used.

At widths 1440, 390 and 320 pixels, the following checks passed:

- Keyboard expansion of stage panels and overview navigation.
- Resume-stage navigation.
- Topic and milestone checkbox interaction and saved feedback.
- Coverage table expansion and contained horizontal scrolling.
- Completing a stage closes it and opens the next stage.
- No document-level horizontal overflow or uncaught browser errors.

Desktop and mobile screenshots were visually inspected. Fixture artifacts and the executable harness are in `D:/LearningMap-audits/roadmap-qa/`; `report.json` records the checks.

## Limits

Fixture saves do not prove live authentication, Supabase RLS, or cross-device writes end to end. Regression tests cover server-side ownership, resource membership, write failures and concurrent document saves. A live authenticated test with two browser sessions should follow deployment once interactive browser access is restored. Tests use browser viewport widths, not physical mobile devices.
