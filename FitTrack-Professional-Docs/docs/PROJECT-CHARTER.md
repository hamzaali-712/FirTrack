# FitTrack — Project Charter and Operating Model

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## 1. Mandate
Deliver a university semester demonstration of a professional-grade MERN personal workout tracker in an 8-week planning window. Produce startup-quality specifications and a verifiable *working* end-to-end web application, not an untested imitation of production software. The user has explicitly requested a realistic animated anatomical 3D character, broad future catalog scalability, interactive charts, health-related transparent calculations, and a full-screen landing hero/ending.

## 2. Sponsors, roles and authority
| Role | Initial owner | Decision scope |
|---|---|---|
| Product owner / university coordinator | Assign | Scope, prioritization, acceptance |
| Developer A | Assign | React UI, design system, 3D viewer, browser tests |
| Developer B | Assign | Express API, MongoDB, authentication, data/testing |
| Shared engineering responsibility | Both | Architecture review, integration, media correctness, deploy, documentation |
| Exercise/anatomy reviewer | Not yet identified | Safety/form validation of any published animation |

**RACI principle:** both developers must understand and demonstrate a full React -> Express -> MongoDB workflow; no owner can sign off their own high-risk feature without the other's independent review.

## 3. Measures of success
1. Required P0 scenarios pass with evidence (test report links, demo screenshots, DB state proof).
2. Every private query is scoped to authenticated identity; sessions survive refresh and preserve history.
3. UI supports mobile at 320/360/375px and desktop at 1024/1440px with responsive content (full-height means **minimum**, not clipping content).
4. At least 32 unique curated exercises, 8 required groups, each ≥4.
5. At least one animated 3D exercise demonstrated through a validated, legally distributable asset and accessible fallback.
6. Documentation and implementation agree on routes, payloads, tracking types, field names, limits, error codes and release gates.

## 4. Time, cost, and assumptions
Start date and hard calendar submission date are **not supplied**. Weeks W1–W8 are relative. Illustration: 2 developers × 20–25 focused hours/week × 8 weeks = 320–400 team-hours; actual capacity is TBD. Hosting, asset purchase, character creation, paid animation licensing and anatomical review budgets are unknown—no purchases or third-party accounts assumed. External reviewer availability is a critical dependency.

## 5. Constraints
Strict MERN core: React/Vite, Express/Node, MongoDB/Mongoose; Tailwind and React Router; supporting packages only if permitted. Web app, not native mobile. HTTPS in hosted environment. Use English in code/comments/API; internationalization is deferred. Product text must avoid medical claims and guaranteed outcomes.

## 6. Governance cadence
- Monday: 30-minute sprint planning, owners and acceptance criteria.
- Midweek: integration checkpoint with tests on shared main branch.
- End of week: review, defects, risks, decision sign-offs and demo of **saved** data.
- Daily: short async status with done/next/blocker; red risk escalated immediately.
- Each PR: requirements linked, tests, security/UX notes, screenshots where UI changes; protect main and require other developer review.

## 7. Entry/exit and change control
A task enters work only after definition, API/UI contract, owner and acceptance evidence are agreed. Complete means merged, tested, documented and demonstrated. A new feature that displaces P0 requires written change request including time, dependencies, security, tests and descoping strategy. `ADR-DECISIONS.md` is the source of decision status. Roles and dates may be recorded once university schedule is known.

## 8. Known unknowns and blockers
- Availability/ownership/license of a realistic anatomical model and suitable gym motion clips.
- Whether React Three Fiber/Three.js is permitted under the university’s interpretation of “MERN only.”
- Whether a physiotherapist/qualified exercise reviewer is available.
- Local MongoDB replica-set setup; stable staging and deployment provider.
- Actual team hours and final submission requirements.
- An initial tested 3D clip must be feasible **by W1 exit** or its release scope must be formally revised; never invent a demo.
