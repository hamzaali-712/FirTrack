# FitTrack — Software Requirements Specification (SRS) — Version 2.0

> **Document:** `requirements.md`  
> **Project:** FitTrack — Personal Workout Tracker  
> **Version:** 2.0 (reconciled planning specification)  
> **Date:** 18 November 2026  
> **Status:** Proposed v2 baseline for review; no implementation or acceptance-test evidence supplied  
> **Parent document:** [`idea.md`](./idea.md)  
> **Canonical companion documents:** `PLANNING.md`, `ADR-DECISIONS.md`, `DESIGN.md`, `API-CONTRACT.md`, `ARCHITECTURE.md`

---


## Version 2.0 — Approved user direction and new acceptance requirements

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


**Authority:** This is the definitive product-behavior contract for the revised FitTrack scope. Retained original detailed numerical, authorization and session requirements remain binding unless explicitly modified below. Technical approvals are tracked in `ADR-DECISIONS.md`. A feature is not implemented simply because it has a specification.

### Fixed delivery and product direction
- Team: **2 developers**. Schedule: **8 relative weeks** (calendar dates and actual developer hours TBD).
- Core MERN unchanged: MongoDB/Mongoose, Express/Node, React/Vite, Tailwind CSS and React Router. Supporting Three.js/React Three Fiber need policy approval if "only MERN" excludes third-party libraries.
- Ocean Breeze source palette `#16697A`, `#489FB5`, `#82C0CC`, `#EDE7E3`, `#FFA62B`; Manrope preferred. The previously suggested lime/green theme is **superseded** by `official-theme.md`.
- Public landing hero and final outro: **minimum full viewport height** with `100dvh`/`100svh`/`100vh` fallback; content expands rather than clips on mobile. Middle content has natural responsive height. Ending contains integrated footer.
- A **realistic rigged anatomical 3D character** is a required *viewer* capability, but content is constrained: one licensed/anatomically reviewed exercise clip P0; 6–10 clips and 80–120 catalog entries are P1 stretch. A functioning anatomical viewer cannot be claimed when only a static image exists.

### New product requirement IDs (P0)
| ID | Testable requirement | Acceptance evidence |
|---|---|---|
| FR-LAND-01 | Full-viewport responsive hero | At desktop height initial hero fills viewport; no content cropped on short mobile screens |
| FR-LAND-02 | Full-viewport responsive final CTA/outro | Closing section fills viewport where possible and includes accessible footer |
| FR-LAND-03 | Working CTAs/routes | Register/Login/Explore buttons navigate to real routes or section IDs |
| FR-LAND-04 | Distinct FitTrack identity | No copied reference-site assets, logo, email, fake testimonials or invented KPIs |
| FR-LAND-05 | Dynamic motion behavior | Reduced-motion users and no-WebGL browsers can still use landing |
| FR-3D-01 | Load a real licensed anatomical rigged human | Recorded asset URI, rights, rig/clip compatibility and WebGL proof |
| FR-3D-02 | Play at least one valid exercise clip | Named motion matches exercise; independent form review evidence is recorded |
| FR-3D-03 | User playback controls | Play/Pause/Replay and meaningful loading/error status available |
| FR-3D-04 | Optional media never blocks exercise reading | Text and poster fallback shown when clip unavailable or unsupported |
| FR-3D-05 | Respect reduced motion and keyboard access | No essential instruction depends solely on moving canvas |
| FR-3D-06 | Controlled media provenance | Unreviewed/unlicensed assets are not represented as verified |
| FR-ANALYTICS-01 | Transparent formula units and exclusions | Results reconcile with completed sessions; no time-to-kg conversions |

### New P1 requirements and guardrails
- P1: 80–120 curated exercise entries, 6–10 anatomy-reviewed clips, richer muscle mapping, camera control, optional advanced charts, bodyweight history and 1RM estimates. **These are not W8 release guarantees.**
- No clinical diagnosis, guaranteed fat loss, automatic pose scoring, personalized rehab advice or medically certified safety claims. Calculators include applicability/uncertainty and are not treatment guidance.
- The existing v1 `imageUrl` fallback requirement remains; animation is an additional optional field on exercise detail. Library entries without 3D continue to be useful and searchable.

### Cross-contract integration decisions
- The canonical API prefix is `/api/v1` from `API-CONTRACT.md`. The plan/session status enums, ID format, weight units, validation ranges and session invariants in the detailed requirements below stay unchanged.
- SRS acceptance tests now include full-height responsive landing, accessible 3D fallback, valid media license, real 3D clip, Ocean Breeze theme and transparent calculation tests.
- The source v1 planning references and any old lime colors or pre-implementation dates do not override these version 2.0 changes.

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification defines **what FitTrack must do**, how it must behave, its user-facing and system constraints, and the conditions that determine whether its first release is complete. It serves as the agreement for UI design, API design, MongoDB modeling, implementation and test coverage.

### 1.2 Product summary

FitTrack is a **personal workout-tracking web application**. A person can create an account, set a fitness goal, explore **multiple exercise choices** for each major muscle group, create a personal workout plan, record actual sets/repetitions/weights, review workout history and understand basic progress.

FitTrack is **not** a gym-membership, trainer-management or billing platform.

### 1.3 Scope and priority terminology

| Label | Definition | Release rule |
|---|---|---|
| **P0 / MVP** | Mandatory for first end-to-end release | All acceptance criteria must pass |
| **P1 / Phase 2** | Valuable enhancement, explicitly deferred | Must not block MVP release |
| **P2 / Future** | Exploratory capability | No commitment until re-scoped |
| **MUST** | Mandatory behavior within the stated priority | Verify with a test |
| **SHOULD** | Strong recommendation | Can be deferred with a recorded decision |
| **MAY** | Optional behavior | Not a release gate |

**Important:** A feature is not finished if it only works with hard-coded React data. User-created data MUST be stored through the Express API in MongoDB and remain available after re-login.

### 1.4 Intended audience

Project team, developers, reviewers, QA testers, and the university project evaluator. Terms such as *plan*, *session*, and *exercise* are defined below to avoid ambiguity.

### 1.5 Glossary

