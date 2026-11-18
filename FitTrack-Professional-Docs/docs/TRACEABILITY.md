# FitTrack — Requirements-to-Implementation Traceability Matrix

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## 1. Matrix purpose
A requirement is **not verified** unless it maps to a designed module, executable test with recorded result, and identifiable runtime artifact. All items below currently have `Evidence: NOT RUN / NOT IMPLEMENTED VERIFIED`. The full older individual FR list is retained in `REQUIREMENTS.md`, and this matrix maps principal groups plus all v2 additions. IDs must remain stable across changes.

| Requirement / group | Owner module | API or file | Test(s) | Planned week | Evidence |
|---|---|---|---|---|---|
| FR-LAND-01..05 | React landing | `/`; `DESIGN.md` | T-UI-01, T-UI-02 | W2 | NOT RUN |
| FR-AUTH-01..06 | Auth | `/auth/register`, `/login`, `/logout`, `/session` | T-AUTH-01..03 | W2 | NOT RUN |
| FR-PROF-01..06 | Profile | `GET/PATCH /profile` | Profile CRUD/privacy | W2 | NOT RUN |
| FR-EXER-01..10 | Catalog | `GET /exercises`, `/:id` | T-EX-01..03 | W3 | NOT RUN |
| FR-3D-01..06 | 3D Viewer/Media | `animation` optional DTO; asset register | T-3D-01, T-3D-02 | W1–3 | NOT RUN |
| FR-PLAN-01..10 | Plans | `GET/POST/PATCH/DELETE /plans` | T-PLAN-01..02 | W4 | NOT RUN |
| FR-SESS-01..12 | Workouts | `/sessions`, `/:id/sets/:setId`, `/complete`, `/abandon` | T-SES-01..04 | W5 | NOT RUN |
| FR-HIST-01..04 | History | `GET /sessions`, `GET /sessions/:id` | T-HIST-01 | W6 | NOT RUN |
| FR-DASH-01..03 | Dashboard | `GET /dashboard/summary` | T-PROG-01 | W6 | NOT RUN |
| FR-PROG-01..03 | Progress | `GET /progress/summary` | T-PROG-01, CAL-* | W6 | NOT RUN |
| FR-ANALYTICS-01 | Calculation engine | `CALCULATIONS-ANALYTICS.md` | CAL-01..11 | W6 | NOT RUN |
| FR-UI-01..08 | Design/UX | `DESIGN.md`, `official-theme.md` | T-UI-* / accessibility matrix | W2–7 | NOT RUN |
| NFR security/privacy | Middleware/services | `SECURITY-PRIVACY.md` | T-SEC-01; negative auth/CSRF | W2–7 | NOT RUN |
| NFR performance/reliability | API, frontend, assets | `TEST-PLAN.md`, `DEPLOYMENT-OPERATIONS.md` | Load/WebGL/restore | W7–8 | NOT RUN |

## 2. Source precedence and change coordination
- Functional rules, input limits and P0/P1 semantics: `REQUIREMENTS.md`.
- Endpoint route, exact schema and error code: `API-CONTRACT.md`.
- MongoDB structure/indexes, transaction/CAS: `DATABASE-SCHEMA.md`, `ARCHITECTURE.md`.
- React layout/motion, palette/font and full-height sections: `DESIGN.md` and `official-theme.md`.
- 3D source provenance: `3D-ANIMATION-SYSTEM.md`, `ASSET-REGISTER.md`.
- Calculations/test cases: `CALCULATIONS-ANALYTICS.md`, `TEST-PLAN.md`.
- Approvals: `ADR-DECISIONS.md`; release evidence: `DEMO-RUNBOOK.md` + actual test artifacts.

## 3. Handling requirements change
For a new or changed FR, add/update stable ID; create/modify a test case and expected result; check API/DB compatibility, update diagrams, revision history and plan task; seek sign-off. Do **not** mark test PASS because a Markdown example exists.

## 4. Release gate report (to populate after actual implementation)
```
Build commit: TBD
P0 total required: TBD (recount against full SRS before release)
P0 automated passed: 0 verified in this documentation pack
P0 manual passed: 0 verified in this documentation pack
P0 blocked: TBD
Open security/high data loss: TBD
3D asset review evidence: NOT PROVIDED
Deployed URL: NOT PROVIDED
Decision: NOT SIGNED
```
