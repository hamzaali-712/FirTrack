# FitTrack — Architecture Decision Records and Approval Register

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## Decision states
`User confirmed` = explicit user direction; `Proposed` = recommendation needing technical sign-off; `Open` = unresolved fact/choice; `Approved` = recorded decision with approver/date; `Verified` = implemented and proven in tests/deployment. **No entries below are marked `Verified` because no running application evidence has been supplied.**

## 1. Product decisions from user direction
| ID | Decision | Status | Consequence |
|---|---|---|---|
| ADR-P01 | Personal workout tracker, not gym management | User confirmed | Single individual account role |
| ADR-P02 | MERN core only | User confirmed | MongoDB/Express/React/Node fixed |
| ADR-P03 | 2 developers; 2-month/8-week timeline | User confirmed | Tight P0 cutline and shared responsibilities |
| ADR-P04 | Ocean Breeze five color palette | User confirmed | Replace previous lime theme; accessible dark surfaces additional |
| ADR-P05 | Realistic 3D anatomical character demonstrations | User confirmed | 3D feasibility/licensing/form review gate |
| ADR-P06 | Animated effects, interactive graphs and useful math | User confirmed | Reduced-motion and measurement semantics required |
| ADR-P07 | Full-scale scalability in architecture | User confirmed | Modular monolith, indexes, content-versioned assets |
| ADR-P08 | Landing hero and closing section full viewport; middle FitTrack-specific | User confirmed | `min-height:100dvh` with mobile content growth; footer in ending |

## 2. Technical decision register
| ID | Decision or issue | Recommended resolution | Status / deadline |
|---|---|---|---|
| TD-01 | Authentication transport | Opaque MongoDB-backed `fittrack.sid` cookie sessions; bounded pre-auth CSRF session, rotate on authentication; 7-day absolute expiry; exact Origin checks | User-approved for Module 03 |
| TD-02 | Retry/duplicate writes | Partial unique active index + CAS + idempotency keys/ledger, transaction tests on replica set | Proposed; approve before W4/W5 |
| TD-03 | Week boundaries | Validated IANA timezone; Monday local 00:00, convert to UTC bounds | Proposed; approve before W6 |
| TD-04 | Tracking types | `reps_weight`, `reps_only`, `duration` only P0; kg/sec | Proposed; approve before W3 |
| TD-05 | Hosting | Same-origin HTTPS ingress, separate static assets/API, MongoDB replica set; actual provider TBD | Local decision before W1; provider before W8 |
| TD-06 | Validation/error envelope | Explicit allowlisted schemas (Zod proposed); `{data}`/`{error}` | Proposed; approve before W2 |
| TD-07 | Workout save UX | Explicit per-set server ACK; on ambiguous error refetch/reconcile before retry | Proposed; approve before W5 |
| TD-08 | Media delivery | Licensed glTF/GLB and poster, static versioned files, null fallback | Proposed; approve before W1/W3 |
| TD-09 | Analytics | Completed-only, controlled metric definitions, timezone and units from analytics doc | Proposed; approve before W6 |
| TD-10 | Tests | Vitest/RTL, Supertest, Playwright, manual a11y + controlled performance | Proposed; approve before W1 |
| TD-11 | 3D rendering library | React Three Fiber + Three.js, React-compatible versions; university library policy TBD | Open; decide W1 |
| TD-12 | Anatomical character/license/reviewer | Owned or properly licensed rigged asset, reviewed specific clip and source register | Open/high-risk W1 gate |
| TD-13 | Content expansion | ≥32 curated P0; 80–120 exercise entries P1/stretch | Proposed cutline, product approval pending |
| TD-14 | Exercise animation coverage | One licensed/form-reviewed clip P0; 6–10 P1 stretch, no promise for all | Proposed release cutline, product approval pending |
| TD-15 | Manrope source | Self-host permitted OFL webfont with fallback after license verification | Proposed; decide W1 |
| TD-16 | Privacy/legal policy | Define retention, rights, text and jurisdiction before actual public user launch | Open; not solved by documentation alone |
| TD-17 | Password hashing | Argon2id; never persist or return plaintext credentials | User-approved for Module 03 |
| TD-18 | Authentication rate-limit storage | MongoDB-backed shared counters with HMACed identifiers and synchronous expiry checks | User-approved for Module 03 |

## 3. Decisions needing consistency corrections from original M0 audit
The preexisting `M0_AUDIT.md` reported (i) documentation statuses lagged actual authored specifications, (ii) early `idea.md` open questions were resolved by the SRS, (iii) session/idempotency/CSRF designs were proposals not approvals, (iv) database update/CAS tests were not proven, and (v) old `PROJECT.md` was a lower-authority summary. This revised pack therefore:
- Represents spec files as **authored**, not code or deployment evidence.
- Uses canonical uppercase file names for source-of-truth contracts plus `idea.md` and `official-theme.md`.
- Gives the user-confirmed 8-week, 2-person, Ocean Breeze, full-height landing and 3D changes explicit precedence.
- Retains high-risk technical choices as **proposed**, pending named owners/approvals and test evidence.
- Requires exact request/version semantics from `API-CONTRACT.md`, not arbitrary older `/api` aliases.

## 4. Change governance
1. File a change request with ID, baseline requirement, proposed change, rationale, impact by module/API/schema, effort, risks and testing.
2. Identify actual owner and decision date; list alternatives including doing nothing.
3. Approve/reject; if accepted update SRS first, then API/database/UI/planning/docs/tests in same change.
4. Record migration/rollback when data or endpoint compatibility changes.
5. Log implementation and verification evidence separately; proposed approval is not proof of completion.

## 5. ADR decision template
```
ADR-ID: TD-XX
Title:
Status: Proposed / Approved / Rejected / Superseded
Owner:
Date:
Context / risk:
Options:
Decision and rationale:
Security / privacy / performance implications:
Affected contracts:
Migration/rollback:
Acceptance test:
Evidence URL / test run:
```

## 6. Immediate W1 sign-off agenda
One 60–90 minute review between both developers to confirm authenticating strategy and CSRF bootstrap, field/validation schemas, test scripts and MongoDB replica-set mechanics, rendering library permission, approved 3D model & rights, reviewer access, exact deliverables and capacity hours. When blocked, mark as `Open` and adjust P0 via formal change—not implicit assumption.
