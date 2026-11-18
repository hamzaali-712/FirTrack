# FitTrack — Media Asset Provenance and Animation Review Register

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


> **Important:** The rows below are **planning placeholders**. There are **zero verified or licensed 3D media assets recorded** by this document; no author, URL, license, anatomical reviewer or file hash has been fabricated.

## 1. Publishing policy
Only items with `License checked = yes`, `Rig test = pass`, `Movement review = signed` and `Status = Approved` may be associated with client-visible `animationAvailable:true` and playable metadata. No source URL or title is proof by itself.

## 2. Candidate register template
| Registry ID | Exercise slug | Media type | Creator/source | License reference | SHA-256 | Rig ID | Clip name | Form reviewer | Outcome | Status |
|---|---|---|---|---|---|---|---|---|---|---|
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