| Term | Meaning |
|---|---|
| **Exercise** | Reusable activity in the catalog, e.g. Incline Dumbbell Press |
| **Muscle group** | Category such as Chest, Back, Legs, Shoulders, Biceps, Triceps or Core |
| **Workout plan** | User-created repeatable schedule of workout days and prescribed exercises |
| **Plan day** | A scheduled training unit within a plan, e.g. Monday — Chest & Triceps |
| **Workout session** | A specific attempt at a workout, with actual performed exercises/sets |
| **Prescribed set** | Target repetitions and optionally target load in a plan |
| **Performed set** | Actual reps and load recorded during a session |
| **Bodyweight exercise** | A movement that may not require external load; `weightKg` can be zero |
| **Goal** | User preference that influences suggestions but does **not** restrict the catalog |
| **Archived/deleted plan** | Plan no longer available for new workouts; old completed sessions remain readable |

---

## 2. Business Objectives and Success Criteria

### 2.1 Objectives

1. Help an individual plan workouts around their goals and available equipment.
2. Offer **multiple meaningful exercise choices**, not a single forced exercise per muscle group.
3. Allow fast recording of actual performance during a workout.
4. Preserve accurate historical sessions even when a workout plan changes later.
5. Provide a readable, responsive, visually engaging fitness experience without compromising usability.

### 2.2 MVP success journey

A brand-new user MUST be able to:

`Register → Log in → Select Muscle gain → Browse Chest exercises → Filter options → Select exercises → Create Monday plan → Start session → Log completed sets/reps/weights → Finish → Reopen history → See persisted results.`

Test this journey on both a small mobile viewport and a desktop viewport; refresh and sign back in before inspecting history.

---

## 3. Fixed Technology and Project Constraints

### 3.1 Mandatory stack

| Layer | Required technology |
|---|---|
| Frontend | **React.js** with **Vite** |
| Styling | **Tailwind CSS** |
| Client navigation | **React Router** |
| Backend runtime | **Node.js** |
| Backend framework | **Express.js** |
| Database | **MongoDB** |
| Database ODM | **Mongoose** |
| API style | **REST over HTTPS, JSON** |

Supporting libraries such as a chart library, validation library or icon package can be chosen later if they do not replace this stack. **No Next.js replacement, Firebase/Supabase as the application database, or Python backend.**

### 3.2 Design constraints

- Responsive **mobile-first** web app; no native mobile app required.
- **Ocean Breeze dark-first visual theme**, using the approved five brand colors plus tested high-contrast semantic surfaces and Manrope typography. A production-quality light-mode toggle is **P1**; MVP may ship dark mode only if it remains accessible.
- Interactive exercise search/filters, selection states, set-entry UI, actionable feedback, loading/empty/error states are **P0**.
- Avoid paywalls, trainers, memberships, and social sharing in MVP.
- All user-specific reads and writes require authorization and ownership checks.

### 3.3 Assumptions

- Users have a modern browser and internet connection; offline sync is out of scope.
- Exercise records are seeded by the project (not user-submitted in MVP).
- Base unit for lifted load is kilograms; inches/pounds conversion is not an MVP requirement.
- All displayed exercise instructions are educational and not medical advice.
- Each account has one primary fitness goal at a time; changing it does not delete plans or sessions.

---

## 4. Actors, Permissions and Data Ownership

| Actor | Capability | Limit |
|---|---|---|
| Visitor | View public landing page, open registration/login | Cannot read personal workouts |
| Authenticated user | Manage own profile, plans, sessions; view exercise catalog and progress | Cannot access another user's data |
| System / seed script | Populate and maintain curated exercise catalog during deployment | Not a public admin portal |

**No trainer, gym-owner, staff or paid subscriber roles in the MVP.**

### 4.1 Permission rules (P0)

- **AUTH-01:** Unauthenticated requests to private endpoints MUST be rejected (normally HTTP 401).
- **AUTH-02:** Authenticated requests for resources owned by another user MUST not expose content (typically HTTP 404, or 403 when appropriate without leaking existence).
- **AUTH-03:** The API MUST derive `userId` from the authenticated identity, **never from a client-supplied user ID**.
- **AUTH-04:** The public exercise catalog may be read by signed-in users; catalog modification MUST not be available through ordinary user routes.
- **AUTH-05:** Deleting or modifying a plan MUST NOT modify an already completed workout session.

---

## 5. Functional Requirements

Every requirement below is independently testable. A bracketed priority is part of the requirement ID and release status.

### 5.1 Authentication and Account (AUTH)

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-AUTH-01 | P0 | Register with name, email and password | Valid data creates a new account; duplicate normalized email is rejected; no password hash is returned |
| FR-AUTH-02 | P0 | Log in using email and password | Correct credentials establish an authenticated session; invalid credentials return a generic error |
| FR-AUTH-03 | P0 | Log out | Session is invalidated/cleared; subsequent protected requests fail unless reauthenticated |
| FR-AUTH-04 | P0 | Persist authentication across page refresh | Refreshing a protected page retains login while the session remains valid |
| FR-AUTH-05 | P0 | Block unauthorized protected routes | Unauthenticated visitors are redirected to login in UI and rejected by API |
| FR-AUTH-06 | P0 | Let users view basic account information | Current user endpoint returns name, email, profile settings; no password hash |
| FR-AUTH-07 | P1 | Change password | Requires current password or verified recovery method; new password rules apply |
| FR-AUTH-08 | P1 | Password reset via verified email | Reset tokens expire, are single-use, and do not reveal account existence |

**Business rules:** Emails are trimmed and compared case-insensitively. Passwords are stored only as strong one-way hashes. Credentials are never placed in URLs or browser logs. Login and registration feedback must not reveal whether a random address is registered beyond the unavoidable duplicate-registration behavior.

### 5.2 Fitness Profile and Goals (PROF)

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-PROF-01 | P0 | View and edit profile | User can save name, primary goal, experience level and optional physical fields |
| FR-PROF-02 | P0 | Choose primary goal | At least: Muscle gain/bodybuilding, Strength, Fat loss/general fitness, Endurance, General fitness |
| FR-PROF-03 | P0 | Choose experience level | Beginner / Intermediate / Advanced; saved across sessions |
| FR-PROF-04 | P0 | Support optional equipment preferences | User can choose Bodyweight, Dumbbells, Barbell, Machine, Cable, Other; empty selection means no preference |
| FR-PROF-05 | P0 | Keep all exercises accessible regardless of goal | Goal influences sort/highlighting or suggested filters, not catalog permissions |
| FR-PROF-06 | P0 | Allow editing goal without changing historic data | Old sessions and plans remain intact after a goal change |
| FR-PROF-07 | P1 | Save historical body-weight measurements | New entries have valid date and kilogram value; user can see their own trend |

