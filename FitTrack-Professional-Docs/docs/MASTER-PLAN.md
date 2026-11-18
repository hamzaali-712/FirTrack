# FitTrack — Startup-Grade Master Plan

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## 1. Executive intent
FitTrack is a privacy-first personal workout planning and performance-tracking web application. Users register, set goals, discover a credible curated exercise catalog, build multiple routines, start and reliably save actual workouts, resume after refresh, examine immutable history, and understand transparent progress measures. An optional demonstration layer presents validated exercises using a **realistic rigged 3D anatomical character**.

The user experience is **Ocean Breeze dark-first**: Stormy Teal `#16697A`, Pacific Blue `#489FB5`, Sky Blue `#82C0CC`, Alabaster Grey `#EDE7E3`, Amber Glow `#FFA62B`; Manrope is the preferred UI font. The landing **hero occupies a full viewport** and the **final conversion/closing section occupies a full viewport**; mobile viewport units and content height require resilient fallbacks.

The architecture is designed for responsible scale but is not described as already production-ready. **Eight weeks and two people** is a demanding delivery envelope, not evidence that a large animated exercise catalog is feasible without material production assets.

## 2. Immutable technology decisions
| Concern | Choice | Boundary |
|---|---|---|
| Frontend | React + Vite, React Router | No Next.js/Angular/Vue substitution |
| Styles | Tailwind CSS + CSS design tokens | Ocean Breeze + semantic contrast tokens |
| 3D viewer | Three.js + React Three Fiber (proposal) | Supporting React libraries, not a new core framework; university approval required if libraries are restricted |
| Server | Node.js + Express | Versioned REST JSON under `/api/v1` |
| Data | MongoDB + Mongoose | No SQL/Firebase/Supabase-as-database |
| Sessions | Revocable server-side opaque cookie sessions (proposal TD-01) | Secure HttpOnly cookies, CSRF + origin checks |
| Test tooling | Vitest/RTL, Supertest, Playwright (proposal TD-10) | Approve exact pinned versions before M1 |
| Animation transport | glTF/GLB asset files, controlled static/HTTPS delivery | DB stores metadata/URLs, not large binaries |

## 3. Explicit scope: what we will and will not build
### P0 — acceptance-blocking product core
1. Public branded landing and 100dvh/100vh-compatible hero + closing CTA; register/login CTAs; accessible mobile navigation.
2. Secure registration, authentication, logout, owner-only profile and goals.
3. Curated exercise catalog with **at least 32 unique exercises, at least 4 in each** of Chest, Back, Shoulders, Biceps, Triceps, Legs/Glutes, Core, Cardio; search + filters + instruction detail.
4. Functional **3D anatomical viewer** showing one approved realistic rigged human and **at least one anatomically reviewed exercise clip**; controls, explicit source/license register, failure fallback, and reduced-motion behavior. Further clips as capacity allows.
5. Multiple independent workout plans with up to 7 days, 20 exercises/day, valid set/rep/time targets, archive behavior.
6. One active workout per user; reliable performed-set logging; refresh/re-login recovery; finish/abandon; immutable completed snapshot.
7. Completed-session-only dashboard, history and basic progress; clear calculated units and empty states.
8. Real integration tests, data-isolation tests, responsive/keyboard tests, deployment smoke tests, documentation and reproducible commands.

### P1 — high-value, nonblocking expansion
Broader **80–120 exercise content target** subject to curation; **6–10 verified 3D clips** as an optional stretch; sub-muscle heatmaps, alternative suggestions, body-metric histories, rest timer, advanced PR/analytics, polished light mode, password recovery, custom exercises, starter plans. Do not interpret these numbers as promises or completed deliverables.

### Explicitly excluded from 8-week baseline
Admin/gym/coach roles, memberships/payment, AI coaching/pose scoring, medical diagnosis, meal prescriptions, native mobile apps, wearable sync, social media, real-time chat, an exact replication of the reference landing website, or a claim that every catalog exercise has a 3D clip.

