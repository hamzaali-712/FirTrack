# FitTrack — Risk Register, Dependencies and Mitigations

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## Risk rating
Likelihood and impact are **qualitative estimates**, not statistical probabilities. Owners to be assigned at W1. Escalate critical/high risks before accepting a sprint or marking a milestone done.

| ID | Risk | Likelihood | Impact | Signal / mitigation | Gate |
|---|---|---|---|---|---|
| R-01 | 3D anatomical character or clip not legally reusable | High | High | Source license unknown -> stop publish; secure reviewed alternative / documented cutline | W1 |
| R-02 | 3D movement depicts incorrect form | High | High | Unreviewed/mismatched rig -> require reviewer, text fallback, reject verified badge | W1/W3 |
| R-03 | 2-person, 8-week project overcommits scope | High | High | W3/W5 slippage -> freeze P1, ship P0 flow, early integration | Weekly |
| R-04 | Cross-user data access (IDOR) | Medium | Critical | Owner-scoped queries; two-account negative tests | W2/W7 |
| R-05 | Saved workout data lost after refresh | Medium | Critical | Server-ack save, reload/timeout tests, MongoDB persistence | W5 |
| R-06 | Duplicate workout in two browser tabs | Medium | High | Unique partial index, idempotency, CAS/transactions | W5 |
| R-07 | Previous results altered by plan edit | Medium | High | Immutable snapshot, regression proof | W5/W6 |
| R-08 | WebGL unsupported or slow on mobile | High | Medium | Lazy load, static fallback, low DPR, real device testing | W3/W7 |
| R-09 | Inaccurate formula/health interpretation | Medium | High | Strict completed-only definitions, unit tests, disclaimers | W6 |
| R-10 | Auth/CSRF cookie misconfiguration in hosting | Medium | High | Same-origin design, tests with HTTPS staging | W2/W8 |
| R-11 | MongoDB replica-set/index not available | Medium | High | W1 local replica-set proof; test transaction requirement | W1 |
| R-12 | Palette contrast/motion accessibility issues | Medium | Medium | Semantic tokens; WCAG manual/automated checks | W2/W7 |
| R-13 | Unknown university supporting-library restrictions | High | Medium | Verify approval before adopting Three.js/R3F | W1 |
| R-14 | Unlicensed exercise image/font/copyright | Medium | High | Content source register and approved asset gating | W3 |
| R-15 | Last-minute deployment/provider problem | Medium | High | Choose provider before W7, smoke in staging | W7/W8 |
| R-16 | Stale or inconsistent documentation | Medium | Medium | Single source of truth, cross-contract review and change log | Every PR |

## Active risk review template
```
Risk ID:
Status: Open / Mitigating / Accepted / Closed
Owner:
Trigger:
Evidence:
Likelihood / impact change:
Mitigation / contingency:
Target sprint:
Decision approver:
```

## Stop-ship conditions
Unresolved high-severity data leak, unverified ability to revoke sessions, known workout-loss bug, duplicate completed sessions under retry, an inaccurately claimed licensed/reviewed 3D clip, hardcoded production analytics as user data, absent P0 acceptance evidence or illegal asset redistribution. A project may still be submitted as a *partial prototype*, but must not be misrepresented as complete/production-ready.