**Decision:** Equipment preferences are editable during onboarding **and** later in Profile; onboarding can be skipped and completed afterward. The chosen goal is a preference, not a personalized medical prescription.

### 5.3 Exercise Catalog and Discovery (EXER)

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-EXER-01 | P0 | Display a curated catalog of exercises | Seeded data comes from MongoDB API, not a hard-coded frontend-only list |
| FR-EXER-02 | P0 | Include multiple options for major muscle groups | At least **4 choices each** for Chest, Back, Shoulders, Biceps, Triceps, Legs/Glutes, Core and Cardio (minimum **32** unique exercises overall) |
| FR-EXER-03 | P0 | Search by name | Case-insensitive partial-match query returns relevant exercises and handles no results |
| FR-EXER-04 | P0 | Filter by muscle group | Selecting Chest displays relevant chest exercises; clearing restores results |
| FR-EXER-05 | P0 | Filter by equipment | User can choose e.g. dumbbells or bodyweight; supported filters combine predictably |
| FR-EXER-06 | P0 | Filter by difficulty | Beginner / Intermediate / Advanced filter works with search and muscle filters |
| FR-EXER-07 | P0 | View exercise details | Show name, primary muscles, equipment, difficulty, instructions and optional image |
| FR-EXER-08 | P0 | Add selected exercise to user's plan | Exercise selection adds its ID and editable prescription to a plan; saves after API submission |
| FR-EXER-09 | P0 | Reflect goal and available equipment | Show relevant recommendations or preselected filters, while allowing all items to remain browsable |
| FR-EXER-10 | P0 | Handle absent image safely | Display clean icon/placeholder; page stays usable |
| FR-EXER-11 | P1 | Suggest swaps/alternative movements | Alternatives use relevant muscle/equipment tags and remain user-selectable |
| FR-EXER-12 | P1 | Enhanced exercise instructions/media | Optional additional illustrations or video links with licensed media |
| FR-EXER-13 | P1 | Allow user-created custom exercises | Owner can create a custom exercise, visible only to that user unless explicitly published in a future release |

**Exercise starter examples:**

| Group | Options (starter seed candidates) |
|---|---|
| Chest | Barbell Bench Press; Incline Dumbbell Press; Chest Press Machine; Cable Crossover; Push-Up; Dumbbell Fly |
| Back | Lat Pulldown; Pull-Up; Seated Cable Row; One-Arm Dumbbell Row; Bent-Over Row |
| Shoulders | Overhead Press; Dumbbell Shoulder Press; Lateral Raise; Rear-Delt Fly; Face Pull |
| Biceps | Barbell Curl; Dumbbell Curl; Hammer Curl; Preacher Curl; Cable Curl |
| Triceps | Cable Pushdown; Overhead Triceps Extension; Skull Crusher; Close-Grip Push-Up; Bench Dip |
| Legs/Glutes | Squat; Leg Press; Romanian Deadlift; Walking Lunge; Leg Extension; Leg Curl; Calf Raise; Hip Thrust |
| Core | Plank; Crunch; Dead Bug; Hanging Knee Raise; Bicycle Crunch; Cable Crunch |
| Cardio | Brisk Walking; Running; Cycling; Rowing Machine; Jump Rope; Burpees |

The catalog MUST support exercises where reps/load are not the only measures (e.g. Plank measured by duration, Running measured by duration/distance). For the MVP, strength-style performed sets and basic duration-based exercise logging must remain coherent; distance/pace analytics are P1. Running and other cardio exercises are measured by duration in P0 unless a separately approved tracking type is introduced.

### 5.4 Workout Plans (PLAN)

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-PLAN-01 | P0 | Create a named workout plan | Authenticated user can create plan with a non-empty title |
| FR-PLAN-02 | P0 | Create multiple plans | New plan does not overwrite any other plan; all appear in user's list |
| FR-PLAN-03 | P0 | Define training days | Plan may contain multiple named days; each has one or more exercises when used for a session |
| FR-PLAN-04 | P0 | Add exercise to a plan day | Exercise ID and ordered position are stored; user can choose from all filtered options |
| FR-PLAN-05 | P0 | Set exercise targets | Set count and target reps or duration are editable; optional target weight is nonnegative |
| FR-PLAN-06 | P0 | Reorder or remove a plan-day exercise | Changes persist and display in correct order |
| FR-PLAN-07 | P0 | Edit plan name, days and prescription | Saved changes appear after refresh/re-login |
| FR-PLAN-08 | P0 | Delete/archive a plan with confirmation | Plan disappears from active plans; previously completed sessions remain accessible |
| FR-PLAN-09 | P0 | Show only current user's plans | User A cannot list, modify or delete user B's plan |
| FR-PLAN-10 | P0 | Prevent duplicate/conflicting plan operations | Repeated clicks cannot produce unintentional duplicate submissions |
| FR-PLAN-11 | P1 | Start from curated sample plans | Optional starter templates for beginner/full-body/bodybuilding splits |

**MVP scheduling decision:** A plan contains named workout days (e.g. Monday), but **does not automatically book calendar events or send reminders**. Users can start any plan day on any real date.

### 5.5 Workout Session Recording (SESS)

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-SESS-01 | P0 | Start a workout from a plan day | Backend creates an owned session snapshot with `in_progress` status |
| FR-SESS-02 | P0 | Show prescribed exercises and targets | Active session displays exercises in saved plan order |
| FR-SESS-03 | P0 | Log actual reps and weight for strength exercises | User can save valid numerical reps/load for each performed set |
| FR-SESS-04 | P0 | Support bodyweight/no-load exercises | Weight may be `0`; users are not forced to enter positive load |
| FR-SESS-05 | P0 | Log duration for timed exercises | Timed sets allow valid seconds, with reps/load not required where inapplicable |
| FR-SESS-06 | P0 | Mark sets complete/incomplete | Completed state persists after API success and is distinguishable in UI |
| FR-SESS-07 | P0 | Edit performed set values before finish | User can correct accidental input; backend persists latest valid values |
| FR-SESS-08 | P0 | Finish a session | Server marks `completed`, records completion timestamp, and prevents accidental double-finalization |
| FR-SESS-09 | P0 | Preserve historical snapshot | Editing/deleting source plan or exercise catalog entry does not change completed session results |
| FR-SESS-10 | P0 | Resume in-progress session after refresh/re-login | Draft session is stored in MongoDB and can be reopened on the same account |
| FR-SESS-11 | P0 | Allow explicit abandonment | User can discard an in-progress session with confirmation; it does not count as completed |
| FR-SESS-12 | P0 | Handle network/save failures | User sees failed-save feedback and cannot be told data is saved when server did not confirm it |
| FR-SESS-13 | P1 | Allow exercises to be added mid-session | Add an exercise not originally in the plan without modifying the plan itself |
| FR-SESS-14 | P1 | Rest timer and workout pause | Optional timing controls remain consistent with persisted session |

