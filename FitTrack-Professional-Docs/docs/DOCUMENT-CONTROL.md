# FitTrack — Documentation Governance, Revision and Handoff

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## 1. Documentation ownership
Product requirements are defined in `REQUIREMENTS.md`, route contracts in `API-CONTRACT.md`, MongoDB specifics in `DATABASE-SCHEMA.md`, system details in `ARCHITECTURE.md`, screens in `DESIGN.md`, brand tokens in `official-theme.md`, 3D system in `3D-ANIMATION-SYSTEM.md`, technical approval statuses in `ADR-DECISIONS.md`. Do not create independent shadow copies named `api.md` or `PROJECT.md` as new sources of truth.

## 2. Editorial standards
- Titles, stable IDs and numbered headings; concrete acceptance conditions and status for each requirement.
- Distinguish **confirmed by user**, **recommended**, **pending approval**, **verified by execution**.
- No fake signatures, evidence, test passes, model licenses, marketing statistics or staffing names.
- Label illustrative JSON/IDs/timestamps and fabricated scenarios as hypothetical; never as current server output.
- Keep full API contracts and detailed source behavior (data ownership, session state, retry) when simplifying summaries.
- Use consistent `camelCase` API JSON, `snake_case` enums, UTC timestamps, `kg`, `sec`, 24-hex MongoDB IDs.
- Link primary evidence and upstream standards in `REFERENCES.md`.

## 3. Change procedure
1. Create change request including affected user requirement IDs.
2. Update SRS/product scope.
3. Update API, Mongoose schema/migration, UI, security and tests as required.
4. Revise planning, ADR status and traceability rows.
5. In PR review, check links/diagrams and record impact on 8-week capacity.
6. Record date, author, decision, commit and actual evidence separately.

## 4. Original-source history
The user's earlier files were `api.md`, `architecture.md`, `context.md`, `design.md`, `idea.md`, `planning.md`, `requirements.md`, `M0_AUDIT.md`, and earlier nonauthoritative `PROJECT.md`. The current package reuses detailed SRS/API/architecture content with explicit revised clauses. The initial audit identified outdated documentation status and unapproved technical choices. Do not assert that original v1 content was already built.

## 5. Version 2.0 change summary
- Two developers, 8 weeks and scalable modular monolith baseline.
- Ocean Breeze palette and Manrope, replacing lime-accent design proposals.
- Full-height hero and closing section with mobile-safe layout.
- Realistic 3D anatomical viewer, approved motion asset criteria, licensing and fallback.
- Clarified P0 32+ exercise catalog and 1 verified 3D clip, P1 80–120 and 6–10 clips stretch.
- New health/calculation, asset provenance, threat model, traceability, diagram and release workstreams.
- Canonical `/api/v1` contract retained, with optional media fields added to exercise responses.

## 6. Project handoff checklist
- [ ] Owners and dates assigned; technical ADR sign-offs recorded.
- [ ] Exact Node/React/Mongoose compatibility and lockfile versions verified.
- [ ] Model/clip rights/review documented before publishing.
- [ ] Code repo and all API routes match documented names and payloads.
- [ ] CI commands tested from clean clone; evidence attached.
- [ ] Deployment URL, rollback mechanism, privacy obligations and maintenance owner declared for real hosting.
