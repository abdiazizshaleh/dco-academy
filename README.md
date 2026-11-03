# DCO Academy

A local-first React/TypeScript learning app for an experienced IT support professional preparing for data center operations. Independent of Amazon and AWS.

## Run locally

Requires Node 22.12+ (tested with Node 26).

```sh
npm ci
npm run dev
```

Open the printed local URL. Production: `npm run build`; host `dist/` on a static host. The app works without server configuration. Account saving uses a Supabase project URL and a publishable browser key; never put a secret or service-role key in Vite environment variables.

## Verification

```sh
npm test
npm run build
# Start npm run dev in another terminal, then:
npx playwright install chromium  # only if no browser is installed
npx playwright test
```

Tests cover all 15 incident state machines, unsafe/incomplete actions, terminal state, mastery, backup parsing, and browser journeys A-E. E2E uses port 5173. Screenshots and exports are in ignored `test-results/`.

## Implemented version

- All 13 navigation sections have functioning content and actions.
- 16 modules, 35 original lessons, each with explanations, failure modes, diagnostic reasoning, diagram, written activity, knowledge check, interview perspective, and linked research references.
- 15 fictional incident models with ticket context, three evidence groups, competing causes, scoped actions, verification, notes, history, debrief, and penalty scoring. Restart preserves previous scored attempts.
- Interactive rack, server component cutaway, network dependency diagram, and optical loss calculator.
- Stateful bounded Linux interpreter with a network restoration mission and read-only command snapshots. It never runs a host shell or sends network packets.
- 35 distinct multiple-choice checks, diagnostic assessment, weak-topic practice, three overlapping mock sets, and spaced review.
- All 16 Leadership Principles, 50 original behavioral prompts and 70 original technical prompts. Scripted follow-up and deterministic structural feedback, explicitly labeled as estimates.
- STAR editor with all requested core fields, principle coverage, evidence questions, rehearsal starts/timers, and experience prompts.
- 14-day, 30-day, and 60-session self-paced plans; daily time budget, reference target date, task persistence, and overdue/carry-forward labels.
- IndexedDB persistence, JSON export/import with structural validation, local reset, bookmarks, lesson notes, dark/light themes, and responsive navigation.
- 20 research entries and a source-analysis report. Community anecdotes and fictional examples are distinguished from official/vendor documentation.

## Scope and limitations

This is a coherent working first release, not the full requested final inventory. It does not yet include 60 lessons, 150 unique questions, 20 distinct labs, 100 glossary entries, 75 technical prompts, or 15 different technical diagrams. Mock sets reuse the 35 checks. There is no separate glossary encyclopedia yet; searchable lessons form the current reference library.

Foundation/Technician/Deep Dive use the same core explanation with progressive mechanism visibility and a deeper reasoning exercise; they are not three independently authored courses. Some modules need further dedicated lessons to reach the requested depth. General platform examples must always yield to the actual equipment service manual. Some source references support only a subset of a lesson; the research report records applicability.

The terminal is a bounded teaching interpreter, not an emulator. Many command outputs are fixed snapshots. Only administrative link state and working directory change; pipes, general shell expressions, arbitrary hosts, and unsafe writes are unsupported. Command-specific exercises beyond the network mission require expansion.

Incident causes are deterministic; they do not randomize faults or emulate full devices. The current reasoning gate requires all three evidence groups. Repeated guesses accumulate penalties. Handoff checks enforce length, not semantic correctness. Rebuild and hardware repair outcomes are simulated after an approved action; no real timing or physical execution is modeled. No proprietary AWS architecture, procedure, or question bank is claimed.

Interview feedback uses structural language checks, not an AI evaluator. It cannot verify truth, technical accuracy, or hiring likelihood. Voice, recruiter/full-length interview modes, and external AI are not implemented. Account saving is implemented separately as described below. Rehearsal is text plus speaking timer; no microphone recording. Print uses a dedicated full-text story layout; JSON export also preserves complete stories.

Planner tasks are template rotations with overdue labels, not optimized automatic date rescheduling. The target date is informational. Adaptive recommendations prioritize uncompleted lessons and weak-topic assessment domains rather than implementing a full prerequisite graph. There are no multi-select, ordering, free-response grading, or diagram-labeling assessments yet. Mastery tracks 11 combined domains; interview communication and principle understanding remain rubric-based estimates.

The GitHub Pages website is public. Signed-out work stays in the current browser; signed-in records use account-specific local caches and Supabase storage when configured. Records do not transfer automatically between the old Sites origin, localhost, and GitHub Pages. Use export/import to migrate. Clearing browser data removes records; export backups regularly. Sensitive personal and company information should not be entered.

## Source structure

- `src/content.ts`: curriculum, knowledge checks, principles, prompt banks
- `src/simulation.ts`: deterministic incident and terminal engines, independent of React
- `src/store.ts`: typed records, IndexedDB I/O, mastery scoring, backup validation, story feedback
- `src/Diagram.tsx`: equipment images, interactive component labels, identification practice, and network device drawings
- `src/main.tsx`: application shell and feature screens
- `src/style.css`: responsive design system and themes
- `research/`: primary-source catalog and Reddit analysis
- `e2e/`: Playwright learner journeys

## Mastery and persistence

Only scored performance affects mastery. The latest eight attempts in each domain receive a 30-day exponential recency weight; lab/terminal results have double weight. Incorrect quiz answers return for review in six hours; correct answers in three days, then successful reviews double the interval to a maximum 30 days. Page visits and completion counts do not affect mastery. This is an internal study metric, not certification or authorization to operate production infrastructure.

