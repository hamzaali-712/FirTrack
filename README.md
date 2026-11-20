# FitTrack

FitTrack is a personal workout-tracking web application built with React, Vite, Tailwind CSS, React Router, Node.js, Express, MongoDB, and Mongoose.

The project specifications are in [FitTrack-Professional-Docs/docs](./FitTrack-Professional-Docs/docs). They are the planning baseline; implementation and verification status is recorded here as work is completed.

## Requirements

- Node.js `24.22.0` (see `.nvmrc`; the packages require Node.js `20.19.0` or newer)
- npm `10.8.0` or newer
- A reachable MongoDB instance

## Local setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI` to a reachable development database.
2. Install dependencies from the project root:

   ```powershell
   npm install
   ```

3. Start the API and client in separate terminals:

   ```powershell
   npm run dev:server
   npm run dev:client
   ```

4. Open the Vite URL printed in the client terminal. The client proxies `/api/v1` to the Express API.

After configuring a development MongoDB instance, seed the curated exercise catalog once or rerun it safely:

```powershell
npm run seed:exercises
```

Exercise discovery requires an authenticated user. Registration and profile routes are available at `/register`, `/login`, and `/profile`; the exercise library and details are at `/exercises` and `/exercises/:exerciseId`.

The API connects to MongoDB before listening. Startup reports a configuration or connection failure and exits nonzero rather than serving an application that cannot persist data. `GET /api/v1/health` is the API liveness check; `GET /api/v1/ready` reports whether MongoDB is connected.

## Checks

```powershell
npm test
npm run test:auth
npm run test:exercises
npm run test:db
npm run build
```

`npm run test:db` starts an ephemeral MongoDB replica set through `mongodb-memory-server` and verifies the Mongoose connection and a temporary document write. Its first run downloads a MongoDB binary to the local package cache. `npm run test:auth` tests authentication/profile endpoints and `npm run test:exercises` tests catalog seed, search, filters, and details, each against an ephemeral replica set. These checks do not verify production Atlas access or later fitness features.

## Current implementation status

**Module 01 — Foundation and Feasibility:** the client/server scaffold, design tokens, environment validation, API liveness/readiness routes, and baseline tests are implemented. The current API/config test suite passes (9/9), the production client build passes, and the Mongoose replica-set persistence test passes (1/1) against a temporary local MongoDB instance. A prior connection attempt using the local `.env` did not reach an Atlas primary (Mongoose server-selection failure with network errors); no persistent local MongoDB service is installed.