**Decision:** Persist **in-progress sessions** in the MVP, including after browser refresh. Completion is idempotent: repeated completion requests do not create multiple completed sessions. Initial MVP supports **one active session per user at a time** to prevent ambiguous state across tabs; starting another prompts user to resume or abandon the existing active one.

### 5.6 History, Dashboard and Basic Progress (HIST / DASH / PROG)

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-HIST-01 | P0 | List user's completed sessions | Shows completion date, plan/day label and summary; newest first |
| FR-HIST-02 | P0 | View completed session details | Shows actual exercises, sets, reps, weights and/or duration from saved snapshot |
| FR-HIST-03 | P0 | Keep deleted-plan sessions visible | Completed records can be viewed even when source plan is archived |
| FR-HIST-04 | P0 | Paginate workout history | Supports page/limit (or cursor) with bounded page size; empty list has informative UI |
| FR-DASH-01 | P0 | Show personal dashboard | Displays welcome/profile goal, active plans, recent workouts, completed-session count |
| FR-DASH-02 | P0 | Provide relevant primary actions | User can navigate to exercise discovery, plan creation and active-session resume |
| FR-DASH-03 | P0 | Show genuine persisted data | Dashboard counters match database records after refresh/re-login |
| FR-PROG-01 | P0 | Show basic weekly consistency | Count completed workouts by week using user's configured/local display date boundary |
| FR-PROG-02 | P0 | Show exercise performance history | User can compare past recorded reps/load for a selected exercise, without invented data |
| FR-PROG-03 | P0 | Show appropriate empty states | New accounts see guidance, not fake statistics |
| FR-PROG-04 | P1 | Advanced trend charts and personal records | Accurate historical computations with accessible tabular alternatives |
| FR-PROG-05 | P1 | Bodyweight trends | Reads from optional body-metric history and displays a date-ordered chart |
| FR-PROG-06 | P1 | More advanced progress summaries | Training volume, streak logic and comparisons documented before launch |

**Statistics boundary:** In MVP, “workout count” means **completed sessions only**. A planned but not completed workout cannot count toward consistency. Volume estimates should not mix timed/cardio activities with kilogram-based resistance work.

### 5.7 Interactive Interface and Navigation (UI)

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-UI-01 | P0 | Provide responsive public and private pages | Landing, login, register, dashboard, exercises, plans, session, history and profile work on mobile/desktop |
| FR-UI-02 | P0 | Provide working, stateful search and filter controls | Filter chips, selection cards, reset controls and result count update based on actual data |
| FR-UI-03 | P0 | Provide form state feedback | Required fields, errors, saving state and successful confirmation are clear |
| FR-UI-04 | P0 | Provide loading/empty/error states | No blank screen on slow API, zero results or failed request |
| FR-UI-05 | P0 | Make workout set entry touch-friendly | Inputs and completion controls work on narrow screens without horizontal overflow |
| FR-UI-06 | P0 | Confirm destructive actions | Delete plan and abandon active session require deliberate confirmation |
| FR-UI-07 | P0 | Keep private navigation protected | Deep links to protected screens require authentication and fail securely |
| FR-UI-08 | P0 | Support reduced motion | Essential interaction still works when device requests reduced animations |
| FR-UI-09 | P1 | Theme toggle | Light/dark preference persists and maintains sufficient contrast in both modes |
| FR-UI-10 | P1 | Rich micro-interactions | Tasteful transitions, progress indicators and optional contextual feedback without hiding core functionality |

Detailed design tokens, screens, components and animation specifications belong in `DESIGN.md`, not this SRS.

---

## 6. User Stories and Acceptance Scenarios

| Story ID | Persona | User story | Mapped requirements |
|---|---|---|---|
| US-01 | New user | As a visitor, I want an account so my workouts are private and saved. | FR-AUTH-01..06 |
| US-02 | Bodybuilder | As a muscle-gain user, I want several chest exercise options so I can choose movements I enjoy. | FR-PROF-02, FR-EXER-01..09 |
| US-03 | Home trainee | As a dumbbell-only user, I want to filter exercises by equipment so my plan is realistic. | FR-PROF-04, FR-EXER-05 |
| US-04 | Beginner | As a beginner, I want difficulty and instructions so I can choose suitable exercises. | FR-EXER-06..07 |
| US-05 | Planner | As a user, I want multiple workout plans so one routine does not replace another. | FR-PLAN-01..09 |
| US-06 | Active trainee | As a user, I want to save actual set performance so I can track what I did, not just what I intended. | FR-SESS-01..08 |
| US-07 | Returning trainee | As a user, I want to resume an interrupted workout so a refresh doesn't lose my entries. | FR-SESS-10..12 |
| US-08 | Progress-minded user | As a user, I want accurate workout history and weekly summaries so I can observe consistency. | FR-HIST-01..04, FR-PROG-01..03 |
| US-09 | Privacy-conscious user | As a user, I want no one else to read or change my plans and logs. | AUTH-01..05, NFR-SEC-01..08 |
| US-10 | Mobile user | As a user at the gym, I want fast touch-friendly controls so I can log sets between exercises. | FR-UI-01..08 |

### Scenario S-01 — Bodybuilding exercise discovery and selection (P0)

**Given** a signed-in user selected **Muscle gain** and opens the exercise catalog,  
**When** the user selects **Chest** and optionally **Dumbbells**,  
**Then** the app shows relevant matching exercises from MongoDB, with each option's equipment and difficulty,  
**And** the user can open details, choose **Incline Dumbbell Press**, and add it to a workout plan,  
**And** the user can remove the filter and still access other exercises (the goal never blocks catalog access).

### Scenario S-02 — Create two independent plans (P0)

**Given** a signed-in user already has a “4-Day Split” plan,  
**When** they create “Home Workout” with different days and exercises,  
**Then** both plans appear independently, have distinct IDs, and can be edited/deleted separately,  
**And** a refresh shows both plans in the same state.

### Scenario S-03 — Save actual results, not prescribed values (P0)

