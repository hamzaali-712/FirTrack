# FitTrack — Architecture Diagram Collection (Mermaid Sources)

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


> All diagrams are **conceptual design**, not evidence of runtime infrastructure or built files. Mermaid source is maintained here to make the designs editable and reproducible in VS Code / Markdown preview tooling. The canonical API/data contracts remain in `API-CONTRACT.md` and `DATABASE-SCHEMA.md`.

## 1. C4-inspired context diagram
```mermaid
flowchart LR
  USER[Individual Gym/Home Trainee] -->|HTTPS| FT[FitTrack Personal Workout Web Application]
  FT -->|Read/write owner data| DATA[(FitTrack MongoDB)]
  CURATOR[Developer Seed Operator] -->|Controlled content provision| FT
  ASSET[Approved 3D Media Source] -->|Static versioned assets| FT
```

## 2. Container architecture
```mermaid
flowchart TB
  B[Browser] -->|React SPA| SPA[React / Vite / Tailwind]
  SPA -->|REST JSON /api/v1| API[Express on Node.js]
  API -->|Mongoose| M[(MongoDB Replica Set)]
  SPA -->|HTTPS versioned media| CDN[Static GLB / Poster Assets]
  API --> OBS[Structured Safe Logs]
```

## 3. Express component diagram
```mermaid
flowchart TD
  ROUTES[Routes & Validators] --> CONTROLLERS[Thin Controllers]
  CONTROLLERS --> AUTH[Auth/Profile Service]
  CONTROLLERS --> CATALOG[Catalog Service]
  CONTROLLERS --> PLANS[Plan Service]
  CONTROLLERS --> WORK[Session Service]
  CONTROLLERS --> ANALYTICS[Analytics Service]
  AUTH --> REPOS[Owner-scoped Mongoose Repositories]
  CATALOG --> REPOS
  PLANS --> REPOS
  WORK --> REPOS
  ANALYTICS --> REPOS
  REPOS --> DB[(MongoDB)]
  WORK --> ERR[Typed Errors]
  ERR --> HANDLER[Central Error Middleware]
```

## 4. UML-style use cases
```mermaid
flowchart LR
  G[Visitor] --> L[View Landing]
  G --> A[Register / Login]
  U[Authenticated User] --> P[Edit Profile]
  U --> E[Browse Exercises]
  U --> D[View 3D Exercise Preview]
  U --> W[Build Plans]
  U --> S[Start / Resume Workout]
  U --> H[Review History]
  U --> R[View Progress]
  O[Offline Developer Seeder] --> C[Curate Catalog and Licensed Media]
```

## 5. DFD level 0 (high-level flows)
```mermaid
flowchart LR
  USER[User] -->|Account and inputs| FT[FitTrack Process]
  FT -->|Authenticated response| USER
  FT -->|User records and queries| USERDB[(Users / Plans / Sessions)]
  USERDB -->|Owned records| FT
  SEED[Curated Content Seeder] -->|Approved Exercise Metadata| CAT[(Exercise Catalog)]
  CAT -->|Search metadata| FT
  FT -->|Asset pointer| MEDIA[Static 3D Assets]
  MEDIA -->|Model/clip bytes to browser| USER
```

## 6. DFD level 1 — workout persistence
```mermaid
flowchart TD
  IN[Workout UI / performed sets] --> VAL[Express Validation]
  VAL --> OWN[Auth + owner/session status checks]
  OWN --> CAS[Versioned atomic set update]
  CAS --> DB[(Workout Sessions)]
  DB --> RESP[Updated confirmed session snapshot]
  RESP --> UI[React saved/uncertain state]
  UI --> IN
```

## 7. Sequence — register and hydrate
```mermaid
sequenceDiagram
  actor User
  participant UI as React
  participant API as Express
  participant DB as MongoDB
  User->>UI: Submit registration
  UI->>API: POST /auth/register + CSRF bootstrap
  API->>DB: Insert normalized unique account / hashed password
  DB-->>API: Created account
  API-->>UI: 201 + Secure HttpOnly session cookie
  UI->>API: GET /auth/session
  API->>DB: Verify unexpired and unrevoked session
  API-->>UI: Safe current-user snapshot
  UI-->>User: Dashboard
```

## 8. Sequence — plan to completed immutable workout
```mermaid
sequenceDiagram
  actor User
  participant UI as React
  participant API as Express
  participant DB as MongoDB
  User->>UI: Start plan-day workout
  UI->>API: POST /sessions + Idempotency-Key
  API->>DB: Owner-scoped snapshot + unique active guard
  DB-->>API: In-progress session
  API-->>UI: 201 session ID
  User->>UI: Enter actual set
  UI->>API: PATCH /sessions/:id/sets/:setId + version
  API->>DB: Conditional version/CAS update
  DB-->>API: Updated session
  API-->>UI: 200 confirmed saved state
  User->>UI: Refresh browser
  UI->>API: GET /sessions/active
  API-->>UI: Last confirmed performed sets
  User->>UI: Finish
  UI->>API: POST /sessions/:id/complete
  API->>DB: Guarded terminal transition
  API-->>UI: Completed immutable snapshot
```

## 9. Sequence — 3D asset loading and fallback
```mermaid
sequenceDiagram
  actor User
  participant UI as React Exercise Detail
  participant API as Express Catalog API
  participant CDN as Approved Static Assets
  User->>UI: Open exercise
  UI->>API: GET /exercises/:exerciseId
  API-->>UI: Description + optional approved animation metadata
  alt Approved animation available and WebGL supported
    User->>UI: Play demo
    UI->>CDN: GET versioned GLB
    CDN-->>UI: Verified model/clip bytes
    UI-->>User: Controlled 3D demonstration + instructions
  else Missing/unsupported/reduced-motion
    UI-->>User: Poster + text instructions / manual play option
  end
```

## 10. Workout lifecycle state machine
```mermaid
stateDiagram-v2
    [*] --> in_progress: Start (guarded)
    in_progress --> in_progress: Save set / resume
    in_progress --> completed: Complete with valid set(s)
    in_progress --> abandoned: Confirm abandon
    completed --> [*]
    abandoned --> [*]
```

## 11. Data ownership and cardinality
```mermaid
erDiagram
 USERS ||--o{ WORKOUT_PLANS : owns
 USERS ||--o{ WORKOUT_SESSIONS : owns
 USERS ||--o{ AUTH_SESSIONS : holds
 EXERCISES ||--o{ WORKOUT_PLANS : selected_in
 WORKOUT_PLANS ||--o{ WORKOUT_SESSIONS : source_of
```

## 12. Deployment diagram
```mermaid
flowchart TD
  CLIENT[User Browser HTTPS] --> EDGE[Secure TLS Ingress]
  EDGE -->|SPA files + static media| WEB[Static Hosting]
  EDGE -->|/api/v1| NODE[Express Deployment]
  NODE -->|TLS| DB[(Managed MongoDB Replica Set)]
  NODE --> TELEMETRY[Redacted Request / Error Logs]
```

## 13. Diagram review gate
Verify each diagram against actual route names, schema fields and chosen deployment provider once implemented. Replace conceptual labels with deployed topology only when evidence is available. Any new service or trust boundary must trigger architecture/security review.
