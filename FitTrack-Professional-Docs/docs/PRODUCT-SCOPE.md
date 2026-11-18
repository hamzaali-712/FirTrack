# FitTrack — Scope, Prioritization and Release Control

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## 1. Classification
**P0 = mandatory release criterion; P1 = explicitly optional phase/stretch; P2 = speculative research; OUT = excluded.** Development tasks cannot upgrade a P1 feature implicitly. A new P0 addition needs tradeoff approval and replacement of equal/greater effort.

## 2. P0 acceptance inventory
| ID | Capability | What is demonstrably complete |
|---|---|---|
| SCOPE-01 | Landing | Public `/` has accessible navigation, full viewport hero and final section, working register/login CTAs |
| SCOPE-02 | Auth/profile | Register, login, logout, refresh, profile and goal are persisted, unauthorized requests rejected |
| SCOPE-03 | Catalog | ≥32 unique seeded exercises, ≥4 in each required group, real query/filter/detail and fallback media |
| SCOPE-04 | 3D baseline | One realistic licensed anatomical humanoid GLB loads, ≥1 approved exercise clip runs, controls & fallbacks work |
| SCOPE-05 | Plans | User owns multiple distinct plans; days, order and targets saved; archive keeps session history |
| SCOPE-06 | Workouts | One active per user, performed sets persisted, resume after refresh, correct terminal transitions |
| SCOPE-07 | Analytics | History and completed-only aggregates match DB records; no dummy production figures |
| SCOPE-08 | Release | E2E/test reports, key security protections, mobile/accessibility checks, reproducible demo |

## 3. 3D scope truth table
| Capability | P0 | P1 | OUT |
|---|:---:|:---:|:---:|
| Realistic human/anatomical visual in React | ✓ | | |
| 1 genuinely reviewed exercise clip + pause/replay | ✓ | | |
| Reduced-motion / static fallback | ✓ | | |
| Camera orbit within safety limits | ✓ if performance allows; keyboard alternative required | | |
| 6–10 reviewed clips | | ✓ | |
| 3D coverage of entire 80–120 catalog | | ✓ aspirational, not committed | |
| Automatic biomechanical correctness or pose detection | | | ✓ |
| Live webcam analysis / medical assessment | | | ✓ |

## 4. Broader catalog decision
**A database capable of many exercises is P0.** Actual curated content threshold is 32+, 8 groups. Eight-week 80–120 content is *stretch only*. Unique canonical exercise slugs and per-entry QA protect quality. Fewer entries with complete correct instructions are preferable to hundreds of scraped, ambiguous or unlicensed assets.

## 5. Scope exclusions
No memberships, paid features, admin, trainer dashboard, social feed, AI coaching, nutrition prescribing, wearable import, native app, custom exercise uploads, password-reset email, realtime collaboration, offline-first sync, form grading or calibrated anatomical simulation in P0.

## 6. Definition of ready and done
Ready: user story, priority, API/data contract, UX states, risk, owner, test case; for media: license and review source. Done: deployed/tested end-to-end with evidence and no known critical data loss/security defect. Generic “looks good” and screenshots without backend integration are insufficient.

## 7. Change request example
```
CR-2026-001
Request: Add 60 more 3D exercise clips in W5
Reason: marketing/demo
Current release scope: 1 validated clip mandatory
Impact: animation production competes with saved-workout reliability and E2E testing
Decision: defer to P1 unless external ready-to-use, licensed, reviewed clips are supplied
Owner: product owner TBD; Status: example only (not an approved change)
```