**Given** a plan prescribes Bench Press for three sets of 10 reps,  
**When** a user logs **12 × 40 kg, 10 × 45 kg, 8 × 50 kg**, marks those sets completed and finishes,  
**Then** the history displays the actual three sets, not three copies of the prescribed 10 reps,  
**And** dashboard/progress counts include one completed session.

### Scenario S-04 — Edit/delete a plan after completion (P0)

**Given** a user has one completed session from “Chest Monday,”  
**When** they replace Bench Press with Push-Ups in the plan or archive the plan,  
**Then** the old session continues to display the original exercises and recorded results.

### Scenario S-05 — Refresh during workout (P0)

**Given** a user has an active session with two saved sets,  
**When** the tab is refreshed or the user logs out and returns,  
**Then** the user can resume the same active session and see the two server-confirmed sets,  
**And** unfinished local changes that failed to save are not falsely shown as persisted.

### Scenario S-06 — Unauthorized access (P0)

**Given** User A owns a plan with known identifier,  
**When** User B tries to fetch, edit or delete that identifier through the API,  
**Then** no plan content is returned, and no mutation occurs.

### Scenario S-07 — Empty catalog results and weak connectivity (P0)

**Given** a filter combination has zero matching exercises,  
**When** the user applies those filters,  
**Then** the app shows a helpful zero-results explanation and a working clear-filters action.  
**When** a save request fails, the user sees a retryable error and no false success confirmation.

### Scenario S-08 — Mobile interaction (P0)

**Given** a 360px-wide mobile viewport,  
**When** the user browses, creates a plan and logs sets,  
**Then** essential inputs/actions stay visible and usable without horizontal page scrolling.

---

## 7. Data Requirements and Field Validation

**Authoritative validation occurs on the Express API.** React mirrors validation for fast feedback but cannot replace server-side checks. `API-CONTRACT.md` defines exact request/response JSON schemas; `ARCHITECTURE.md` defines Mongoose schemas and indexes.

### 7.1 Account/Profile

| Field | Required | Validation / behavior |
|---|---|---|
| `name` | Registration | Trimmed; 2–80 characters |
| `email` | Registration | Trimmed, lowercased for comparison; syntactically valid; unique normalized value; maximum 254 chars |
| `password` | Registration | Minimum 8 and maximum 128 characters; use secure hashing; never return password/hash |
| `primaryGoal` | P0 profile | Enum: `muscle_gain`, `strength`, `fat_loss`, `endurance`, `general_fitness` |
| `experienceLevel` | P0 profile | Enum: `beginner`, `intermediate`, `advanced` |
| `equipmentPreferences[]` | Optional | Recognized equipment enum values; deduplicate |
| `heightCm` | Optional | Finite number between 80 and 250 inclusive |
| `currentWeightKg` | Optional | Finite number between 20 and 350 inclusive; current value is a profile snapshot (historical entries P1) |
| `age` | Optional | Integer 16–100 if provided; app is intended for adult/general audiences, not specialized pediatric coaching |

For a new account, set sensible default `primaryGoal = general_fitness` and `experienceLevel = beginner`; both are editable and clearly labeled. Do not force the optional physical information to create an account.

### 7.2 Exercise

| Field | Required | Validation / behavior |
|---|---|---|
| `name` | Yes | 2–100 chars; unique in curated catalog using normalized form when appropriate |
| `primaryMuscleGroup` | Yes | Chest, Back, Shoulders, Biceps, Triceps, Legs/Glutes, Core, Cardio |
| `secondaryMuscleGroups[]` | No | Known group values |
| `equipment[]` | Yes | One or more recognized equipment values (bodyweight allowed) |
| `difficulty` | Yes | `beginner`, `intermediate`, `advanced` |
| `trackingType` | Yes | `reps_weight`, `reps_only`, or `duration` in MVP |
| `instructions[]` | Yes | At least one short readable instruction, HTML sanitized/escaped |
| `goalTags[]` | Optional | Known goal enums; advisory only |
| `imageUrl` | Optional | Safe HTTPS or trusted local asset reference; fallback if missing |

Catalog records are curated and seeded via project scripts. Ordinary users cannot create or change global exercise records in MVP.

### 7.3 Workout plan and day

| Field | Required | Validation / behavior |
|---|---|---|
| `name` | Yes | Trimmed, 2–80 chars |
| `description` | Optional | Up to 500 chars |
| `days[]` | At least one | Each day has stable ID, label and ordered exercise entries |
| `day.label` | Yes | 1–50 chars; examples `Monday` or `Day 1 — Chest` |
| `day.weekday` | Optional | `0..6` Sunday–Saturday; multiple named days may share weekday if needed |
| `exerciseId` | Yes | Existing catalog ID; must be valid and readable |
| `targetSets` | Yes | Integer 1–12 |
| `targetReps` | Conditional | Integer 1–100 for rep-based tracking |
| `targetDurationSec` | Conditional | Integer 1–7200 for duration-based tracking |
| `targetWeightKg` | Optional | Finite 0–500 kg for resistance exercises |
| `position` | Yes | Nonnegative ordered position; prevent ambiguous ordering |

**Limits:** At most **7 plan days** and **20 exercises per plan day** in MVP, to keep UI and payloads bounded. At least one exercise is required **to start** a plan-day session; empty draft plan days may be edited but not started.

### 7.4 Workout session

| Field | Required | Validation / behavior |
|---|---|---|
| `userId` | Yes (server) | Derived from session identity; never trusted from payload |
| `sourcePlanId`, `sourceDayId` | Yes for plan-based start | Validate that both belong to current user |
| `status` | Yes | `in_progress`, `completed`, `abandoned`; only allowed state changes |
| `startedAt` | Yes (server) | UTC timestamp |
| `completedAt` | At completion | UTC timestamp, not earlier than start |
| `exercises[]` | Yes | Snapshot of name/tracking type and order plus completed set values |
| `sets[].reps` | Conditional | Integer 0–100 (0 permitted for incomplete/failed attempt; completed rep-based set needs ≥1) |
| `sets[].weightKg` | Conditional | Finite 0–500 (zero allowed for bodyweight) |
| `sets[].durationSec` | Conditional | Integer 1–7200 for completed timed sets |
| `sets[].completed` | Yes | Boolean; incomplete entries do not count as completed work |
| `durationMinutes` | Derived | Compute from timestamps or validated measured duration, not an arbitrary client-supplied summary |

**Completion validation:** A completed session MUST contain **at least one valid completed set**. Users can abandon an empty or unfinished session. For completed sessions, workout history is read-only in MVP; an explicit correction/edit-history workflow is P1.

