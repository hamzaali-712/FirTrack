# FitTrack — Media Asset Provenance and Animation Review Register

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


> **Important:** No 3D asset is approved for the P0 release. One pinned OpenGym3D push-up package asset is bundled as an explicitly unreviewed illustrative preview; its package and source component license statements are recorded below, but the upstream rights chain and exercise movement have not been independently reviewed.

## 1. Publishing policy
Only items with `License checked = yes`, `Rig test = pass`, `Movement review = signed` and `Status = Approved` may be associated with client-visible `animationAvailable:true` and playable metadata. No source URL or title is proof by itself.

## 2. Candidate register template
| Registry ID | Exercise slug | Media type | Creator/source | License reference | SHA-256 | Rig ID | Clip name | Form reviewer | Outcome | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| ASSET-FT-001 | `push-up` | GLB + PNG poster | OpenGym3D pack, pinned commit `ea3a60130fdcfb3c4771e44d09f84ebab4ee9bae` | Pack states MIT; source asset library identifies MPFB2 human and Mesh2Motion clip as CC0-1.0 | `71308ea9b76e1de0aa079c51314f1c9d6c2977f068664c4e8d0c001b8b3681fe` | MakeHuman default; 163 joints | `Human.rig`, 2.8 s (plus `Human` morph clip) | Not assigned | GLB parse and browser playback verified; no independent movement review | Candidate; illustrative preview only |
| ASSET-TBD-001 | `barbell-bench-press` (candidate) | GLB + clip | **TBD** | **TBD** | **TBD** | **TBD** | **TBD** | **TBD** | Not reviewed | Candidate only |
| ASSET-TBD-002 | `barbell-squat` (candidate) | GLB + clip | **TBD** | **TBD** | **TBD** | **TBD** | **TBD** | **TBD** | Not reviewed | Candidate only |
| ASSET-TBD-003 | `plank` (candidate) | GLB + clip | **TBD** | **TBD** | **TBD** | **TBD** | **TBD** | **TBD** | Not reviewed | Candidate only |

## 3. Review checklist (per individual asset)
- [ ] Human model looks appropriate and the actual rig skeleton exists.
- [ ] Clip names/joint mappings/loop duration are extracted from the binary, not guessed.
- [ ] Source and license grant allow redistribution in our website/repository/demo format.
- [ ] Source creator, file hash and permitted usage recorded.
- [ ] Review confirms it represents the named movement at least as an **illustration**.
- [ ] Medical/exercise form claims carefully avoided or independently validated.
- [ ] Performance profile and mobile/WebGL fallback are tested.
- [ ] Accessible poster, text instructions, controls, status are included.
- [ ] Publishing decision signed/date stamped.

## 4. Example approval record format (empty, not executed)
```
Registry ID:
Exercise slug:
Model source URL:
Model creator:
License URI / version:
Rights verified by / date:
Original SHA-256:
Optimized SHA-256:
Asset version:
Rig ID:
Animation clip name and duration:
Reference movement instructions:
Reviewer qualification and review date:
Warnings / known limitations:
Playback/WebGL test evidence:
Performance bytes / hardware:
Approved for P0: NO (until signed)
```

The bundled candidate is served locally at `/assets/3d/push-up.v1.glb`; its source and license notices are preserved in `client/public/assets/3d/`. A parser confirmed one glTF skin with 163 joints, a 489-channel `Human.rig` animation with a 2.8-second time range, and a separate morph animation. These are structural checks, not movement or anatomy approval. The UI labels it unreviewed and does not expose it as verified exercise media through the API.
