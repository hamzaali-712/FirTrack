# FitTrack — Accessibility and Inclusive Motion Requirements

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## Standard and scope
Target **WCAG 2.2 AA**, to be verified through automated and manual checks. W3C reference: https://www.w3.org/TR/WCAG22/. A design intent does not establish conformity. Interface includes complex graphical content (charts and 3D), so text alternatives are mandatory even when canvas is not accessible.

## Core interaction requirements
- Every interactive control accessible through keyboard with visible focus; no keyboard trap except correctly managed modal dialogs.
- Preserve logical DOM reading order independent of animated visual reordering; semantic landmarks and headings.
- Minimum 44×44 px touch targets as a design guideline; audit against exact WCAG target sizing requirements.
- Labels for actual reps, weight **kg**, duration **sec**, saved/unsaved state; error messages associated with fields (`aria-describedby`).
- Status alerts announced appropriately without excessive toast repetition or focus theft.
- UI works with 200% zoom and mobile landscape and at widths 320, 360, 375, 768, 1024, 1440px.
- Color is never the only indication for a saved state, muscle highlight, chart series or completed set.

## 3D and motion
- Provide text instructions, optional accessible poster, and reduced-motion preference.
- All movement optional: no autoplay where reduced-motion setting is enabled; user starts/stops animation.
- Canvas has meaningful label and adjacent accessible descriptive content; drag/orbit not the only path to understand the movement.
- Graphs have table or textual equivalent, title, unit, period and noncolor series indicators.
- Scroll-triggered reveals must not hide content from assistive technology and must remain readable when JavaScript animation is disabled.
- Avoid flashing content and disorienting camera transitions. Do not imply that muscle glow equals precise muscle activation.

## Manual acceptance matrix
| Test | Expected outcome |
|---|---|
| Tab from navigation to landing CTA | Predictable order and focus |
| Switch to reduced motion | No nonessential auto animation; 3D static on entry |
| Disable WebGL | Instructions and signup remain available |
| Submit invalid plan | Specific accessible errors and focus path |
| Use mobile workout row with screen reader | Correct names, value units, completion/save state |
| Chart with 2 series | Labels/textual alternative distinguish series |
| 200% zoom | Hero/outro expand, footer not clipped, no horizontal scroll |

## Evidence
Store axe or equivalent output plus manual keyboard/screen-reader check notes with device/browser/version and screenshots. Never claim WCAG conformance merely because an audit tool reports zero automated issues.
