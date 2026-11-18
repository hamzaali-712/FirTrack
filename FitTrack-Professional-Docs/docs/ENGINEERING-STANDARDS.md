# FitTrack — Engineering Standards, Module Layout and Review Checklist

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## 1. Repository structure (proposed, not yet built)
```text
fittrack/
├── README.md
├── docs/
│   ├── MASTER-PLAN.md
│   ├── REQUIREMENTS.md
│   ├── API-CONTRACT.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE-SCHEMA.md
│   ├── DESIGN.md
│   ├── 3D-ANIMATION-SYSTEM.md
│   └── ...
├── client/
│   ├── public/assets/exercises/     # only approved versioned media
│   ├── src/
│   │   ├── app/                     # app bootstrap/router/providers
│   │   ├── features/
│   │   │   ├── auth/ profile/ exercises/ exercise-3d/
│   │   │   ├── plans/ sessions/ history/ progress/ landing/
│   │   ├── components/ui/           # accessible reusable primitives
│   │   ├── services/api/           # credentialed HTTP client/error normalizer
│   │   ├── styles/                 # Ocean Breeze semantic tokens
│   │   └── main.jsx
│   └── .env.example
├── server/
│   ├── src/
│   │   ├── config/ middleware/ models/ repositories/
│   │   ├── modules/
│   │   │   ├── auth/ profile/ exercises/ plans/ sessions/ analytics/
│   │   ├── seed/ scripts/ utils/ errors/
│   │   └── app.js
│   └── .env.example
├── tests/
│   ├── e2e/
│   └── fixtures/
└── .gitignore
```
Structure represents **target conventions only**. Do not invent import paths in code unless files are created.

## 2. Coding conventions
- Use one documented JavaScript module style and consistent lint/format configuration (propose ESLint + Prettier; approve versions W1).
- Function/variable names `camelCase`, React components `PascalCase`, schema constants uppercase; API JSON `camelCase` and enums `snake_case` consistent with contract.
- Never duplicate validation ranges separately in frontend and backend without an identified canonical schema/data contract. API-side validation always authoritative.
- Controllers thin; service owns business rules/transactions; repositories owner-scoped; model defines persistence validation.
- No raw `Model.updateOne(filter, req.body)`, no arbitrary client sort, no ad-hoc `userId` passed as owner.
- React effects clean up event listeners/WebGL resources; guard stale async requests, avoid setting state after unmount.
- Prefer explicit loading/error/empty status objects rather than booleans that allow contradictory 'saved + saving' UI.
- Use immutable content-hash asset paths; avoid bundling all GLB assets into initial JavaScript.

## 3. Branches and pull requests
Protected `main`; short-lived `feature/auth-api`, `feature/3d-viewer`, `fix/session-cas`, `test/ownership`. Each PR includes summary, linked SRS IDs, screenshot/gif when UI changed, test command/result, API or DB changes, security/3D licensing implications and rollback when relevant. Other member reviews. Never commit real `.env`, secrets, personal fitness records or unlicensed media.

## 4. API errors and response convention
Successful data `{ "data": ... }` and optional `meta`; errors `{ "error": { "code": "...", "message": "...", "details": [...], "requestId": "..." } }`. See `API-CONTRACT.md`. A 204 response has **no body**. Unknown fields rejected; validation and invalid IDs have stable errors; no raw stack trace/DB exception in client. Use `X-Request-Id` on every API response.

## 5. Frontend state ownership
Auth identity via `/auth/session`. Catalog filters in URL/search state where practical. Forms local draft + validated save; backend status authoritative. Single active workout from `/sessions/active`. On 409 version conflict, fetch current resource, surface conflict and let user reconcile; never overwrite silently. Workout 'Saved' only on confirmed server ack or read-back. Dashboard data never hardcoded as a live number.

## 6. Performance/reliability conventions
Start with indexed DB queries and bounded lists. Use `lean()`/projection for read-only Mongoose access when appropriate and when serialization semantics are preserved. Use lazy route chunks and 3D loading; profile actual asset bytes, browser memory and API p95. Performance budgets need device/network/seed conditions; optimize proven bottlenecks, not assumed ones.

## 7. PR review checklist
- [ ] Requirements/ADR and API/database contracts synchronized.
- [ ] Negative security/owner test and request validation where applicable.
- [ ] Unit/integration/E2E tests added; no fake test evidence.
- [ ] Loading, empty, error, timeout and retry states implemented.
- [ ] Accessibility, keyboard, reduced motion and mobile tested.
- [ ] Any anatomical asset is licensed, reviewed, registered, hashed and has fallback.
- [ ] No secret, user data or source file containing personal data committed.
- [ ] Documentation, diagrams, changelog and demo notes updated as relevant.
