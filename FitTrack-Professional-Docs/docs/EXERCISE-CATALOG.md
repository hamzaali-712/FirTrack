# FitTrack — Exercise Catalog, Content Model and Curation Policy

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## 1. Catalog strategy
Seed a consistent MongoDB catalog with **≥32 distinct canonical exercises**, **≥4 per Chest, Back, Shoulders, Biceps, Triceps, Legs/Glutes, Core, Cardio**. Add richer subgroups later (quads/hamstrings/glutes/calves, conditioning, mobility) without breaking the existing API's 8-group enum or changing existing histories. Expansion to 80–120 records is a stretch target, not promised P0.

## 2. Required seeded candidate inventory (32 examples)
These are **planning candidates, not verified published records**; exercise names, difficulty, equipment and descriptions must be curated and reviewed before seeding.

| Required group | Four minimum candidate examples |
|---|---|
| Chest | Barbell Bench Press; Incline Dumbbell Press; Push-Up; Chest Press Machine |
| Back | Lat Pulldown; Pull-Up; Seated Cable Row; One-Arm Dumbbell Row |
| Shoulders | Overhead Press; Lateral Raise; Rear Delt Fly; Face Pull |
| Biceps | Barbell Curl; Dumbbell Curl; Hammer Curl; Preacher Curl |
| Triceps | Cable Triceps Pushdown; Overhead Triceps Extension; Skull Crusher; Close-Grip Push-Up |
| Legs/Glutes | Squat; Leg Press; Romanian Deadlift; Walking Lunge |
| Core | Plank; Crunch; Dead Bug; Hanging Knee Raise |
| Cardio | Brisk Walking; Running; Cycling; Rowing Machine |

Additional candidates: Dumbbell Fly, Cable Crossover, Barbell Row, Chest-Supported Row, Arnold Press, Cable Lateral Raise, Incline Curl, Reverse Curl, Dips, Leg Extension, Leg Curl, Hip Thrust, Calf Raise, Side Plank, Bicycle Crunch, Jump Rope. Before adding, ensure taxonomy and measurement type fit the strict P0 contract.

## 3. Canonical data fields
| Field | Rule |
|---|---|
| `id` | Stable MongoDB ObjectId serialized as 24-hex lowercase |
| `slug` | Unique, controlled, stable kebab-case |
| `name` | Distinct nonmisleading exercise title |
| `primaryMuscleGroup` | One of 8 established group enum values |
| `secondaryMuscleGroups[]` | Optional controlled groups |
| `equipment[]` | Controlled array: bodyweight/dumbbells/barbell/machine/cable/other |
| `difficulty` | beginner/intermediate/advanced |
| `trackingType` | `reps_weight`, `reps_only`, `duration` |
| `goalTags[]` | Optional goal relevance, not authorization/filter exclusion |
| `instructions[]` | Ordered, clear, educational steps |
| `safetyNotes[]` | Non-diagnostic cautions; no guarantees |
| `imageUrl` | Optional approved asset or null |
| `animation` | Optional **approved** 3D metadata; nullable otherwise |
| `isActive` | Visibility flag; disabling must not rewrite session snapshots |

Search/filters combine via AND. `goal` changes ranking rather than catalog membership. Negative or unsupported pagination values rejected. User-created custom exercises are P1; app users cannot change seeded catalog via ordinary API.

## 4. Tracking semantics
- `reps_weight`: actual repetitions integer 1–100 and external weight kg within contract range; weight may be zero for an unloaded supported exercise.
- `reps_only`: repetitions integer 1–100; do not fabricate 0 kg for a timed movement.
- `duration`: completed seconds integer 1–7200 in P0, no reps or load required.
- Cardio distance/pace and power/heart-rate details are **not** P0 analytics requirements; do not pretend timed-only tracking covers them.

## 5. Data quality workflow
1. Define slug, group and tracking type using canonical taxonomy.
2. Research movement name/equipment/instructions from credible sources; write original paraphrase and record provenance.
3. Ensure one exercise name/slug maps to one movement variant; variants use separate slugs where meaningful.
4. Check images, 3D model and animation rights; no found-on-web media automatically publishable.
5. Review instructions for harmful ambiguity with a qualified reviewer when possible; no medical certification claim without evidence.
6. Apply metadata validation and idempotent seed (upsert by `slug`), with staged review/status field maintained by seed tooling.
7. Execute seed audit: unique slug count; per-group counts; missing fields; clip status licensed/reviewed; duplicate names; safe URLs; total active.

## 6. Discovery UX
Search, muscle-group chips, equipment and difficulty filters. Results show name, group, gear, level and optional 3D availability indicator. A missing 3D asset must never hide the exercise. `Clear filters` returns the full catalog. Search names are user text only—not raw database selectors. Catalog browse is authenticated under current API v1; the landing page may preview **static curated examples**, not invoke protected catalog endpoints anonymously.

## 7. Extensible taxonomy
Keep `primaryMuscleGroup` in established v1 enum; add optional `muscleSubgroupTags[]`/`movementPattern` via versioned additive fields, only after cross-document schema approval. Proposed examples: `quads`, `hamstrings`, `glutes`, `calves`, `hinge`, `squat`, `push`, `pull`, `carry`, `rotation`; these are **not existing mandatory DB enum values**. Adding a new top-level filter must update `/exercises` validation and testing; adding a field to existing documents requires seed migration/backfill.

## 8. Acceptance and metrics
- 32+ active unique slugs; 4+ distinct exercises per 8 required groups.
- Filters remain accurate and paginated; details available; empty-state helpful.
- Zero unreviewed 3D assets marked `verified`; exactly documented published asset version.
- All instructional content retained where no animation exists.
- Seed rerun idempotent and stable; absent images are `null` with fallback.
