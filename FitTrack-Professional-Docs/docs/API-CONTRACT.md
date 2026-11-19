# FitTrack — REST API Specification (Version 2.0)

**Document:** `api.md`  
**Version:** 2.0.0 (implementation contract proposal; review pending)  
**Date:** 2026-11-18  
**Status:** Contract design for review; no endpoints, tests or deployment are claimed implemented  
**Application:** FitTrack — Personal Workout Tracker (Option A)  
**Companion documents:** `idea.md`, `REQUIREMENTS.md`, `PLANNING.md`, `ADR-DECISIONS.md`, `DESIGN.md`; `ARCHITECTURE.md`

> **Contract governance:** This document proposes precise wire-level decisions needed to implement the approved product requirements. Product commitments in the SRS take precedence. Authentication transport, index mechanics, timezone policy, autosave behavior, hosting, test frameworks, and analytics definitions are **proposed technical resolutions** of `ADR-DECISIONS.md` TD-01…TD-10, not previously approved decisions. Ratify them before the associated milestone; record changes in `ADR-DECISIONS.md` and `ARCHITECTURE.md`. Do not silently change the SRS or MVP scope.

---


## Version 2.0 extension — 3D anatomical media and new UX (authoritative additive contract)

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


The full v1 route tables, idempotency semantics, authentication, error codes and validations below are retained **unchanged**. New website design requirements are client-side: public landing has full-height hero and outro; register/login remain existing routes. Real 3D is an *optional per-exercise asset* and does **not** require a separate backend service or duplicate catalog endpoint.

### Exact additive exercise response fields
1. Collection items from `GET /api/v1/exercises` optionally expose `animationAvailable: boolean` (**default false** when no media is approved). This is display metadata, not a fitness claim.
2. Detail `GET /api/v1/exercises/:exerciseId` optionally exposes `animation: null | ExerciseAnimationDTO`, and absence of a field in older seeded documents serializes as `null`.
3. Only **approved/verified** media may be exposed as playable; `pending`/`missing` asset states are internal provenance and present as `animation: null`, `animationAvailable:false` to untrusted clients. This avoids false verified claims.
4. The API remains authenticated for exercise discovery; public landing can use *local curated preview content* and lazy-loaded public 3D hero assets. No backend ownership leak.

```json
{
  "data": {
    "id": "66aabbccddeeff0011223401",
    "name": "Incline Dumbbell Press",
    "primaryMuscleGroup": "chest",
    "equipment": ["dumbbells"],
    "difficulty": "beginner",
    "trackingType": "reps_weight",
    "imageUrl": null,
    "animation": {
      "format": "glb",
      "assetUrl": "/assets/exercises/incline-press.v1.glb",
      "posterUrl": "/assets/exercises/incline-press.webp",
      "clipName": "incline_press_loop",
      "modelRigId": "fittrack_human_v1",
      "primaryMuscleRegions": ["chest"],
      "reviewRef": "ANAT-001"
    }
  }
}
```
Above is an **illustrative hypothetical contract**, not a claim that an asset, review or API response exists.

**Response validation:** `format` currently only `glb`; approved same-origin relative asset path or explicit allowlisted HTTPS asset host; no arbitrary URLs, script/HTML injection or signed private user data; `clipName` must actually exist in the asset; `modelRigId` must match the clip; `reviewRef` must map to recorded review evidence. `animationAvailable` derived from verified media registry, not client-supplied. Source changes never mutate old session snapshots. Static assets may be public, but private progress/session JSON remains `no-store`.

### Backward-compatibility, caching and test consequences
These are additive v1 JSON fields. Existing clients may ignore them. Breaking renames must not be introduced without a versioned migration. API integration tests must prove approved-only serialization, safe `null` fallback, stable ETags/hashed asset version URLs (if enabled), and correct rejection of untrusted asset metadata in mutations. No ordinary user route can publish or upload 3D assets in P0.

### User-facing calculations
Analytics endpoints remain `GET /dashboard/summary` and `/progress/summary` without new unapproved endpoints. The calculated definitions in `CALCULATIONS-ANALYTICS.md` are applied server-side. User-specific details must not be serialized into public landing preview or asset URLs.

---

## 1. Purpose, scope and principles

FitTrack is a single-personal-account workout tracker built with **React + Vite** (frontend), **Node.js + Express** (API), **MongoDB + Mongoose** (persistence). This contract defines the JSON interface used by the React client, validation and ownership rules, replay/retry semantics, and testable outcomes. It supports registered users choosing from a seeded catalog (≥32 options, ≥4 in each of Chest, Back, Shoulders, Biceps, Triceps, Legs/Glutes, Core, Cardio), creating multiple independent plans, logging performed sets, resuming sessions after refresh, and reviewing immutable completed history.

**P0 / MVP:** register, login, logout, current user/profile, exercise list/detail/filter, multiple plan CRUD and day selection, one active workout per user, save/edit performed sets, complete/abandon, resume, history/detail, basic dashboard/progress. **P1 / later:** password reset/change, user-created exercises, alternatives, starter templates, historical body measurements, advanced graphs, in-session ad hoc exercises, rest timer, light-mode toggle. No gym-owner/trainer/admin, subscriptions, social feed, payments or automated coaching in P0.

### 1.1 API-wide rules

| Concern | Contract |
|---|---|
| Base path | `/api/v1` (Express router mounted under `/api/v1`) |
| Transport | HTTPS in deployment; JSON UTF-8; `Content-Type: application/json` on nonempty mutation bodies |
| Resource IDs | 24-character lowercase hex MongoDB ObjectId string in responses; validate input IDs, no database internals exposed |
| JSON naming | `camelCase`; enums are `snake_case` string values |
| Time | UTC ISO-8601 strings ending in `Z`; server is time authority for created/completed times |
| Weight | Kilograms (`weightKg`); distances/pace analytics are out of P0 |
| Body shape | Success: `{ "data": ... }`, collections may also carry `meta`; error: `{ "error": { ... } }` |
| Unknown fields | Reject on mutation (`VALIDATION_ERROR`); do not silently persist clients' extra fields |
| Nullable updates | Optional profile fields may be explicitly set to `null`; absent field means no change |
| Response secrets | Never send password/hash, internal token, MongoDB session internals, or other users' data |
| Caching | Protected resources: `Cache-Control: private, no-store`; authentication responses also `no-store` |
| API evolution | Additive fields allowed within v1; breaking changes require `/api/v2` and migration plan |

A response example containing a fixed ID or timestamp is **illustrative**, not a literal value generated by the system.

### 1.2 Common envelopes

**Success (single item):**

```json
{
  "data": {
    "id": "66aabbccddeeff0011223344",
    "name": "Chest Builder"
  }
}
```

