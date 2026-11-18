# FitTrack — Quality Engineering, Test Matrix and Release Gates

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## 1. Testing philosophy
No feature is 'done' because a screenshot exists; user-generated data must traverse React -> Express -> MongoDB and survive re-login. Test individual validators and business rules, API with isolated MongoDB fixtures, browser flows and failure conditions. Automate high-risk invariants first and report what actually ran (this pack contains **no executed test results**).

## 2. Test tiers and tools (proposed)
| Tier | Candidate tooling | What it catches |
|---|---|---|
| Unit | Vitest | Schema validators, state machine, calculations, date/rounding rules |
| React components | React Testing Library + Vitest | Form errors, focus, save states, viewer controls |
| API integration | Supertest + test MongoDB replica set | Cookies/CSRF, owner isolation, indexes, atomic writes |
| Browser E2E | Playwright | Register -> plan -> log -> refresh -> history |
| Accessibility | axe automated + manual keyboard/screen-reader | Missing names, focus traps, nontext content, contrast |
| 3D content QA | Real browser/WebGL manual & automated smoke | Load/clip mapping, missing media, reduced motion, memory fallback |
| Security | OWASP ASVS-informed negative tests & dependency audit | Injection, IDOR, CSRF, leaks, secrets |
| Performance | Controlled load scripts + browser profiler | Query p95, FPS/responsiveness, media bytes, time to usable UI |

## 3. P0 functional suite (must be traceable)
| ID | Scenario | Pass criterion | Priority |
|---|---|---|---|
| T-AUTH-01 | Register/login/logout/refresh | Session valid on refresh, revoked at logout | P0 |
| T-AUTH-02 | Duplicate normalized email | 409; no second account | P0 |
| T-AUTH-03 | CSRF/origin/expired cookie | State change rejected; no data write | P0 |
| T-EX-01 | Seed catalog audit | ≥32 distinct active, each required group ≥4 | P0 |
| T-EX-02 | Search+combined filter | Correct intersection, page cap and empty state | P0 |
| T-EX-03 | Missing media | Valid data and text/poster, no broken asset crash | P0 |
| T-3D-01 | Actual approved GLB + named clip | Loads and plays where supported; asset review record exists | P0 |
| T-3D-02 | Reduced motion/offline WebGL | Paused/static fallback; controls accessible | P0 |
| T-PLAN-01 | Two independent plans | Different IDs, edits don't overwrite, refresh persists | P0 |
| T-PLAN-02 | Stale edit/cross-user ID | 409 version conflict or safe 404, no overwrite | P0 |
| T-SES-01 | Start workout concurrently | Exactly one in-progress per user (DB index) | P0 |
| T-SES-02 | Save performed values | Actual values returned and persisted across refresh | P0 |
| T-SES-03 | Retry same/different idempotency key | No duplicate active/completed sessions | P0 |
| T-SES-04 | Complete/abandon/status | Only legal transitions; zero valid sets cannot complete | P0 |
| T-HIST-01 | Edit/archive plan after completion | Old session snapshot unchanged | P0 |
| T-PROG-01 | Completed-only stats and volume | 3 resistance sets = 1,330 kg·reps, abandoned excluded | P0 |
| T-UI-01 | Full-screen hero/outro + mobile | 100dvh-compatible sections; no clipped content on 320px | P0 |
| T-UI-02 | Real nav CTAs and keyboard | Every actionable UI element has working destination | P0 |
| T-SEC-01 | Cross-user private object access | Safe 404/401; no content leak | P0 |

## 4. Browser and viewport matrix
Desktop: current Chrome, Firefox, Edge and Safari where accessible. Mobile emulations: 320, 360, 375, 768px; 1024, 1440px; test at 200% text zoom and landscape. Track actual test environment including OS/browser version. Reference devices and WebGL GPU capabilities must be recorded, not guessed.

## 5. Known-uncertain / failure tests
- Server returns 503 / database down during set save -> UI says not saved, no false green status.
- Timeout after successful write -> session refetch resolves ambiguous outcome; stale version handled.
- File missing/invalid GLB -> Exercise Detail remains readable; no unhandled rejection.
- Two tabs modify one set -> exactly one wins version CAS; other receives 409.
- Browser token expires mid-workout -> mutation blocked, user prompted to log back in; no unauthorized overwrite.
- CORS/CSRF forged origin -> reject; cookies scoped correctly.
- Extreme inputs/invalid ObjectIds/NoSQL `$ne` operators -> safe 400/422, no DB operator injection.
- Seed script run twice -> no duplicates; fallback media status remains honest.
- Session created then source plan archived -> active/complete history remains stable according to contract.

## 6. Quantitative budgets (targets to ratify, NOT results)
| Metric | Initial target / environment conditions to record |
|---|---|
| Common API read p95 | ≤500 ms under a defined modest seeded/staging workload (preexisting planning hypothesis) |
| Mobile workout control touch target | ≥44px guideline; measure at 320px |
| React data save status | `Saved` only after confirmed server ACK; no time-based fake success |
| 3D initial asset payload | Aim ≤5 MiB optimized where feasible; record actual bytes and compression |
| Landing interaction readiness | Define separately with a reference mobile device/network before acceptance |
| Tests | All P0 high-risk checks must pass; no unresolved critical/high security/data-loss issues |

Targets are not guaranteed and must be measured on named hardware/network/seed size. Browser FPS/CPU and WebGL support vary widely, so avoid universal performance promises.

## 7. Test data and reporting
Use disposable test DB and separate test credentials, never real user data. Fixture users A/B, 32+ canonical seeded exercises, distinct plans, timed and weighted sets, stale revisions, missing media, and week-boundary timestamps. Test report template:
```
Build SHA: TBD
Run date: TBD
Environment: TBD
Tool versions: TBD
DB mode: replica set / TBD
Suite: T-SES-01
Expected: one active session
Actual: TBD
Evidence: report URL/screenshot/command log
Result: NOT RUN / PASS / FAIL / BLOCKED
Owner: TBD
```

## 8. Definition of release
No fake analytics, no critical auth/ownership defect, no lost acknowledged set, no invalid completed history, at least one legitimately licensed/reviewed 3D clip (or an approved scope change), accessible fallback, successful build and real end-to-end smoke. Failed or unrun tests are disclosed, never presented as passing.