### 7.5 Body measurements (P1)

| Field | Required | Validation |
|---|---|---|
| `recordedAt` | Yes | Valid date, not unreasonably future-dated |
| `weightKg` | Yes | Finite 20–350 |
| `note` | Optional | 0–300 characters |

### 7.6 General data integrity

- Record IDs are MongoDB ObjectIds (or API-safe representations), never user-selectable ownership keys.
- Store timestamps in UTC; format the date and week boundaries consistently for the user's display locale/timezone.
- Numeric fields reject `NaN`, infinite values, negative weights and numeric strings where the API contract requires numbers.
- Trim text, enforce maximum lengths, and reject unexpected values in critical enum fields.
- Strip/escape unsafe HTML in user-controlled text; never render exercise text as raw trusted HTML.
- Archive plans rather than cascade-delete historical sessions; preserve completed session snapshots.
- No unbounded user-defined arrays or unpaginated history responses.

---

## 8. State Machines and Key Business Rules

### 8.1 Session status lifecycle

```text
            Start plan day
                   |
                   v
             IN_PROGRESS
              /       \
   Complete valid     Abandon
       workout           |
        |                v
        v             ABANDONED
    COMPLETED
```

| From | To | Allowed? | Rule |
|---|---|---|---|
| New | `in_progress` | Yes | Authenticated owner; valid plan/day; no conflicting active session |
| `in_progress` | `in_progress` | Yes | Save/update set rows |
| `in_progress` | `completed` | Yes | At least one valid completed set; timestamp assigned once |
| `in_progress` | `abandoned` | Yes | Explicit confirmation |
| `completed` | `in_progress` | No | Historical data immutable in MVP |
| `abandoned` | `completed` | No | Must start a new session |

### 8.2 Core business invariants

1. One user may own **many** plans, but each plan has exactly one owner.
2. A session belongs to one user and optionally references a source plan/day; reference loss cannot erase its historical snapshot.
3. A change to profile goal influences **suggestions only**; it never rewrites plan exercises.
4. Each supported muscle group has at least four seeded exercises at release.
5. A session counts in weekly totals **only** after successful completion.
6. User B cannot read, edit, delete, or start workouts from User A's plan/session.
7. Server-derived totals/statistics are based on confirmed persisted data, not UI assumptions.
8. Write attempts to completed/abandoned sessions are rejected or safely treated as idempotent no-ops where explicitly defined.
9. Starting the same plan day twice via rapid double-click must not create two simultaneous active sessions.
10. Physical-performance trends are descriptive, not medical diagnoses or guaranteed fitness outcomes.

---

## 9. Non-Functional Requirements (NFR)

### 9.1 Security and privacy

| ID | Priority | Requirement | How it is verified |
|---|---|---|---|
| NFR-SEC-01 | P0 | Passwords stored using adaptive secure hash (e.g. bcrypt/Argon2) | Inspect user document; plaintext never stored |
| NFR-SEC-02 | P0 | Protected API requires authenticated session | Unauthenticated request tests |
| NFR-SEC-03 | P0 | Enforce ownership server-side on every user resource | Cross-user authorization tests |
| NFR-SEC-04 | P0 | Serve production API over HTTPS and protect secrets in environment variables | Deployment and repository inspection |
| NFR-SEC-05 | P0 | Use secure, HttpOnly, SameSite cookies if cookie-based authentication is selected; implement CSRF defenses where required | Browser/security configuration review |
| NFR-SEC-06 | P0 | Rate-limit authentication routes and validate API payloads | Burst requests and malformed-input tests |
| NFR-SEC-07 | P0 | Do not expose password hashes, secrets, stack traces or private user details in public responses | API error/response tests |
| NFR-SEC-08 | P0 | Apply CORS allowlist and security headers; use safe input escaping | Configuration/security tests |
| NFR-SEC-09 | P1 | Self-service account deletion/export | Export/deletion workflows verified after design approval |

Security implementation specifics (session-cookie vs token refresh mechanics) must be decided in `ARCHITECTURE.md` and expressed precisely in `API-CONTRACT.md` before implementation. Avoid storing long-lived JWTs in localStorage.

### 9.2 Performance and reliability

| ID | Priority | Requirement | Verification target |
|---|---|---|---|
| NFR-PERF-01 | P0 | Responsive interactions after page load | Client-side filter interactions respond in ≤200 ms on reference desktop under normal load |
| NFR-PERF-02 | P0 | Reasonable API responsiveness | 95th percentile of common reads ≤500 ms in a controlled local/staging test with seeded data and modest concurrency; report measured conditions |
| NFR-PERF-03 | P0 | Bound catalog/history queries | Paginated or limited responses; no unbounded full-history fetch |
| NFR-PERF-04 | P0 | Display clear asynchronous state | Loading, retryable error and success states for API-backed actions |
| NFR-REL-01 | P0 | Persist successful workout saves durably | Refresh/re-login verification after server confirms save |
| NFR-REL-02 | P0 | Prevent duplicate submission/finalization | Rapid-click/retry tests produce one intended record/state transition |
| NFR-REL-03 | P0 | Fail gracefully on backend/database errors | User receives non-sensitive error feedback; no fabricated success |
| NFR-REL-04 | P1 | Automated backup and restore drill | Demonstrated restoration in deployment environment |

Performance goals are **test targets**, not claims of already measured results; adjust measurement environment in `PLANNING.md` before performance sign-off.

### 9.3 Usability, accessibility and visual quality

| ID | Priority | Requirement | Verification target |
|---|---|---|---|
| NFR-UX-01 | P0 | Mobile-first responsive layout | No horizontal page overflow at 360px, 768px, 1280px reference widths |
| NFR-UX-02 | P0 | Keyboard-accessible forms, dialogs and navigation | Tab/Shift+Tab/Enter/Escape manual checks |
| NFR-UX-03 | P0 | Legible contrast and visible focus styles | WCAG 2.2 AA contrast targets for normal text and controls where applicable |
| NFR-UX-04 | P0 | Clear validation and recovery messages | User knows how to fix errors; no error conveyed by color alone |
| NFR-UX-05 | P0 | Respect reduced-motion preference | UI remains usable with `prefers-reduced-motion: reduce` |
| NFR-UX-06 | P0 | Touch-friendly workout input controls | Practical tap targets, no hidden critical control on mobile |
| NFR-UX-07 | P0 | Modern dark-first theme consistency | Shared spacing, colors, typography and interactive states across pages |
| NFR-UX-08 | P1 | Polished light mode | Preference persists, contrast validated in both schemes |