**Collection:**

```json
{
  "data": [{ "id": "66aabbccddeeff0011223344", "name": "Bench Press" }],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1, "hasNextPage": false }
}
```

**Error:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted fields.",
    "details": [
      { "field": "targetSets", "code": "OUT_OF_RANGE", "message": "Must be between 1 and 12." }
    ],
    "requestId": "req_8ac012"
  }
}
```

`details` is optional and contains safe, user-actionable field errors; no stack traces, database error text or sensitive personal details. Every response should include `X-Request-Id` and a matching optional `error.requestId` for support/debugging. Empty success deletion responses use `204 No Content` with **no** JSON body.

---

## 2. Authentication and security contract

### 2.1 Approved resolution of TD-01: server-side sessions

**Approved for Module 03:** use opaque random session IDs in a `HttpOnly`, `Secure` (production), `SameSite=Lax`, `Path=/` cookie named `fittrack.sid`, backed by a server-side revocable MongoDB session store. Use a seven-day absolute expiry; rotate the session ID after login/registration and revoke it on logout. Never embed session IDs in JSON or browser storage. For same-origin deployment, use a reverse proxy serving the React app and API under the same site.

**CSRF:** every state-changing request requires a server-issued token from `GET /api/v1/auth/csrf`, returned in JSON and transmitted in `X-CSRF-Token`; validate it against the current session. Registration/login bootstrap uses a bounded pre-auth MongoDB session (10-minute expiry), rotated on successful authentication. Limit new bootstrap sessions to 60 per IP per hour. Require an allowlisted `Origin` (or same-origin `Referer` fallback) on mutations. The token is not a credential replacement. In production reject cross-site origins; configure credentialed CORS only for explicit React origins, never `*`. Do not accept credentials in query strings. `SameSite` alone is not the CSRF defense.

**Cookie example (production):**

```http
Set-Cookie: fittrack.sid=<opaque-server-generated-value>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
Cache-Control: no-store
```

**Authenticated client request:**

```http
PATCH /api/v1/profile HTTP/1.1
Content-Type: application/json
Cookie: fittrack.sid=<opaque-session-id>
X-CSRF-Token: <server-issued-csrf-token>
```

**Security baseline:** use Argon2id password hashing; apply strong input validation and parameter/query allowlists; use MongoDB-backed shared authentication rate-limit counters with HMACed identifiers; use HTTP security headers; bound request sizes to 64 KiB JSON; use environment secrets; protect against NoSQL operator injection; and prohibit cross-user record access. Never store or return passwords in plaintext or log session cookies, CSRF tokens, or password bodies.

The initial authentication rate limits are: 5 registrations per IP per hour, 30 login attempts per IP per 15 minutes, and 8 login attempts per IP+normalized-email per 15 minutes. Counters use atomic fixed windows; the HMAC secret is configured through `AUTH_HMAC_SECRET`. These thresholds are implementation defaults and must be monitored and tuned for the production ingress.

### 2.2 Authorization matrix

| Resource / action | Guest | Signed-in owner | Signed-in non-owner |
|---|---|---|---|
| Register, login, CSRF bootstrap | Allowed | Allowed where meaningful | N/A |
| Public landing (React, not API) | Allowed | Allowed | N/A |
| Exercise list/detail | **Authenticated in v1 P0** | Read-only | Read-only catalog (no user data) |
| Current profile | 401 | Read/write own | No other-user endpoint |
| Plans | 401 | CRUD own | 404 (avoid existence leakage) |
| Sessions / history | 401 | Manage/read own under status rules | 404 |
| Dashboard / progress | 401 | Read own | No other-user endpoint |
| Catalog modification | 403 | 403 | 403 (seed script only P0) |

`userId` **must be derived from the server session**, never accepted as a query parameter or JSON ownership field. Foreign private resource IDs return `404 RESOURCE_NOT_FOUND`; missing/expired identity returns `401 UNAUTHENTICATED`. Permissions are checked within the database filter, e.g. `{ _id, userId }`, not just in React.

---

## 3. Endpoint index

**All below include `/api/v1` prefix.** `🔒` means authenticated; `✎` means CSRF-protected mutation. P1 endpoints are deliberately identified, not part of the MVP acceptance gate.

| Method | Route | Access | Purpose | Priority |
|---|---|---|---|---|
| GET | `/health` | Public | Liveness (non-sensitive) | P0 |
| GET | `/auth/csrf` | Public/signed in | Issue CSRF token | P0 |
| POST | `/auth/register` | Public ✎ | Create account and sign in | P0 |
| POST | `/auth/login` | Public ✎ | Establish session | P0 |
| POST | `/auth/logout` | 🔒 ✎ | Revoke session | P0 |
| GET | `/auth/session` | 🔒 | Session/user snapshot | P0 |
| GET | `/profile` | 🔒 | Current user/profile | P0 |
| PATCH | `/profile` | 🔒 ✎ | Update profile/goals | P0 |
| GET | `/exercises` | 🔒 | Search/filter catalog | P0 |
| GET | `/exercises/:exerciseId` | 🔒 | Exercise details | P0 |
| GET | `/plans` | 🔒 | Own active plans | P0 |
| POST | `/plans` | 🔒 ✎ | Create independent plan | P0 |
| GET | `/plans/:planId` | 🔒 | Plan detail | P0 |
| PATCH | `/plans/:planId` | 🔒 ✎ | Edit plan including days | P0 |
| DELETE | `/plans/:planId` | 🔒 ✎ | Soft-archive plan | P0 |
| POST | `/sessions` | 🔒 ✎ | Start selected plan day | P0 |
| GET | `/sessions/active` | 🔒 | Current in-progress session | P0 |
| GET | `/sessions/:sessionId` | 🔒 | Own session snapshot/detail | P0 |
| PATCH | `/sessions/:sessionId/sets/:setId` | 🔒 ✎ | Save performed set | P0 |
| POST | `/sessions/:sessionId/complete` | 🔒 ✎ | Finish idempotently | P0 |
| POST | `/sessions/:sessionId/abandon` | 🔒 ✎ | Discard active session | P0 |
| GET | `/sessions` | 🔒 | Paginated own history | P0 |
| GET | `/dashboard/summary` | 🔒 | Dashboard statistics | P0 |
| GET | `/progress/summary` | 🔒 | Basic progress trend | P0 |
| POST/GET | `/body-metrics` | 🔒 ✎/🔒 | Historical measurements | **P1** |
| POST | `/auth/change-password` | 🔒 ✎ | Change password | **P1** |
| POST | `/auth/password-reset/*` | Public ✎ | Recovery | **P1** |

**Routing note:** Express static routes like `/sessions/active` must precede `/:sessionId`; validate all ID params. For P0, **the home page may be public while the exercise API requires login**; a future public exercise browser would require a policy change.

---

## 4. Health and session endpoints

### 4.1 `GET /health` — 200

```json
{ "data": { "status": "ok", "service": "fittrack-api" } }
```

Liveness only; do not leak service version, host, configuration, full exception details, database credentials, or user counts. Optionally provide a separate internal readiness endpoint protected by infrastructure.

### 4.2 `GET /auth/csrf` — 200

```json
{ "data": { "csrfToken": "<opaque-csrf-token>" } }
```

Response `Cache-Control: no-store`. Registration/login and authenticated mutations include the returned token in `X-CSRF-Token`. Token rotation after authentication requires the React client to fetch a fresh token.

### 4.3 `POST /auth/register` — 201

```json
{
  "name": "Ayesha Khan",
  "email": "ayesha@example.com",
  "password": "ExampleStrongPass9!"
}
```

```json
{
  "data": {
    "user": {
      "id": "66aabbccddeeff0011223301",
      "name": "Ayesha Khan",
      "email": "ayesha@example.com",
      "primaryGoal": "general_fitness",
      "experienceLevel": "beginner",
      "equipmentPreferences": [],
      "heightCm": null,
      "currentWeightKg": null,
      "age": null
    },
    "authenticated": true
  }
}
```

Server normalizes trimmed/lowercase email, ensures uniqueness with an indexed normalized field, stores only password hash, and starts a new session. `409 EMAIL_ALREADY_REGISTERED` for duplicate registration; this is an explicit SRS-allowed exception to generic sign-in errors. Password 8–128 chars, name 2–80, email ≤254. Never return password or hash. For registration, the request *must not* contain a `role` or `userId` property.

### 4.4 `POST /auth/login` — 200

```json
{ "email": "ayesha@example.com", "password": "ExampleStrongPass9!" }
```

```json
{
  "data": {
    "authenticated": true,
    "user": { "id": "66aabbccddeeff0011223301", "name": "Ayesha Khan", "email": "ayesha@example.com" }
  }
}
```

Invalid email **or** password returns `401 INVALID_CREDENTIALS` with the same generic message; rate-limit repeated attempts (`429 RATE_LIMITED`). Rotate session ID and CSRF token after login.

### 4.5 `POST /auth/logout` — 204

Body is empty. Requires login + CSRF; revoke server session and clear cookie. Protected requests with old cookie return `401`. Clients must clear in-memory user/CSRF state, including after failed network logout (without claiming server revocation if it was not confirmed).

### 4.6 `GET /auth/session` — 200

```json
{
  "data": {
    "authenticated": true,
    "user": { "id": "66aabbccddeeff0011223301", "name": "Ayesha Khan", "email": "ayesha@example.com" },
    "expiresAt": "2026-11-22T13:00:00.000Z"
  }
}
```

Use on page refresh to hydrate authenticated React state. An expired/missing cookie returns `401 UNAUTHENTICATED`. No session tokens in response.

---

## 5. Profile and goals

### 5.1 `GET /profile` — 200

```json
{
  "data": {
    "id": "66aabbccddeeff0011223301",
    "name": "Ayesha Khan",
    "email": "ayesha@example.com",
    "primaryGoal": "muscle_gain",
    "experienceLevel": "beginner",
    "equipmentPreferences": ["dumbbells", "bodyweight"],
    "heightCm": 165,
    "currentWeightKg": 62.5,
    "age": 22,
    "updatedAt": "2026-11-15T13:20:00.000Z"
  }
}
```

### 5.2 `PATCH /profile` — 200

```json
{
  "name": "Ayesha Khan",
  "primaryGoal": "strength",
  "experienceLevel": "intermediate",
  "equipmentPreferences": ["barbell", "dumbbells", "machine"],
  "heightCm": 165,
  "currentWeightKg": 63.2,
  "age": 22
}
```

Returns full updated safe profile in `{ "data": { ... } }`. Allowed `primaryGoal`: `muscle_gain`, `strength`, `fat_loss`, `endurance`, `general_fitness`. Allowed `experienceLevel`: `beginner`, `intermediate`, `advanced`. Allowed equipment slugs: `bodyweight`, `dumbbells`, `barbell`, `machine`, `cable`, `other` (map to human-readable UI labels). Validate: name trimmed 2–80 chars; `heightCm` finite 80–250; `currentWeightKg` finite 20–350; `age` integer 16–100; preferences array of distinct enum members. Optional numeric fields can be cleared with `null`. Goal change **never mutates** plans or prior sessions. Email and password are not edited through this endpoint in P0. All exercises remain searchable regardless of goal.

---

## 6. Exercise library and discovery

### 6.1 `GET /exercises` — 200

**Query parameters** (all optional):

| Parameter | Format | Notes |
|---|---|---|
| `q` | String, 1–100 chars | Case-insensitive, partial name matching; trim; escape regex special characters if using regex |
| `muscleGroup` | One group slug | `chest`, `back`, `shoulders`, `biceps`, `triceps`, `legs_glutes`, `core`, `cardio` |
| `equipment` | One equipment slug | e.g. `dumbbells`, `bodyweight`, `barbell`, `machine`, `cable`, `other` |
| `difficulty` | One enum | `beginner`, `intermediate`, `advanced` |
| `goal` | One goal enum | *Advisory relevance ranking only*, never access restriction |
| `page` | Integer 1–10000 | Default 1 |
| `limit` | Integer 1–50 | Default 20 |
| `sort` | Enum | `name_asc` (default), `name_desc`, `relevance` (`relevance` for goal/q only) |

Example:

```http
GET /api/v1/exercises?muscleGroup=chest&equipment=dumbbells&difficulty=beginner&goal=muscle_gain&page=1&limit=20
```

```json
{
  "data": [
    {
      "id": "66aabbccddeeff0011223401",
      "name": "Incline Dumbbell Press",
      "primaryMuscleGroup": "chest",
      "secondaryMuscleGroups": ["triceps", "shoulders"],
      "equipment": ["dumbbells"],
      "difficulty": "beginner",
      "trackingType": "reps_weight",
      "goalTags": ["muscle_gain", "strength"],
      "imageUrl": null,
      "animationAvailable": false
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1, "hasNextPage": false }
}
```

Filters **AND** together; `goal` influences ordering, not membership. Empty search returns `{ "data": [], "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0, "hasNextPage": false } }` with 200; UI offers Clear filters. Counts reflect filtered results only. Any unsupported query key/value is rejected as `400 INVALID_QUERY` to prevent unbounded queries.

### 6.2 `GET /exercises/:exerciseId` — 200

```json
{
  "data": {
    "id": "66aabbccddeeff0011223401",
    "name": "Incline Dumbbell Press",
    "primaryMuscleGroup": "chest",
    "secondaryMuscleGroups": ["triceps", "shoulders"],
    "equipment": ["dumbbells"],
    "difficulty": "beginner",
    "trackingType": "reps_weight",
    "instructions": ["Set the bench to a moderate incline.", "Lower weights with control.", "Press upward without bouncing."],
    "goalTags": ["muscle_gain", "strength"],
    "imageUrl": null,
    "animation": null
  }
}
```

Tracking types: `reps_weight`, `reps_only`, `duration`. Missing image is `null`, not broken markup; frontend renders a fallback. Images, if present, must be vetted HTTPS or approved local asset paths. Curated catalog is seeded through protected project scripts, **not** mutable by ordinary users in P0.

---

## 7. Plans: model and CRUD

### 7.1 Plan JSON shape

The following is one full response document; server creates IDs and timestamps. Each workout day has stable ID, and each day exercise has its own stable ID independent of the referenced catalog exercise ID.

```json
{
  "id": "66aabbccddeeff0011223501",
  "name": "4-Day Muscle Split",
  "description": "My weekly training template",
  "days": [
    {
      "id": "66aabbccddeeff0011223511",
      "label": "Day 1 — Chest",
      "weekday": 1,
      "exercises": [
        {
          "id": "66aabbccddeeff0011223521",
          "exerciseId": "66aabbccddeeff0011223401",
          "position": 0,
          "targetSets": 3,
          "targetReps": 10,
          "targetDurationSec": null,
          "targetWeightKg": 20
        }
      ]
    }
  ],
  "createdAt": "2026-11-15T13:30:00.000Z",
  "updatedAt": "2026-11-15T13:30:00.000Z",
  "version": 1
}
```

**Input conventions:** Plan creation accepts day/exercise nested inputs *without server IDs*; the API generates stable IDs for each nested item. Plan update uses full `days` replacement including previously returned nested IDs, or new entries without IDs (server assigns). IDs owned by the same plan may be reused; foreign/unknown nested IDs are rejected. This provides a deterministic reorder/remove contract. `version` is required on update for optimistic concurrency.

### 7.2 `POST /plans` — 201

```json
{
  "name": "4-Day Muscle Split",
  "description": "My weekly training template",
  "days": [
    {
      "label": "Day 1 — Chest",
      "weekday": 1,
      "exercises": [
        {
          "exerciseId": "66aabbccddeeff0011223401",
          "position": 0,
          "targetSets": 3,
          "targetReps": 10,
          "targetWeightKg": 20
        }
      ]
    }
  ]
}
```

Returns `{ "data": <full plan> }` with `Location: /api/v1/plans/:planId`. **Required header:** `Idempotency-Key: <UUID>`; same user + method + route + key + same canonical body returns original response, not another plan. Different body under same key returns `409 IDEMPOTENCY_KEY_REUSED`. Retain key records at least 24 hours (proposed; ratify in TD-02). This guarantees the SRS's multi-plan behavior without accidental duplicates under retries.

### 7.3 `GET /plans` — 200

```http
GET /api/v1/plans?page=1&limit=20&sort=updated_desc
```

```json
{
  "data": [
    { "id": "66aabbccddeeff0011223501", "name": "4-Day Muscle Split", "dayCount": 1, "updatedAt": "2026-11-15T13:30:00.000Z", "version": 1 }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1, "hasNextPage": false }
}
```

Only non-archived plans belonging to current user. `sort=updated_desc|updated_asc|name_asc`; default `updated_desc`. Pagination defaults/limits same as catalog; `GET /plans/:planId` returns `{ "data": <full plan> }` or safe 404.

### 7.4 `PATCH /plans/:planId` — 200

```json
{
  "version": 1,
  "name": "4-Day Muscle Split — Updated",
  "days": [
    {
      "id": "66aabbccddeeff0011223511",
      "label": "Day 1 — Chest",
      "weekday": 1,
      "exercises": [
        {
          "id": "66aabbccddeeff0011223521",
          "exerciseId": "66aabbccddeeff0011223401",
          "position": 0,
          "targetSets": 4,
          "targetReps": 8,
          "targetWeightKg": 25
        }
      ]
    }
  ]
}
```

Returns full updated plan with `version: 2`. Every update contains `version` and at least one mutable field; if `days` is present it replaces the entire `days` array atomically, while absence leaves days unchanged. Reject a stale version with `409 VERSION_CONFLICT` and return *current version number only* in safe `details` (client refetches). The API validates every nested item and all catalog references before writing. Exercise order is the ascending `position` with no duplicates; days max 7; exercises/day max 20.

### 7.5 `DELETE /plans/:planId` — 204

Soft-archives own plan (`archivedAt` server field); it disappears from `/plans`, but existing active/completed sessions and embedded snapshot remain accessible. Archiving does **not** abandon an existing session. UI must confirm before deletion. For an already archived plan, return 204 for the same owner (idempotent deletion). Foreign plan returns 404.

### 7.6 Plan validation rules

| Field | Requirement |
|---|---|
| `name` | Trimmed 2–80 chars |
| `description` | Optional, ≤500 chars |
| `days` | 1–7 entries; empty exercises allowed while drafting |
| `day.label` | 1–50 chars |
| `day.weekday` | `null`/absent or integer 0–6 (Sun–Sat), duplicate weekdays permitted |
| `exercises` per day | 0–20; ≥1 to start the day |
| `exerciseId` | Must refer to an existing catalog exercise; immutable per entry on edit (remove/create entry to swap) |
| `position` | Integer ≥0 and unique within day; normalize to contiguous `0..n-1` or reject gaps (v1 chooses reject gaps) |
| `targetSets` | Integer 1–12 |
| `targetReps` | Required integer 1–100 for `reps_weight`/`reps_only`; absent/null for `duration` |
| `targetDurationSec` | Required integer 1–7200 for `duration`; absent/null for rep types |
| `targetWeightKg` | Optional finite 0–500 only for `reps_weight`; absent/null for other types |

Plan validation, duplicate IDs and forbidden updates return `422 VALIDATION_ERROR` (malformed JSON returns 400). Do not allow `userId`, `archivedAt`, `createdAt`, or other server-owned fields in writes.

---

## 8. Workout sessions and performed sets

### 8.1 State machine and immutability

```text
POST /sessions (owned plan day, at least one exercise)
                      |
                      v
                 in_progress
                 /         \
    POST /complete           POST /abandon
           |                       |
           v                       v
       completed                abandoned
       (read-only)            (read-only)
```

**Rules:** exactly one `in_progress` session per account (enforced atomically in database); all performed entries and prescriptions are snapshotted at start. A completed session must have ≥1 valid completed set; no API changes a completed or abandoned session. Abandoning is explicit and does not increase completed workout statistics. Plan edits, catalog edits and archiving never mutate any session snapshot. Repeated **completion or abandonment** on an already matching terminal state is a no-op success, without overwriting timestamps; attempting the opposite terminal transition returns `409 INVALID_SESSION_STATE`.

### 8.2 `POST /sessions` — 201 (start)

**Required header:** `Idempotency-Key: <UUID>`.

```json
{
  "planId": "66aabbccddeeff0011223501",
  "dayId": "66aabbccddeeff0011223511"
}
```

```json
{
  "data": {
    "id": "66aabbccddeeff0011223601",
    "status": "in_progress",
    "sourcePlanId": "66aabbccddeeff0011223501",
    "sourceDayId": "66aabbccddeeff0011223511",
    "planNameSnapshot": "4-Day Muscle Split",
    "dayLabelSnapshot": "Day 1 — Chest",
    "startedAt": "2026-11-15T13:45:00.000Z",
    "completedAt": null,
    "abandonedAt": null,
    "version": 1,
    "exercises": [
      {
        "id": "66aabbccddeeff0011223611",
        "exerciseId": "66aabbccddeeff0011223401",
        "nameSnapshot": "Incline Dumbbell Press",
        "trackingType": "reps_weight",
        "position": 0,
        "targetSets": 3,
        "targetReps": 10,
        "targetDurationSec": null,
        "targetWeightKg": 20,
        "sets": [
          { "id": "66aabbccddeeff0011223621", "position": 0, "reps": null, "weightKg": null, "durationSec": null, "completed": false },
          { "id": "66aabbccddeeff0011223622", "position": 1, "reps": null, "weightKg": null, "durationSec": null, "completed": false },
          { "id": "66aabbccddeeff0011223623", "position": 2, "reps": null, "weightKg": null, "durationSec": null, "completed": false }
        ]
      }
    ]
  }
}
```

Session snapshots include display names, targets, tracking types, order and an initially uncompleted set for each target set. For duration exercises, each set starts with `durationSec: null`. The server resolves source plan/day under `userId` and snapshots catalog information in the same logically consistent operation. Starting an archived plan is rejected `409 PLAN_ARCHIVED`. Attempting to start with an existing active session (even in another tab) returns `409 ACTIVE_SESSION_EXISTS` and a safe `details.activeSessionId` for the authenticated owner. Retry with same key/body returns original response. Use a **unique partial index** on `{ userId }` for `status: "in_progress"` in `ARCHITECTURE.md`, plus atomic operations. Do not rely only on preflight reads.

### 8.3 `GET /sessions/active` — 200

Returns `{ "data": <full in-progress session> }` if present; otherwise `{ "data": null }`. This route lets the UI resume after refresh, reconnect or logout/re-login. No `userId` input is accepted.

### 8.4 `GET /sessions/:sessionId` — 200

Returns `{ "data": <full session snapshot> }` for the owner regardless of state, including `completedAt` / `abandonedAt` and computed `durationMinutes` when available. The UI for `completed` or `abandoned` is read-only. Non-owner/unknown yields 404.

### 8.5 `PATCH /sessions/:sessionId/sets/:setId` — 200

Each set has a globally unique ID **within the session**. Client saves the complete performed set state (not a partial patch), plus current **session** version. This makes field edits and retries unambiguous, even when multiple tabs are open.

**Resistance set example:**

```json
{ "version": 1, "reps": 12, "weightKg": 40, "durationSec": null, "completed": true }
```

**Bodyweight reps example:**

```json
{ "version": 2, "reps": 15, "weightKg": null, "durationSec": null, "completed": true }
```

**Timed set example:**

```json
{ "version": 3, "reps": null, "weightKg": null, "durationSec": 60, "completed": true }
```

**Success:**

```json
{
  "data": {
    "sessionId": "66aabbccddeeff0011223601",
    "version": 2,
    "set": { "id": "66aabbccddeeff0011223621", "position": 0, "reps": 12, "weightKg": 40, "durationSec": null, "completed": true },
    "savedAt": "2026-11-15T13:47:00.000Z"
  }
}
```

Validation by tracking type: `reps_weight` needs integer reps 1–100 and finite weight 0–500 when `completed=true`; `reps_only` needs reps 1–100; `duration` needs integer seconds 1–7200. Incomplete rep sets may have `reps: 0..100` or `null`; completed rep sets **cannot** be zero. Incomplete resistance weight is `null` or 0–500; duration value for an incomplete timed set may be `null` or 1–7200. Fields not applicable to a type must be `null`. `completed` must be boolean. Set IDs that do not belong to the specified session return 404. Non-`in_progress` session → `409 INVALID_SESSION_STATE`. Stale `version` → `409 VERSION_CONFLICT`, client refetch/reconcile before retry. Use atomic conditional update on owned session ID, `status`, `version` and nested set ID; increment `version` and update only the matching set. Do not acknowledge save until MongoDB write succeeds.

**Important retry nuance:** if the server committed a set update but the response was lost, retry with stale version receives `VERSION_CONFLICT`; React must refetch and compare actual persisted values before reapplying. For improved transparent retries, `Idempotency-Key` **may** also be supplied on set PATCH and stored; final design choice is tracked under TD-07. Do not present this optional behavior as guaranteed until implemented.

### 8.6 `POST /sessions/:sessionId/complete` — 200

```json
{ "version": 4 }
```

```json
{
  "data": {
    "id": "66aabbccddeeff0011223601",
    "status": "completed",
    "startedAt": "2026-11-15T13:45:00.000Z",
    "completedAt": "2026-11-15T14:30:00.000Z",
    "durationMinutes": 45,
    "version": 5
  }
}
```

Only complete if ≥1 valid completed set exists; otherwise `422 NO_COMPLETED_SETS`. Check `version` against the latest in-progress revision; use an atomic `in_progress` → `completed` transition, and calculate completion time/duration server-side. Exact duplicate completion with the same session, now already `completed`, returns `200` **with the original terminal summary** regardless of request `version`; no timestamp or count changes. This guards network retries and double-clicks. If abandoned: `409 INVALID_SESSION_STATE`. The server is the sole authority on completion.

### 8.7 `POST /sessions/:sessionId/abandon` — 200

```json
{ "version": 4 }
```

```json
{
  "data": {
    "id": "66aabbccddeeff0011223601",
    "status": "abandoned",
    "abandonedAt": "2026-11-15T14:00:00.000Z",
    "version": 5
  }
}
```

Only `in_progress` can transition. An empty session may be abandoned. Repeated abandon on already abandoned returns the original terminal response. If completed, return `409 INVALID_SESSION_STATE`. The active-session slot becomes available as soon as the atomic terminal transition succeeds.

### 8.8 `GET /sessions` — 200 (history)

```http
GET /api/v1/sessions?status=completed&page=1&limit=10&sort=completed_desc
```

```json
{
  "data": [
    {
      "id": "66aabbccddeeff0011223601",
      "status": "completed",
      "planNameSnapshot": "4-Day Muscle Split",
      "dayLabelSnapshot": "Day 1 — Chest",
      "startedAt": "2026-11-15T13:45:00.000Z",
      "completedAt": "2026-11-15T14:30:00.000Z",
      "durationMinutes": 45,
      "completedSetCount": 3
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1, "hasNextPage": false }
}
```

Defaults: `status=completed`, page 1, limit 10. Allowed `status=completed|abandoned|in_progress|all`; `sort=completed_desc|started_desc|started_asc`; `completed_desc` default for completed results. Pagination cap 50. Default history shows only completed sessions; active session is better surfaced through `/sessions/active`. `GET /sessions/:id` supplies exact read-only details, including performed actual sets.

---

## 9. Dashboard and progress

### 9.1 Proposed TD-03 and TD-09 metrics contract

**Proposed timezone policy:** client sends an IANA `tz` identifier (e.g. `Asia/Karachi`) as an optional query value; server validates against supported IANA names, defaults to `UTC` if omitted. Weekly intervals begin on **Monday at 00:00** in the selected timezone, converted to UTC for MongoDB querying. Treat these as pending ratification before M6. Never use the browser timezone implicitly for backend grouping or trust a free-form offset alone.

**Definitions:**

- `completedWorkouts`: number of distinct sessions with `status=completed` and `completedAt` inside interval.
- `completedSets`: count of sets marked `completed=true` in completed sessions; unfinished sessions excluded.
- `totalVolumeKg`: sum of `reps × weightKg` for completed sets with `trackingType=reps_weight`; excludes duration and reps-only sets and never treats null as positive. This is tracked load volume, not a clinical metric.
- `totalDurationMinutes`: sum of server-derived completed-session durations within interval; round only for display.
- `workoutsByWeek`: grouped counts by selected timezone Monday-start weeks.

### 9.2 `GET /dashboard/summary` — 200

```http
GET /api/v1/dashboard/summary?tz=Asia%2FKarachi
```

```json
{
  "data": {
    "timezone": "Asia/Karachi",
    "weekStart": "2026-11-09T19:00:00.000Z",
    "weekEndExclusive": "2026-11-16T19:00:00.000Z",
    "completedWorkoutsThisWeek": 3,
    "completedSetsThisWeek": 28,
    "totalDurationMinutesThisWeek": 143,
    "activeSessionId": null,
    "recentWorkouts": [
      { "id": "66aabbccddeeff0011223601", "dayLabelSnapshot": "Day 1 — Chest", "completedAt": "2026-11-15T14:30:00.000Z" }
    ]
  }
}
```

`weekEndExclusive` is exclusive. `recentWorkouts` capped at 5, newest first. Results based strictly on the authenticated user. Empty account returns zeros, empty array, null active session.

### 9.3 `GET /progress/summary` — 200

```http
GET /api/v1/progress/summary?weeks=8&tz=Asia%2FKarachi
```

```json
{
  "data": {
    "timezone": "Asia/Karachi",
    "weeks": 8,
    "totalCompletedWorkouts": 12,
    "totalCompletedSets": 105,
    "totalVolumeKg": 28400,
    "workoutsByWeek": [
      { "weekStartLocal": "2026-11-02", "completedWorkouts": 2 },
      { "weekStartLocal": "2026-11-09", "completedWorkouts": 3 }
    ]
  }
}
```

`weeks` must be integer 1–26 (default 8). The example abbreviates series; real responses must contain **exactly `weeks` entries**, ordered oldest→newest and including zero-count weeks. `total*` fields cover the requested window (not lifetime). Advanced per-exercise charts, estimated one-rep max, personal records and body-weight timeline are P1 unless separately approved.

---

## 10. Pagination, sorting, validation and error catalog

### 10.1 Query design

All list endpoints have explicit allowlisted fields. Default pagination is page-based, 1-indexed, with `limit` capped at 50. Invalid negative, fractional, unparseable or over-cap values return `400 INVALID_QUERY` rather than silently clamping. Count queries must include the **same owner/filter conditions** as data queries. For large future datasets, cursor pagination can be considered as a versioned extension; no P0 requirement for unlimited scrolling.

### 10.2 HTTP outcomes

| HTTP | `error.code` | Scenario | React behavior |
|---|---|---|---|
| 400 | `BAD_JSON` | Malformed body / missing JSON type | Explain malformed request |
| 400 | `INVALID_QUERY` | Invalid filter/pagination/timezone/ID syntax | Show filter error / safe fallback |
| 401 | `UNAUTHENTICATED` | Missing/expired/revoked session | Redirect to login and preserve safe intended route |
| 401 | `INVALID_CREDENTIALS` | Bad login | Generic sign-in error |
| 403 | `CSRF_INVALID` | Missing/invalid CSRF token or origin | Refresh token once if safe; never silent repeat of ambiguous writes |
| 403 | `FORBIDDEN` | Authenticated but not permitted to modify catalog | Explain forbidden action |
| 404 | `RESOURCE_NOT_FOUND` | Missing/other user's ID | Show not-found state without exposing owner |
| 409 | `EMAIL_ALREADY_REGISTERED` | Duplicate normalized email | Ask for alternate email/login |
| 409 | `ACTIVE_SESSION_EXISTS` | Starting second active workout | Link to existing session |
| 409 | `VERSION_CONFLICT` | Stale plan/session revision | Refetch; reconcile inputs |
| 409 | `INVALID_SESSION_STATE` | Write attempted on terminal session | Show read-only final state |
| 409 | `PLAN_ARCHIVED` | Trying to start archived plan | Choose active plan |
| 409 | `IDEMPOTENCY_KEY_REUSED` | Same key, different payload | Generate new key for new operation |
| 422 | `VALIDATION_ERROR` | Well-formed JSON with invalid fields | Inline field errors |
| 422 | `NO_COMPLETED_SETS` | Attempt to finish empty workout | Complete one valid set or abandon |
| 429 | `RATE_LIMITED` | Too many attempts | Honor `Retry-After`; don't spin retries |
| 500 | `INTERNAL_ERROR` | Unexpected backend error | Generic safe error + request ID |
| 503 | `SERVICE_UNAVAILABLE` | Transient dependency failure | Offer controlled retry |

**Distinction:** 400 is malformed syntax or invalid URL/query; 422 is syntactically valid JSON violating semantic field constraints. Expose only safe messages. DB duplicate-key errors are mapped to typed domain errors, not returned raw.

### 10.3 Standard field validation

- Reject unrecognized mutable keys; do not allow MongoDB operators (`$set`, dotted field paths) via user-provided JSON.
- Require finite JSON numbers (not strings, `NaN`, infinite) for reps, weights, height, duration, version and pagination.
- `Content-Type` must be supported; reject unsupported bodies with 415 as appropriate.
- Arrays have hard maximum lengths per SRS, string fields are trimmed and length limited.
- Escape/sanitize all displayed user text in React; do not inject returned HTML into the DOM.
- For IDs, enforce ObjectId shape before querying; foreign private records are indistinguishable from missing records at the API level.

---

## 11. Idempotency, concurrency and failure recovery

| Operation | Replay behavior | Durable enforcement |
|---|---|---|
| `POST /plans` | Same idempotency key/body → original plan response | User-scoped key record + unique key index, atomic create/record |
| `POST /sessions` | Same key/body → original session; competing start → `ACTIVE_SESSION_EXISTS` | Key record + unique partial active-session index |
| `PATCH /plans/:id` | Repeat stale version → `VERSION_CONFLICT` | Atomic version compare-and-swap |
| `PATCH /sessions/:id/sets/:setId` | Stale version → `VERSION_CONFLICT`; refetch values | Atomic version compare-and-swap + state guard |
| `POST /sessions/:id/complete` | Already completed → same original successful terminal result | Atomic state change `in_progress` → `completed` |
| `POST /sessions/:id/abandon` | Already abandoned → same original successful terminal result | Atomic state change `in_progress` → `abandoned` |
| `DELETE /plans/:id` | Repeated archive → 204 | Persistent `archivedAt` flag |

**Required implementation proof:** Concurrent requests from two tabs cannot create two active workouts. Completed sessions cannot return to `in_progress` and cannot be double-counted. Plan archives must not cascade into old session snapshots. For idempotency-record + resource creation, use a MongoDB transaction where deployment supports it (replica set) or a rigorously tested equivalent atomic reservation pattern; architecture must specify the real mechanism rather than relying on pseudocode.

**React UI behavior:** save indicator states `unsaved` → `saving` → `saved` only on 2xx confirmation; on timeout show `uncertain`/`retry`, not `saved`. When a response is lost, refetch `/sessions/:id` before overwriting values. Do not auto-finalize a workout from the UI. If offline during logging, user must be told unsaved changes may be lost; offline synchronization is not a P0 promise. Unload/refresh recovery applies to **server-acknowledged** set changes, not keystrokes never saved.

---

## 12. P1 extension endpoints (not required for MVP)

These are **reserved examples**, not approved P0 routes. Do not accidentally add them to P0 code, demo acceptance or current metrics.

| Method | Possible route | Notes |
|---|---|---|
| GET, POST | `/body-metrics` | Owned, dated weight observations; 20–350 kg, optional note ≤300 chars; pagination |
| POST | `/auth/change-password` | Verify current password; revoke/rotate other sessions |
| POST | `/auth/password-reset/request` | Neutral response; expiring single-use email token |
| POST | `/auth/password-reset/confirm` | Single-use token verification and rotation |
| POST, GET | `/custom-exercises` | Private user-created catalog items; ownership |
| GET | `/exercises/:id/alternatives` | Muscle/equipment-related swaps |
| POST | `/plans/from-template` | Curated starter workout templates |
| POST | `/sessions/:id/exercises` | Ad hoc in-session exercise insertion |

Goal-appropriate exercise discovery **already belongs to P0**, but AI recommendations, medical guidance and mandatory coaching personalization do not.

---

## 13. API acceptance tests (must be automatable)

Every case includes setup, request or sequence, expected HTTP status and invariant. Tests should run against an isolated test database, with fixtures and no dependence on production data. The IDs below are stable API acceptance test identifiers.

| Test ID | Feature | Action and expected result | Related SRS |
|---|---|---|---|
| API-001 | Register | Valid user → 201 + cookie + safe profile; no passwordHash | FR-AUTH-01 |
| API-002 | Normalize email | Duplicate email with casing/whitespace → 409 | FR-AUTH-01 |
| API-003 | Login | Correct creds → 200; wrong email/password → indistinguishable generic 401 | FR-AUTH-02 |
| API-004 | Logout | Logout 204; old cookie can no longer access profile (401) | FR-AUTH-03 |
| API-005 | Refresh | After login, GET session/profile with cookie remains authenticated | FR-AUTH-04 |
| API-006 | CSRF | Authenticated PATCH with missing/incorrect CSRF → 403; no mutation | NFR security |
| API-007 | Profile goals | Change goal; old plan/session snapshots unchanged | FR-PROF-02/06 |
| API-008 | Catalog seed | ≥32 distinct exercises; each of eight groups has ≥4 | FR-EXER-01/02 |
| API-009 | Catalog filters | Case-insensitive search + multiple filters, correct intersection and 200 zero-result | FR-EXER-03…06 |
| API-010 | Goal access | Goal changes ranking only; no exercise hidden when goal changes | FR-PROF-05; FR-EXER-09 |
| API-011 | Create plans | Two different POSTs create two distinct plans; both listed after refresh | FR-PLAN-01/02 |
| API-012 | Create replay | Same idempotency key+body returned twice → one plan record | FR-PLAN-10 |
| API-013 | Ownership | User B GET/PATCH/DELETE of User A plan/session → 404; A unchanged | FR-PLAN-09; NFR |
| API-014 | Plan validation | Reject 8 days, 21 exercises/day, invalid target reps, nonexistent exercise | FR-PLAN-03…05 |
| API-015 | Plan concurrency | Stale `version` PATCH → 409; no lost update | FR-PLAN-07/10 |
| API-016 | Start session | Valid owned plan day → 201, snapshot targets, no initial completed sets | FR-SESS-01/02 |
| API-017 | Single active | Concurrent starts/tabs yield at most one active session | FR-SESS-10; state invariant |
| API-018 | Save actual work | Save three different performed loads/reps; GET returns actual values | FR-SESS-03/07 |
| API-019 | Reps/bodyweight/timed | Rep 0 prohibited on completed reps set; 0 kg allowed resistance; 60 sec timed set valid | FR-SESS-04/05 |
| API-020 | Resume | Save set, refresh/re-auth, GET active returns saved snapshot/set | FR-SESS-10 |
| API-021 | No false save | Simulated DB failure → no success response; GET shows unchanged data | FR-SESS-12 |
| API-022 | Finish empty | No completed sets → 422; session remains active | FR-SESS-08 |
| API-023 | Finish replay | Complete twice → original timestamp/count, no duplicated history | FR-SESS-08 |
| API-024 | Terminal guards | PATCH completed/abandoned session → 409; history remains read-only | FR-SESS-08/11 |
| API-025 | Historical snapshot | Complete session; edit/archive plan; GET old session unchanged | FR-SESS-09; FR-PLAN-08 |
| API-026 | Abandon | Abandon active; not in completed history counts; new session can start | FR-SESS-11 |
| API-027 | History filter | Default only completed, pagination bounds, own records only | FR-HIST P0 |
| API-028 | Metrics | Only completed records count; timed work excluded from weight volume | FR-DASH/PROG P0 |
| API-029 | Boundary checks | Numeric strings, negative weights, invalid IDs, unknown fields rejected | SRS §7 |
| API-030 | Rate limiting | Excess auth attempts → 429 + `Retry-After`; no stack leak | SRS §9 |
| API-031 | Timezone boundary | Near-midnight sessions grouped correctly by requested IANA zone, Monday week | TD-03 proposed |
| API-032 | Dark UI integration | React only renders “Saved” after PATCH 200; failure keeps retry affordance | `DESIGN.md` §7.8/§14 |

### 13.1 Essential request sequence (end-to-end)

```text
1. GET  /api/v1/auth/csrf                   -> 200 (bootstrap)
2. POST /api/v1/auth/register              -> 201 (new session)
3. GET  /api/v1/auth/csrf                   -> 200 (post-login token)
4. PATCH /api/v1/profile                   -> 200 (muscle_gain)
5. GET  /api/v1/exercises?muscleGroup=chest -> 200 (multiple choices)
6. POST /api/v1/plans                     -> 201 (plan A; idempotency key)
7. POST /api/v1/plans                     -> 201 (plan B; different key)
8. POST /api/v1/sessions                  -> 201 (start plan A day)
9. PATCH /api/v1/sessions/:id/sets/:setId  -> 200 (actual reps/load)
10. GET /api/v1/sessions/active            -> 200 (resume after refresh)
11. POST /api/v1/sessions/:id/complete     -> 200 (terminal)
12. POST /api/v1/sessions/:id/complete     -> 200 (same result, no duplicate)
13. PATCH /api/v1/plans/:id                -> 200 (edit source plan)
14. GET /api/v1/sessions/:id               -> 200 (old snapshot unchanged)
15. GET /api/v1/dashboard/summary         -> 200 (counts exactly once)
```

Every authenticated mutation above includes session cookie and valid CSRF header, and plan/session creation includes a unique idempotency key; abbreviated lines are for sequence readability.

### 13.2 Test implementation guidance

- **Backend unit:** exercise filter mapping, schema validation, state machine, derived metrics, timezone boundary calculations.
- **API integration:** Express app + isolated MongoDB test DB/replica-set-compatible environment; session cookie/CSRF tests, idempotency record tests, ownership and concurrency.
- **Frontend integration:** React request states, conflict resolution, 401 redirect, save acknowledgement, empty and error states.
- **E2E:** user signs in, picks from several chest exercises, creates two plans, records actual work, refreshes session, completes, sees unchanged history.
- **CI gate:** all P0 contract tests passing; security checks and accessibility evidence from `DESIGN.md` and `PLANNING.md` M7; no actual test completion claimed in this document.

---

## 14. Implementation notes for `ARCHITECTURE.md`

The next document must translate this interface contract into concrete MongoDB/Mongoose schemas, indexes, Express routes/controllers/services, session store, transaction/concurrency strategy, security middleware and deployment boundaries. In particular, it must explain:

1. `users` schema with normalized unique email + password hash; secure session storage and expiry/revocation.
2. `exercises` curated indexes for group/difficulty/equipment/name and seeded ≥32 records.
3. `workoutPlans` owner index, nested stable day/exercise IDs, archivedAt, version concurrency.
4. `workoutSessions` owner index, **unique partial index for one active session per user**, embedded snapshots, set IDs and version.
5. Durable idempotency key storage unique by `(userId, method, route, key)` with payload hash and response snapshot; TTL clean-up; race handling.
6. Query ownership filters, rate limits, CSRF/CORS protections, validation and centralized safe error handling.
7. Stats queries restricted to `completed` sessions with explicit week boundaries/timezone.
8. Optional P1 `bodyMetrics` collection deferred until Phase 2.

Do **not** build a separate gym-management/admin interface. Do **not** replace Node/Express with another backend or MongoDB with SQL. Libraries for validation/testing are implementation choices pending technical review, not mandated replacements for the stack.

---

## 15. Decisions requiring approval / traceability

| Decision | Proposed v1 choice | Source / sign-off milestone |
|---|---|---|
| TD-01 Auth transport | Server-managed opaque cookie sessions, bounded pre-auth CSRF session, 7-day absolute expiry | `ADR-DECISIONS.md` TD-01; approved for M3 |
| TD-02 Idempotency | Idempotency key on create, unique partial active index, atomic terminal transitions | TD-02; before M5 (plan-create details before M4) |
| TD-03 Timezone | IANA `tz`, UTC storage, Monday week | TD-03; before M6 |
| TD-04 Tracking | `reps_weight`, `reps_only`, `duration`; kg/seconds | TD-04; before M3/M5 |
| TD-05 Deployment | HTTPS same-site deployment preferred; host TBD | TD-05; before M8 |
| TD-06 Validation | Envelope in §1.2 and error codes §10; library TBD | TD-06; before M2 |
| TD-07 Autosave | Explicit save acknowledgement per set, server persistence; debounce optional | TD-07; before M5 |
| TD-08 Media | HTTPS/trusted local path or null placeholder | TD-08; before M3 |
| TD-09 Metrics | Completed-only; volume formula and bounded history | TD-09; before M6 |
| TD-10 Testing | Matrix §13; tools/CI thresholds TBD | TD-10; before M1/M7 |

**Change discipline:** If an endpoint, status, payload, validation boundary or auth strategy changes, update `api.md` and `ADR-DECISIONS.md` decision history, then relevant `ARCHITECTURE.md` and UI/UX acceptance tests. Do not treat examples as evidence of deployed behavior.

## 16. Definition of Done (API)

An API module is complete only when its endpoints are implemented and integrated with Express/Mongoose, each request is validated and owner-scoped, documented examples match actual responses, success/error codes and headers are consistent, concurrency/retry behavior is demonstrated by automated tests, no secrets leak, and the corresponding P0 acceptance tests pass in CI or a repeatable local environment. The **entire API MVP** is complete only once the complete user journey in §13.1 succeeds and its snapshots, single-active-session invariant and history calculations remain correct under refresh/retry and cross-user tests.

---

## 17. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0.0 | 2026-11-15 | FitTrack project documentation | Initial full REST API contract proposal aligned to idea/SRS/planning/context/design; awaits technical decision sign-off |
