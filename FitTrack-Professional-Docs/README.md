# FitTrack — Complete Professional Documentation Package


> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## What this is
A comprehensive **Markdown documentation deliverable** for the proposed FitTrack personal workout-tracking MERN application. It is not code, deployed website, a 3D asset bundle, a completed security audit or evidence of passing tests. It incorporates the previous supplied project specifications and the latest scope: **2 developers, 8 weeks, realistic 3D anatomical character, Ocean Breeze palette, Manrope, interactive graphs/formulas, and full-viewport landing hero and final outro**.

## Start reading here
1. **[Master Plan](docs/MASTER-PLAN.md)** — product, boundaries, milestones, scalability and reality checks.
2. **[Requirements](docs/REQUIREMENTS.md)** — authoritative detailed SRS and v2 requirements.
3. **[Scope](docs/PRODUCT-SCOPE.md)** — mandatory P0 vs stretch P1 vs excluded features.
4. **[Eight-week Planning](docs/PLANNING.md)** — responsibilities, sprint gates and cutline.
5. **[UI Design](docs/DESIGN.md)** + **[Official Ocean Breeze Theme](docs/official-theme.md)** — actual web UX contract.
6. **[3D Animation System](docs/3D-ANIMATION-SYSTEM.md)** and **[Asset Register](docs/ASSET-REGISTER.md)** — feasibility, assets, licenses and review.
7. **[Architecture](docs/ARCHITECTURE.md)** + **[Database](docs/DATABASE-SCHEMA.md)** + **[API Contract](docs/API-CONTRACT.md)** — implementation contracts.
8. **[Tests](docs/TEST-PLAN.md)** + **[Security](docs/SECURITY-PRIVACY.md)** + **[Deployment](docs/DEPLOYMENT-OPERATIONS.md)** — acceptance and operations.

## Document catalog
| Category | Canonical Markdown documents |
|---|---|
| Strategy | `MASTER-PLAN.md`, `PROJECT-CHARTER.md`, `idea.md`, `PRODUCT-SCOPE.md`, `USER-STORIES.md` |
| Design | `DESIGN.md`, `official-theme.md`, `UX-COPY.md`, `ACCESSIBILITY.md` |
| Domain/3D | `EXERCISE-CATALOG.md`, `3D-ANIMATION-SYSTEM.md`, `ASSET-REGISTER.md`, `CONTENT-LICENSING.md` |
| Engineering | `ARCHITECTURE.md`, `SYSTEM-DIAGRAMS.md`, `DATABASE-SCHEMA.md`, `API-CONTRACT.md`, `ENGINEERING-STANDARDS.md` |
| Analytics | `CALCULATIONS-ANALYTICS.md` |
| Delivery/Assurance | `PLANNING.md`, `TEST-PLAN.md`, `SECURITY-PRIVACY.md`, `DEPLOYMENT-OPERATIONS.md`, `RISKS.md`, `TRACEABILITY.md`, `DEMO-RUNBOOK.md` |
| Governance | `ADR-DECISIONS.md`, `DOCUMENT-CONTROL.md`, `REFERENCES.md` |

## Non-negotiables
- Only **MongoDB + Mongoose, Express.js + Node.js, React + Vite** as core frontend/API/database. Tailwind + React Router. Extra libraries (including Three.js/React Three Fiber) are proposals subject to the university's interpretation of supporting packages.
- Catalog **at least 32 curated unique exercises** with **at least 4 in each of 8 groups**. Broad 80–120 expansion is a **stretch**.
- One real licensed/rig-compatible **anatomical 3D character + one reviewed animation clip** P0; no claim that all exercises have an animation. Model/license/reviewer currently **not verified**.
- Home hero and final full-screen closing are **minimum full viewport height**, not fixed cropping boxes; mobile grows naturally.
- Reliable personal data isolation and saved workout history outrank cinematic presentation or arbitrary feature count.

## What is approved / what is not
**Confirmed direction:** project focus, team size and duration, MERN restriction, brand palette, anatomical 3D requirement, rich interactive app and full-screen hero/outro. **Technical proposals pending sign-off:** auth cookie mechanism, pre-auth CSRF, exact Node/npm/library versions, media source/license, anatomical reviewer, CDN/hosting, time zone and quantitative performance budgets. See `docs/ADR-DECISIONS.md`.

## Getting from documentation to software
Follow `docs/PLANNING.md` from W1. First create `client/` and `server/` and reproduce a MongoDB connection + a **licensed real 3D clip** proof. Implement one complete React -> Express -> MongoDB vertical slice per milestone and record tests. **This package does not include application source code, external model files or fonts.**

## Quality / status
- Specs authored: **yes** (see document list).
- Developer/owner approvals: **not recorded**.
- Application implementation: **not verified / not delivered here**.
- Asset rights and anatomical reviewer: **not verified**.
- Automated tests: **not run**.
- Public live deployment: **not provided**.

## Navigation and change control
Use `docs/DOCUMENT-CONTROL.md` for source of truth, `docs/TRACEABILITY.md` for requirement coverage, `docs/REFERENCES.md` for upstream guidance, and `docs/DEMO-RUNBOOK.md` for university evaluation preparation.