### 9.4 Maintainability, testability and compatibility

| ID | Priority | Requirement | Verification target |
|---|---|---|---|
| NFR-MAINT-01 | P0 | Separate React components/pages/services and Express routes/controllers/services/models | Source review |
| NFR-MAINT-02 | P0 | Centralize environment config, error handling and validation | No duplicated secret literals; consistent error format |
| NFR-MAINT-03 | P0 | Provide `.env.example` and reproducible setup README | Fresh clone can follow documented steps |
| NFR-TEST-01 | P0 | Automated tests for key API behaviors | Auth, ownership, plans, session transitions and persistence covered |
| NFR-TEST-02 | P0 | Test one full real database-backed user journey | Registration through saved history passes |
| NFR-COMP-01 | P0 | Support current stable desktop/mobile Chrome, Firefox, Safari and Edge | Smoke tests; document any browser exceptions |
| NFR-OBS-01 | P0 | Use safe structured server error logging | Failures can be diagnosed without logging passwords or sensitive payloads |

---

## 10. UI Page Inventory and Route-Level Requirements

| Page | Route | Access | P0 responsibilities |
|---|---|---|---|
| Landing | `/` | Public | Value proposition and working register/login CTA |
| Register | `/register` | Public | Validated registration form and error handling |
| Login | `/login` | Public | Validated login form; safe return to private app |
| Dashboard | `/dashboard` | Authenticated | Welcome, goal, summary, recent activity, primary actions |
| Exercise Library | `/exercises` | Authenticated | Search, multi-filter browse, selection and exercise detail entry |
| Exercise Details | `/exercises/:id` | Authenticated | Instructions, equipment, difficulty, add-to-plan action |
| Workout Plans | `/plans` | Authenticated | Plan list, create, edit, delete |
| Plan Detail/Builder | `/plans/:id` | Authenticated | Manage plan days and exercise prescription |
| Workout Session | `/workout/:sessionId` | Authenticated | Resume/log sets/complete/abandon active session |
| History | `/history` | Authenticated | Paginated completed sessions |
| Session Detail | `/history/:sessionId` | Authenticated | Read-only historical details |
| Progress | `/progress` | Authenticated | Basic frequency and exercise trends |
| Profile | `/profile` | Authenticated | Profile goals, level, equipment and optional details |
| Not Found | `*` | Either | Friendly unknown-page handling |

Exact client-side route names can be adjusted in `DESIGN.md` if changes are reflected in documentation and tests. **Note:** `/workout/:sessionId` routes to an actual persisted session; starting a session is a server action, not an implied plan ID in the URL.

---

## 11. External Interfaces and API-Level Expectations

### 11.1 Minimum API groups

- **Auth:** registration, login, logout, current authenticated identity.
- **Profile:** get/update current user profile.
- **Exercises:** browse/search/filter/paginate and get exercise detail.
- **Plans:** create/list/read/update/archive/delete own plans, including days and prescriptions.
- **Sessions:** start, get active session, edit sets, complete, abandon, list history, get read-only detail.
- **Progress:** dashboard/weekly counts and exercise performance samples.
- **P1 body metrics:** create/list measurements.

### 11.2 API conventions (P0)

- API base prefix: `/api/v1` as defined in `API-CONTRACT.md` (the earlier `/api` text is superseded).
- JSON requests/responses; proper HTTP methods/status codes.
- Use consistent error response shape with `code`, human-readable `message`, and optional `fieldErrors`.
- Apply request validation and ownership checks **before** modification.
- Pagination has a documented upper bound and stable sorting.
- Login failure: 401; validation: 400/422 per documented policy; unauthenticated: 401; missing/inaccessible resource: 404; conflict: 409; unexpected: 500 (safe message).
- Avoid recording duplicate session completions when the client retries after a network timeout.
- Frontend never connects directly to MongoDB; all persistence goes through Express.

### 11.3 Integrations

No payment processing, third-party gym feeds, wearable APIs, notification service or LLM integration is required. Exercise images may use local/static assets or approved licensed URLs with fallback behavior.

---

## 12. Error Handling and Edge Cases

| Case | Expected behavior | Priority |
|---|---|---|
| Duplicate registration email | Return understandable conflict/validation message; no new duplicate user | P0 |
| Invalid login | Generic failure, no user-data leak | P0 |
| Session expires while editing | Block protected save and request re-authentication; do not claim success | P0 |
| Zero matching exercises | Helpful empty state; clear filters action | P0 |
| Exercise image fails | Show placeholder; functionality unaffected | P0 |
| Plan contains no exercises | Allow draft editing but block start with explanation | P0 |
| Plan owner mismatch | Return non-disclosing error; no mutation | P0 |
| Double-click create/start/complete | UI suppresses duplicate; server ensures safe unique outcome | P0 |
| Browser refresh mid-workout | Resume from last confirmed server state | P0 |
| Lost connection during set save | Indicate unsaved state; allow retry; no false saved badge | P0 |
| Completed session's plan later deleted | Session details remain available | P0 |
| Attempt to complete zero valid sets | Validation error, remains `in_progress` | P0 |
| Two tabs try separate sessions | Enforce one active session/user; offer resume flow | P0 |
| Negative, NaN or huge load | Reject invalid value at API; show field-level message | P0 |
| Unknown exercise ID | Reject rather than add missing record | P0 |
| Unauthorized API ID enumeration | Do not leak another user's plan/session details | P0 |
| Extensive exercise catalog | Paginate/limit results; retain filter behavior | P0 |
| User changes timezone | UTC storage; display dates consistently; document week-count boundary | P0 |
| User wants to edit completed session | Read-only in MVP, optional controlled correction P1 | P1 |

---

## 13. MVP versus Phase 2 versus Out of Scope

### 13.1 P0 / MVP release gate

1. Fully working registration/login/logout and private data isolation.
2. Editable goal/profile; equipment preferences without forced setup.
3. Seeded catalog with ≥32 exercises, ≥4 per named major group.
4. Search, muscle, equipment and difficulty filtering plus usable exercise details.
5. Multiple personal plans; add/reorder/remove exercises; save prescriptions.
6. Start/resume one active workout; log actual completed sets for reps/load and duration-based exercises.
7. Complete/abandon with robust status handling and persisted snapshots.
8. Read-only completed history, dashboard and basic progress derived from MongoDB.
9. Interactive dark-first responsive React UI with accessibility and error states.
10. Backend/API validation, authorization tests, cross-user privacy tests, real persistence tests.

