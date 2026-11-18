# FitTrack — University Demonstration and Evaluator Runbook

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## 1. Audience and honesty rule
Demonstrate only **tested, working** functionality. Every planned sequence here is an intended script, **not evidence that it runs**. Use local test accounts/seed data; do not put real user's sensitive data on screen. If 3D asset unavailable or unreviewed, label it as blocked rather than fake.

## 2. Pre-demo checks
- [ ] Deployed/local app starts and `/api/v1/health` responds; database connectivity verified separately.
- [ ] Frontend and backend build SHA recorded; actual `npm` scripts work.
- [ ] Catalog seed audited: 32+ unique records, 8 groups each ≥4.
- [ ] Model/clip license, review evidence and offline fallback prepared; if no reviewed asset, disclose current status.
- [ ] Test user A and test user B exist with intentionally fake credentials; passwords not shown in report.
- [ ] Browser viewport plan: mobile 360px and desktop ~1280px, keyboard demonstration.
- [ ] Reliable network / demo assets cached or static fallback prepared; never silently switch to hardcoded app screens.

## 3. Recommended 12–15 minute demo flow (estimated only)
| Segment | What to demonstrate | Evaluator can verify |
|---|---|---|
| Introduction | Ocean Breeze public landing, **full-height hero**, scroll middle, **full-height outro** and CTA | Distinct UX, responsiveness |
| Account | Register/login, set `muscle_gain` and equipment | Secure auth/profile persistence |
| Discovery | Filter Chest/Dumbbells; show multiple options and clear filters | MongoDB catalog/filter control |
| 3D (if verified) | Open exercise and play/replay approved anatomical clip, show instructions and fallback | Real GLB viewer, rights/review evidence |
| Planning | Build named Monday day, add sets/reps/targets; create separate Full Body plan | Independent CRUD and saved state |
| Tracking | Start plan day, log actual `12×40`, `10×45`, `8×50` kg, show saved feedback | Actual performed sets |
| Recovery | Refresh browser and resume same session ID | Durable state, no duplicate |
| Completion/history | Complete, view history, then edit/archive source plan and re-open history | Snapshot immutability |
| Progress | Show weekly completed session count and external-load volume `1,330 kg·reps` | Math reconciles to real DB data |
| Security | User B attempts to read User A plan ID, receives 404 | Owner-scoped API |
| Q&A | Show architecture diagram, Mongoose indexes, API contract and test report | Design choices and evidence |

## 4. Demo storyline and key explanations
- “The application is a personal workout tracker, not gym membership management.”
- “The plan records targets; the session records exactly performed reps and loads.”
- “React submits to Express; MongoDB persists actual records; reloading does not reset them.”
- “Only one workout can be active per user; database index and idempotency protect concurrent clicks.”
- “Charts exclude abandoned/in-progress sessions and use clearly defined formula units.”
- “3D is an optional educational demonstration; accuracy and rights are separately reviewed and static instructions remain accessible.”

## 5. Likely viva questions and prepared evidence
| Question | Evidence to show |
|---|---|
| Why MERN? | Requirements stack matrix and module dependency design |
| How secure is data? | Owner-filtered query, session/CSRF threat model, negative tests |
| What if page refreshes? | Active session state read from MongoDB |
| What if two tabs start a workout? | Partial unique index and concurrency test |
| Does editing a plan erase history? | Immutable session snapshot and regression test |
| Where do 3D animations come from? | License and anatomy review register; GLB path and rig test |
| Are graphs accurate? | `CALCULATIONS-ANALYTICS.md` formula and fixture, API data comparison |
| Is it production-ready? | Explain what has/hasn't been verified and remaining deployment/security requirements |

## 6. Submission package checklist
Source code, pinned dependencies/lockfile, `.env.example`, setup README, SRS, charter/plan, design system, API schema, architecture/diagrams, DB/index strategy, security, 3D license register, formulas, test evidence, real screenshots, deployment URL if created, release limitations, evaluation presentation. Never include font binaries or unlicensed character assets in the shared docs pack.

## 7. Results log (empty until executed)
```
Demo date: TBD
Build SHA: TBD
Presenter: TBD
Live URL or local version: TBD
Completed end-to-end: NOT RUN
3D model + rights + anatomical review: NOT VERIFIED
Security negative test: NOT RUN
Evaluator feedback: TBD
Known incomplete items: TBD
```