## Additional community context

Reviewed the user-provided [GitHub guide](https://github.com/dco-study-guide/aws-dco-interview-prep). The research report records accepted topics and corrections. Added TCP, DHCP, and DNS transport lessons based on IETF primary documentation, plus interview logistics checklist items. All lessons and prompts are original; sample STAR narratives and metrics were not imported as personal experiences.

## Interface and lab redesign

The dashboard now links directly to hardware exploration, the next incomplete or weak-domain lesson, an unfinished incident, reviews, and practical labs. The layout uses larger text and controls in both themes. Interface voice is documented in `UI_VOICE.md`.

Equipment imagery is generated illustration, supported by six clickable server component labels and an identification exercise. Component attempts update Hardware practice scores. The rack explorer shows a conceptual equipment list beside a facility image; the network map uses device drawings and selectable diagnostic guidance. Image prompts and original paths are in `docs/ASSETS.md`.

Navigation uses shareable hash URLs. Lessons and selected incidents survive refresh, and browser back/forward navigation works. Lesson pages have previous/next controls and a retry option for the knowledge check. Terminal shortcuts fill commands; Up/Down recall history and Tab completes supported commands. The incident queue supports text search and open/closed filters, and the ticket shows completed diagnostic stages and the approved action. STAR printing uses full text instead of form fields, so long stories can flow across pages.

The existing version-1 IndexedDB records and JSON backup format remain compatible. Component identification is distinct from an incident and is not counted as an incident solved on the dashboard. The lab redesign does not add a real Linux shell or semantic AI grading. Account saving is described below.

Redesign validation: 20 unit tests and five Playwright tests pass, including all five learner journeys, component identification, URL refresh/back navigation, terminal history/completion, incident filtering, full-text story printing, and all navigation sections at phone width in addition to the theme checks.


## GitHub Pages and account saving

Repository: https://github.com/abdiazizshaleh/dco-academy

Pages URL: https://abdiazizshaleh.github.io/dco-academy/

Pushes to `main` run the unit tests, build Vite with the `/dco-academy/` asset base, and deploy `dist/` through GitHub Actions. Public images use Vite’s base URL. Hash routes keep lesson and incident links compatible with static hosting.

### Database configuration

Account saving is connected to the DCO Academy project (`rpvowbzopumqgjgyfqbg`) in the DoeApp organization on its Free plan. GitHub Actions has the public browser configuration. The owner-only learning-record policies are applied and security advisors report no findings. The following steps describe recreating the setup on another project.

1. Create a free Supabase project in the selected organization.
2. Apply `supabase/migrations/20261103041241_create_learning_records.sql` using the SQL editor or the linked Supabase CLI. The migration creates one private snapshot per authenticated user, enables RLS, and grants only own-row select/insert/update access. Anonymous users receive no table privileges. No service-role key is used by the website.
3. Set Supabase Auth’s Site URL to the Pages URL and allow the exact Pages URL as an email redirect destination. Enable email/password sign-in and configure confirmation/reset email delivery as appropriate for the account. Default hosted email delivery can have recipient and rate restrictions; a custom SMTP service is needed for general public signups beyond the allowed recipients.
4. Set GitHub repository Actions variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. These values are intentionally public in the browser bundle. Never use a database password, secret key, or service-role key.
5. For local development, copy `.env.example` to ignored `.env.local` and fill the same public values. Rerun the Pages workflow after configuring repository variables.

### Saved records and conflict handling

Account saves include lesson completion, assessment and incident attempts, notes, bookmarks, stories, terminal state, review schedules, and plans. Existing guest records are not automatically uploaded when an account signs in: use the explicit earlier-progress import in Account & sync, or import a JSON backup after signing in.

Changes save to an account-specific IndexedDB cache immediately and upload after a short delay. The database stores an atomic snapshot plus a revision. Updates must match the revision that was loaded, so another device’s work is not silently overwritten. A conflict asks which copy to keep; choosing the account copy also retains the displaced local state under a recovery key in IndexedDB. Offline work remains cached and is checked against the server on reconnect. This is snapshot-based conflict resolution, not real-time collaborative merging.

### Move your work from the original website

On the original site, open Data & preferences and export your JSON backup. On the Pages site, sign in, then open Account and sync / Data & preferences and import that file. Wait for “Saved to your account” before switching devices. The original site has a different browser origin, so it cannot be read directly by the new site.

### Additional validation

`cloud-e2e/saving.spec.ts` tests the sign-in, restore, autosave, revision-conflict, offline-recovery, and guest/account separation flows against a mocked API. Start a second development server with test-only public configuration at port 5174, then run `npx playwright test --config playwright.cloud.config.ts`. These browser tests do not replace a live RLS verification after provisioning.


### Provisioning verification

The hosted database was checked with two temporary accounts: an owner could save and update a snapshot, a separate sign-in could recover it, another account could not read or modify it, anonymous table access was denied, forged ownership was rejected, and an update with a stale revision made no change. The temporary accounts and records were removed afterward. The checked-in SQL was executed against the new project using the linked CLI; it was not inserted into Supabase migration history by that direct-query operation. For this existing project, do not replay the initial creation SQL as a new migration. New projects can apply it once normally.

Auth uses confirmed email/password accounts and PKCE confirmation/reset links back to the exact GitHub Pages URL. Only the site URL, redirect allowlist, and minimum password length were adjusted; provider secrets were not placed in the frontend. Free-plan usage limits and the default email service restrictions still apply. The `service_role` key was used only in a local verification process to create/delete temporary accounts; it is not committed, passed to GitHub, or shipped to the browser.