A licensed 3D feasibility candidate has been identified: [Open Anatomy 3D](https://github.com/MervinR07/open-anatomy-3d/tree/c050aa7b1bc56ceed668199b01ea017341928d7b) publishes male/female static GLB anatomy models and declares them CC BY 4.0 with required attribution ([model license](https://github.com/MervinR07/open-anatomy-3d/blob/c050aa7b1bc56ceed668199b01ea017341928d7b/LICENSE-MODELS.md), [attribution](https://github.com/MervinR07/open-anatomy-3d/blob/c050aa7b1bc56ceed668199b01ea017341928d7b/ATTRIBUTION.md)). The upstream project describes about 1M triangles and 147 named structures per model. The candidate is in a static relaxed pose and provides no exercise rig or animation, so it is not integrated and does not meet the P0 exercise-animation requirement. A rights-chain check and independent movement review are also still required before use.

[OpenGym3D](https://github.com/AssiamahS/opengym3d/tree/ea3a60130fdcfb3c4771e44d09f84ebab4ee9bae) is a second research lead: its pinned repository includes a 24-exercise GLB pack whose README and included license state MIT; its asset registry identifies the generated MPFB2 human and Mesh2Motion Pushup motion as CC0-1.0. The pack's Push-Up model/clip is now bundled as an explicitly unreviewed technical preview; the upstream rights chain and movement review are not independently verified. The public demo's model cards rendered blank during inspection, so the local preview is separately tested before use.

**Module 02 — Landing Page:** Implemented a responsive FitTrack landing page with feature, anatomy-preview, catalog-concept, illustrative progress, workflow, and closing sections. Navigation uses working in-page anchors, with account links now connected to Module 03. The landing page includes two simplified static SVG anatomy interpretations with visible Open Anatomy attribution in [client/public/assets/landing](./client/public/assets/landing). These are not mesh exports, 3D viewer content, exercise animations, or anatomy guidance. The source project declares CC BY 4.0, but its upstream rights chain has not been independently audited. Client production build, SVG XML parsing, image loading, in-page links, mobile navigation, reduced-motion behavior, and responsive widths from 320px to 1440px were checked. No new runtime dependencies were added.

**Module 03 — Authentication and Profile:** Implemented Argon2id password hashing, normalized unique email registration, generic login errors, opaque MongoDB-backed HttpOnly sessions, pre-auth CSRF bootstrap with session rotation, origin/CSRF checks, logout revocation, session hydration, shared HMAC-keyed MongoDB rate limits, protected profile access, and profile preference updates. The React client now provides registration, login, protected profile editing, and logout. The server unit suite passes (9/9), the authentication/profile integration suite passes (7/7) against a temporary MongoDB replica set, and the client production build passes. Browser registration/login and keyboard/form-label smoke checks have been exercised; a full screen-reader, contrast, and assistive-technology audit and connectivity to the configured Atlas deployment remain outstanding.

**Module 04 — Exercise Catalog:** Implemented a unique-slug Mongoose catalog, deterministic/idempotent seed and audit for 32 exercises (four per required group), authenticated search/filter/pagination/detail APIs, relevance ordering for goal preferences, and protected responsive React library/detail screens. The API exposes only reviewed media; the unreviewed Module 05 preview remains a UI-only, local asset. The exercise integration suite passes (7/7) against a temporary MongoDB replica set and the client build passes. The seed has not been run against the configured Atlas deployment, and the drafted movement instructions still need qualified review. Adding a selected exercise to a saved workout plan is deferred to Module 06. See [future_pendings](./future_pendings) for deferred work through Module 05.

**Module 05 — 3D Anatomical System:** Implemented a lazy-loaded Three.js/React Three Fiber viewer for the OpenGym3D Push-Up model, with the local GLB and poster, paused-by-default playback, play/pause/replay/speed controls, manual start, accessible status, and a poster fallback for unsupported WebGL or load failure. The UI explicitly labels this asset illustrative and not independently reviewed; it is not exposed as verified media through the API. The package license and upstream CC0 component claims are preserved in the asset attribution and register, but rights-chain and independent movement review remain pending, so P0 approval is not complete. Verification: production build passed (the lazy viewer chunk is 969.89 KB raw / 257.58 KB gzip, triggering Vite's 500 KB advisory); focused asset integrity tests passed (2/2); exercise API integration tests passed (7/7). Browser verification used mocked authentication/catalog responses and the actual local GLB: model loaded and rendered, starts paused in a push-up pose, playback/replay/speed controls worked, simulated WebGL failure showed the poster with controls hidden, and the 320px layout had no horizontal overflow. See [future_pendings](./future_pendings).

**Module 06 — Workout Plans:** Implemented strict MongoDB workout-plan records, paginated owner-scoped plan listing, create/detail/update/archive APIs, stable nested day/exercise IDs, contiguous prescriptions, tracking-type validation, transactional 24-hour idempotency replay, and version compare-and-swap edits. Added React plan list/create/detail screens, local exercise selection, target editing, archive confirmation, and the exercise-detail-to-plan link. Integration tests cover independent plans, replay/reused keys, stale updates, cross-user access, validation, stable IDs, and soft archive; Module 10 browser E2E also created and persisted a plan and exercise. Searchable multi-exercise selection, drag reorder, and stale-version refetch reconciliation remain documented in `future_pendings`.

**Module 07 — Workout Sessions:** Implemented owner-scoped MongoDB session snapshots, the one-active-session partial unique index, transactional/24-hour session start replay, exact plan/day snapshots, server-created performed sets, set-value CAS writes, terminal completion/abandon transitions, history/list reads, and React workout logging/resume UI. Verification: session integration suite passed 7/7, plan suite passed 4/4, and the client production build passed. Module 10’s disposable-database browser flow verified start, save, refresh persistence, completion, active-session resume, abandon, and safe handling of a simulated 503; 320px and actual 200% zoom layouts also passed. See the [quality verification report](./FitTrack-Professional-Docs/docs/QUALITY-VERIFICATION-REPORT.md). Cross-browser checks remain pending.

**Module 08 — Workout History:** Implemented paginated completed-session history and read-only session-detail UI. History remains owner-scoped, archived source plans do not hide completed snapshots, and detail responses preserve actual sets and exercise names. Verification: the session suite passed 7/7, including history pagination, cross-user detail isolation, invalid status filtering, and archived-plan snapshot readability. The Module 10 browser flow confirmed the performed set appears in history detail; 320px and actual 200% zoom layouts also passed. Cross-browser checks remain pending in `future_pendings`.

**Module 09 — Dashboard and Analytics:** Implemented authenticated, completed-only dashboard and progress summaries. The API validates IANA timezones, defaults to UTC, computes Monday-start local week boundaries, returns exactly bounded zero-filled week series, calculates completed sets and external-load volume from actual persisted sets, and excludes abandoned/in-progress workouts. Unit tests passed for the 1,330 kg·reps benchmark, duration-only volume exclusion, clock inconsistency, and timezone/Monday boundaries; integration tests passed for dashboard/progress, invalid timezone/weeks, cross-user isolation, and completed-only metrics. Dashboard/progress React routes and accessible chart/table equivalents are implemented. Module 10’s browser flow checked persisted workout totals (including 480 kg·reps) and the chart’s data-table alternative at 320px and actual 200% browser zoom; screen-reader chart review and cross-browser checks remain in `future_pendings`.

**Module 10 — Quality Engineering (verification performed; release gates remain blocked):** The current API/config, auth, catalog, plans, sessions/history/analytics, MongoDB, calculation, and asset suites passed (42 automated tests total); the production build passed. Browser E2E used a disposable MongoDB replica set and seeded test catalog to exercise registration/login, plan creation, performed-set save and reload, completion, history detail, dashboard, progress, active-session resume, abandon, and a simulated 503 save failure. The first 320px profile check found horizontal overflow; responsive navigation wrapping was corrected, then all nine authenticated screens passed the 320px no-horizontal-overflow check. Landing widths 320–1440px, plus landing and all nine authenticated screens at actual 200% browser zoom, showed no horizontal overflow. Mobile menu/skip-link keyboard smoke tests, reduced-motion preference, and selected 44px touch targets were checked. Full WCAG/axe and screen-reader audits and cross-browser runs remain outstanding. See the [quality verification report](./FitTrack-Professional-Docs/docs/QUALITY-VERIFICATION-REPORT.md). This does not clear the unreviewed 3D asset release gate.

The static anatomy preview is a fallback, not the required verified 3D exercise demonstration. Module 01 remains incomplete: Atlas did not reach a primary, the Open Anatomy assets have no exercise rig/animation, rights-chain review is outstanding, and no movement clip has received independent review.

Twenty-five original animated SVG movement studies are stored in [client/public/assets/exercise-studies](./client/public/assets/exercise-studies). They are supplemental concept art only: 24 exercise names come from OpenGym3D's published pack list, and Kettlebell Swing is clearly identified as a repository draft. No upstream artwork, GLB, or animation keyframes were copied. The illustrations are not form guidance and have not received independent review. Regenerate and test them with `npm run generate:exercise-svg` and `npm run test:exercise-svg`. They are not integrated into the exercise viewer or landing page.

The full development dependency audit reports a high-severity `picomatch` ReDoS advisory affecting the current Vite dependency chain (`<=4.0.7`, with no patched version published when checked). Production dependencies audit clean. Vite's development and preview servers bind to loopback; keep them local and update the toolchain when a patched dependency is available.