## 4. Product differentiation and success
- **Reliable actual data:** planned targets never masquerade as performed work; saved state appears only after server acknowledgment.
- **Understandable catalog choice:** tags guide selection but do not hide other exercises because of goals.
- **In-context 3D instruction:** a reviewed exercise preview supports, but does not replace, plain-text instructions and safety cautions.
- **Evidence-first analytics:** completed-only counts, explainable aggregation boundaries; numeric metrics with units and provenance.
- **Inclusive UX:** WCAG 2.2 AA *target*; never claim conformance without testing.

**Canonical acceptance walk-through:** New visitor -> landing -> register -> choose muscle gain -> filter Chest and Dumbbells -> choose an exercise (view 3D demonstration where verified) -> create Monday plan -> start session -> log 12×40 kg, 10×45 kg, 8×50 kg -> confirmed save -> refresh -> resume -> complete -> history remains exact after plan archive -> correct dashboard + privacy checks.

## 5. Delivery capability and release realism
| Week | Integrated outcome | Exit proof |
|---|---|---|
| W1 | Contract decisions, environment, UI shell, 3D asset licensing/rig proof | Health check + glTF load + one licensed clip reproducible |
| W2 | Real auth/profile and brand/landing | Two-account auth + security checks |
| W3 | Seed catalog, search/filter/detail, viewer | Automated ≥32/8-group count + approved animation proof |
| W4 | Plan builder API/UI | Two distinct persisted plans + version checks |
| W5 | Set logging and session lifecycle | Save/refresh/resume + single-active concurrency |
| W6 | History, progress and validated formulas | Completed-only aggregate reconciliation |
| W7 | Integration/security/accessibility/performance and additional clips if ready | Test report + 3D fallback + responsive audit |
| W8 | Production-style deployment verification and university handoff | Live smoke log or explicitly labeled blocked deployment + demo package |

A simultaneous build of an enormous realistic motion library is **not** on the core critical path. Commit each clip only after review and license proof. Keep at least the final week predominantly for testing and release, not speculative new features.

## 6. Startup-style architecture and growth path
- **Modular monolith** with domain boundaries `auth`, `profile`, `exercises`, `plans`, `sessions`, `analytics`, `media` (metadata only). Avoid microservices.
- Scale stateless Express instances only after shared session/idempotency persistence, correct indexes and owner-scoped queries are demonstrated.
- Cache only immutable public static assets with content fingerprints; private JSON responses are no-store.
- Place large GLB files behind versioned, approved storage/CDN when deployment requires it; avoid storing binaries in MongoDB documents.
- Key risks: license/medical inaccuracy, 3D WebGL failures, sprint overload, data loss, auth/CSRF, stale history. Mitigations and stop/go gates in `RISKS.md`.

## 7. Quality and release gates
**No P0 sign-off without:** auth ownership/CSRF tests; correct catalog count; start/save/resume/complete state-machine tests; idempotency/concurrent start tests; immutable snapshots; real end-to-end happy path; accessible fallbacks; zero knowingly exposed secrets; reproducible setup; verified license and form accuracy for every published 3D animation. Performance figures are test budgets, not actual measurements. See `TEST-PLAN.md` and `DEPLOYMENT-OPERATIONS.md`.

## 8. Document governance and reading order
`README.md` -> `MASTER-PLAN.md` -> `REQUIREMENTS.md` -> `PRODUCT-SCOPE.md` -> `ARCHITECTURE.md` -> `DATABASE-SCHEMA.md` / `API-CONTRACT.md` -> `DESIGN.md` / `official-theme.md` -> `3D-ANIMATION-SYSTEM.md` -> `PLANNING.md` -> `TEST-PLAN.md` -> `DEPLOYMENT-OPERATIONS.md`.

**Conflict precedence:** `REQUIREMENTS.md` for behavior; `API-CONTRACT.md` for HTTP shapes; `DATABASE-SCHEMA.md` + `ARCHITECTURE.md` for database/implementation; `DESIGN.md` + `official-theme.md` for UX/tokens; `ADR-DECISIONS.md` for approval status. Change must update all affected documents and acceptance tests together. All proposed choices remain proposed until recorded approval.

## 9. Delivery acceptance signatures
- Product/scope owner: **TBD / not signed**
- Technical owner: **TBD / not signed**
- 3D media/art-direction reviewer: **TBD / not signed**
- Test/release owner: **TBD / not signed**
- Actual implementation/deployment/test evidence: **not supplied**