### 13.2 P1 / Phase 2

- Goal/equipment-based exercise alternatives and substitutions.
- User-created custom exercises.
- Curated ready-made training plan templates.
- Enhanced exercise media and instructions.
- Light-mode toggle and visual refinements.
- Personal-record calculations, advanced charts and volume trends.
- Bodyweight measurement history and chart.
- History corrections, rest timers, session add-exercise controls.
- Password reset/change, account export/deletion, backup drill.

### 13.3 Explicit exclusions

No gym owner dashboard, membership fees, attendance management, trainer-to-client assignments, nutrition prescriptions, payment processing, social network, AI medical advice, online coach chat, wearable sync, or native mobile application. These require new scope approval.

---

## 14. Verification and Acceptance Test Matrix

| Test ID | Scenario | Requirement links | Pass condition |
|---|---|---|---|
| AT-01 | Register, login, logout, refresh | FR-AUTH-01..05 | Successful state transition, secure persistence/logout |
| AT-02 | Duplicate email and bad payloads | FR-AUTH-01, §7.1 | No invalid account created |
| AT-03 | Switch goal and filter Chest + Dumbbells | FR-PROF-02, FR-EXER-02..09 | Multiple fitting exercises; catalog not locked |
| AT-04 | Confirm seeded catalog variety | FR-EXER-02 | ≥4 distinct exercises in each of 8 groups |
| AT-05 | Create/edit two plans independently | FR-PLAN-01..10 | Both persist with correct details, no overwrite |
| AT-06 | Start plan day and log actual sets | FR-SESS-01..08 | Recorded performance equals entered data |
| AT-07 | Refresh and resume session | FR-SESS-10..12 | Last confirmed server state reloaded |
| AT-08 | Complete twice/submit quickly | FR-SESS-08, FR-PLAN-10 | One session and one completion outcome |
| AT-09 | Change/delete source plan | FR-SESS-09, FR-HIST-03 | History snapshot unchanged |
| AT-10 | Cross-user API access | AUTH-01..05, NFR-SEC-03 | Unauthorized reads/writes blocked |
| AT-11 | Dashboard/week counts | FR-DASH-01..03, FR-PROG-01..03 | Matches completed persisted data; no phantom sessions |
| AT-12 | Mobile/keyboard/reduced motion | FR-UI-01..08, NFR-UX-01..06 | Controls work at target widths, keyboard and motion setting |
| AT-13 | API offline/failure/empty states | FR-UI-03..04, FR-SESS-12 | Meaningful actionable feedback, no false saved status |
| AT-14 | Input boundaries and unsafe text | §7, NFR-SEC-06..08 | Invalid values safely rejected or escaped |
| AT-15 | End-to-end core product flow | §2.2 | Registration through re-login history on real DB passes |

### 14.1 Definition of Done for a P0 feature

A requirement can be marked **Done** only when:

- React workflow is functional and responsive;
- Express route/business logic is implemented and validated;
- MongoDB persistence (when applicable) works and survives refresh;
- Ownership/authentication is enforced;
- Loading/error/empty states are covered;
- Relevant automated and manual acceptance checks pass;
- Documentation and tests reflect the shipped behavior.

---

## 15. Traceability to Documentation and Delivery

| Area | This SRS defines | Next owning document |
|---|---|---|
| Product goals and user scope | Requirements aligned to approved concept | `idea.md` |
| Task sequence/dependencies | Priorities and release gates | `PLANNING.md` |
| Decision state/change notes | Explicit decisions, constraints and open technical choices | `ADR-DECISIONS.md` |
| UI behavior/look | Pages, interactive requirements, accessibility targets | `DESIGN.md` |
| API contracts | API behaviors, validation, errors and authorization expectations | `API-CONTRACT.md` |
| Implementation/data | Security architecture, Mongoose entities, relationships, snapshots | `ARCHITECTURE.md` |

**Traceability rule:** Keep requirement IDs stable; if a requirement changes, update impacted tests, API, design, architecture and context notes. Add new IDs instead of silently repurposing an existing one.

---

## 16. Decisions Resolved and Decisions Pending

### 16.1 Resolved for MVP

1. **Option A: Personal Workout Tracker**, not gym administration.
2. **Fixed MERN stack**: React/Vite/Tailwind/React Router + Node/Express + MongoDB/Mongoose.
3. **Many exercises per group**, minimum 4 in each of 8 specified groups.
4. **Equipment preferences** editable during onboarding or from profile; setup optional.
5. **Custom exercises** deferred to P1; catalog is seeded for MVP.
6. **Persist active workout drafts** to MongoDB, including refresh recovery.
7. **One active workout per user** in MVP.
8. **Curated plan templates** deferred to P1; MVP supports manual plan creation.
9. **Dark-first theme** with interactive UI as P0; light theme as P1.
10. **Immutable completed session history** in MVP; optional correction workflow later.

### 16.2 Technical decisions to finalize before development

- **TD-01 Authentication transport:** secure server-backed session cookie versus short-lived JWT/refresh-cookie strategy. Choose one in `ARCHITECTURE.md`, specify endpoints/CSRF controls in `API-CONTRACT.md`.
- **TD-02 Session idempotency:** exact idempotency-key/uniqueness mechanism for start/complete requests.
- **TD-03 Date boundaries:** week-start convention and whether to store a chosen user timezone for accurate weekly summaries.
- **TD-04 Exercise modeling:** detailed tracking types and measurement unit representation, ensuring duration exercises are first-class.
- **TD-05 Deployment:** hosting arrangement, environment-specific CORS origins, MongoDB connection/security, CI setup.

These are implementation choices, **not permission to change product scope or the fixed stack**.

---

## 17. Review and Approval Checklist

- [ ] Personal workout tracker scope and fixed MERN stack confirmed
- [ ] Goal-based exercise discovery and minimum catalog variety confirmed
- [ ] MVP features and P1 deferred features agreed
- [ ] Field validation rules and user permissions reviewed
- [ ] Workout plan/session/history invariants approved
- [ ] Accessible interactive dark-first design requirements approved
- [ ] Security, privacy, performance and testing targets approved
- [ ] `PLANNING.md`, `DESIGN.md`, `API-CONTRACT.md`, `ARCHITECTURE.md` can derive from requirement IDs without contradictions

**Baseline note:** This is a complete proposed SRS for the current concept. Any requirement adjustments should be documented in `ADR-DECISIONS.md` and reflected consistently in later project documents.
