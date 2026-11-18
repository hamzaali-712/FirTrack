# FitTrack — Verified Public Standards and Technology References

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## Source policy
The following are public upstream technical/standards references consulted when designing the documentation on 2026-11-18. They substantiate **capabilities or recommended controls**, not product implementation, licenses of specific 3D media, achieved performance, or medical certification. Re-check upstream docs and actual package compatibility at implementation time. The user's source project files (`idea.md`, `requirements.md`, `planning.md`, `context.md`, `design.md`, `api.md`, `architecture.md`, `M0_AUDIT.md`, `PROJECT.md`) form the project-specific baseline; new decisions are in `ADR-DECISIONS.md`.

| Reference | Official link | Why it matters |
|---|---|---|
| W3C WCAG 2.2 | https://www.w3.org/TR/WCAG22/ | Text/nontext contrast, keyboard, motion and accessibility requirements |
| OWASP ASVS 5.0 | https://asvs.owasp.org/ | Authentication, authorization, session security, business validation and testing standard |
| React Three Fiber documentation | https://r3f.docs.pmnd.rs/getting-started/introduction | React-based Three.js rendering fundamentals |
| Three.js GLTFLoader | https://threejs.org/docs/pages/GLTFLoader.html | Loading glTF/GLB assets and animation data |
| Khronos glTF 2.0 specification | https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html | Skeletal skinning, animations, and glTF format guarantees |
| Adobe Mixamo FAQ | https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html | Candidate motion source and use conditions; not proof for a specific asset |
| Google Fonts Manrope license | https://github.com/google/fonts/tree/main/ofl/manrope | Typeface metadata and license provenance |
| Mongoose version support | https://mongoosejs.com/docs/version-support.html | Choose a supported ODM version |
| Mongoose 9 Node compatibility | https://mongoosejs.com/docs/migrating_to_9.html | Mongoose 9 Node ≥20.19.0 requirement if selected |
| CDC Adult BMI calculator | https://www.cdc.gov/bmi/adult-calculator/index.html | Adult BMI is screening, not individual diagnosis; age applicability |

## Source scope vs. assumptions
- **User-supplied project files:** v1 behavioral definitions, routes, full numerical field limits, session snapshots, indexes and audit issues were used as the basis for the current contract. The supplied later conversation sets the 2-person / 8-week / 3D / Ocean Breeze / full-height landing changes.
- **External references:** tools/standards support technical feasibility and quality constraints. No third-party model/animation file has been fetched, inspected or licensed in this deliverable.
- **Proposals:** exact hosting, versions, 3D rig/clip, anatomical reviewer, authentication library and performance budgets await owner approval or execution proof.

## Citation and change expectation
Before a technical release, capture actual package versions, license versions, security standard clause mappings, and acquisition receipts where applicable. Do not convert a general provider FAQ into a blanket grant to redistribute a particular asset.
