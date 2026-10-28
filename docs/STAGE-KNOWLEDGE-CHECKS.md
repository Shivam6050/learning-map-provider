# Optional stage knowledge checks

Implemented 26 October 2026. Application changes are local and need deployment. No migration, provider credentials, AI calls or paid service is required.

## Learner flow

Open a saved roadmap stage and expand **Check your understanding** below its project milestones. Start the check, choose one answer per question, and submit to see a score and explanations. Retry after revisiting the stage resources.

Checks contain one to four original questions selected from the stage's topic mapping. The authored bank covers every topic in the current versioned curricula, with bounded concept checks for legacy stages. If the saved curriculum version is unavailable, no substitute assessment or fabricated score is offered.

Results are formative and temporary. They are not persisted, included in exports, used to assign a skill level, or used as certification. Retrying uses the same bank; it is not an independent exam. Completion, notes, resource ownership, topic checkboxes and project milestones remain unchanged.

## Implementation and boundaries

- Answer keys and explanations live in `lib/assessment/stage-knowledge-bank.ts`, marked server-only. The initial DTO contains only question IDs, topic names, prompts and choices. Graded feedback includes correct answers and explanations.
- Both loading and submission authenticate the session, preserve the existing MFA/profile guards, verify roadmap ownership, verify the stage belongs to that roadmap, and scope progress reads to the authenticated user. No service-role client or database mutation is used.
- Submission re-derives the allowed questions from saved curriculum data. It rejects stale bank versions, missing/duplicate/foreign question IDs, and non-integer or out-of-range choices. Client scores and answer keys are ignored.
- Changing question wording, choices or answer keys requires incrementing `BANK_VERSION`. Keep IDs/version handling consistent so old forms receive a reload message rather than being graded against changed answers.
- The panel fetches nothing until the learner starts it. Native labelled radio groups, fieldsets, pending feedback, explicit errors, focus management and mobile wrapping support accessible interaction.

## Verification

28 focused tests passed, covering all authored topic/unit mappings, bounded legacy checks, missing curriculum versions, answer-key DTO omission, scoring, malformed/stale submissions, owner filters, read failures and MFA redirects.

The bank is authored and checked in this implementation; it is not an independently validated psychometric assessment. Additional editorial review and broader question variants would improve its educational depth.

After deployment, smoke-test a saved stage: keyboard-select answers, review explanations, retry, and confirm stage completion and notes have not changed. Also check one narrow viewport. Live authenticated UI verification remains a deployment check.

Release checks: 733 unit tests passed, one existing live-provider test skipped; scoped ESLint, TypeScript and the production build passed. A compiled-client scan found no occurrence of the selected server-only answer explanation. Hosted lookup columns were checked with a zero-row query; no user data or progress was changed.
