# FitTrack — Website Content, Landing Messaging and UI Copy

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## 1. Voice and content boundaries
Confident, precise, friendly, not exaggerated. Use language that describes **capabilities** and **tracked evidence**, not promises of fat loss, injury prevention or medical treatment. Show 'Create Account', not 'Join millions' without evidence. Do not borrow the reference screenshot's brand, contact email or exact copy. All example exercise and chart stats in public preview must be labeled as **examples**.

## 2. Landing page, from top to bottom
### Header
Logo/wordmark: `FitTrack`. Menu: `Features`, `3D Exercises`, `How It Works`, `Progress` (links to actual anchors) plus `Log In` and `Get Started`.

### Hero (full-viewport)
- Eyebrow: `PERSONAL WORKOUT TRACKER`
- H1: **Build Your Plan. Track Every Set. Own Your Progress.**
- Paragraph: `Explore exercises, create training routines, record your real workouts, and see progress you can actually explain.`
- Primary: **Get Started** (`/register`)
- Secondary: **Explore Features** (`#features`)
- Media overlay/caption: `3D exercise demonstration — available on verified exercises` (do not imply all catalog items animated).
- Accessibility: if model unavailable, poster alt: `Illustrative anatomical model of a person demonstrating an exercise; detailed instructions appear below.` Only use that alt when image/clip actually corresponds.

### Why FitTrack? (`#why`)
- H2: `Workouts Worth Remembering.`
- Paragraph: `A routine is only part of the story. FitTrack helps you capture what you actually lifted, how many repetitions you completed, and what you want to improve next.`
- Three short points: `Plan with control`, `Train with clarity`, `Review real history`.

### Features (`#features`)
- H2: `Everything You Need to Stay Organized.`
- Cards: `Explore Exercises`, `Build Custom Plans`, `Log Every Completed Set`, `Resume Workouts`, `Review History`, `See Trends`.
- Body detail should never mention nonexistent AI, wearables or admin features.

### 3D demo (`#demo`)
- H2: `See the Movement. Understand the Steps.`
- Paragraph: `Explore clear exercise instructions with a controlled 3D demonstration where reviewed animation is available. Every exercise remains readable without 3D.`
- UI state text: `Loading demonstration…`, `Play exercise demo`, `Pause demo`, `Replay`, `3D preview unavailable — read the steps below`, `Illustrative movement; not personalized coaching`.

### Catalog preview (`#exercises`)
- H2: `Find Movements That Fit Your Routine.`
- Description: `Browse options by muscle group, equipment and experience level. Your goal guides discovery—it never locks you out of other exercises.`
- CTA: `Create an Account to Explore Exercises` (`/register`). Do not expose a protected catalog anonymously unless backend policy changes.

### Progress preview (`#progress`)
- H2: `Progress That Has a Source.`
- Description: `Review the sessions you've completed, compare exercise records, and understand training consistency without guessing.`
- Chart label: `Example data for illustration` **until actual user login**.

### How it works (`#how-it-works`)
1. `Choose a Goal` — `Set a training preference and available equipment.`
2. `Build a Plan` — `Choose exercises and targets for each workout day.`
3. `Log Your Workout` — `Save actual completed repetitions, loads or durations.`
4. `Review Your Progress` — `Explore saved history and transparent trends.`

### Closing/outro (full-viewport; footer integrated)
- Eyebrow: `YOUR NEXT SESSION STARTS HERE`
- H2: **Make Every Workout Count.**
- Paragraph: `Turn training intentions into a record you can trust.`
- Primary: `Create Your Account` -> `/register`.
- Secondary: `Already have an account? Log In` -> `/login`.
- Large visual background text: `FITTRACK` (decorative, aria-hidden if duplicate).
- Footer: `© {YEAR} FitTrack. Personal workout tracking.` where actual year generated in client; only include legal links after real text exists.

## 3. Feedback and edge-state wording
| Context | Copy |
|---|---|
| New user dashboard | `No completed workouts yet. Create a plan to get started.` |
| Exercise no results | `No exercises match these filters. Clear filters to see more.` |
| Set dirty | `Unsaved changes` |
| Set saving | `Saving…` |
| Set saved | `Saved` (only after verified server response) |
| Network ambiguous | `Save not confirmed. Recheck your workout before trying again.` |
| Session conflict | `An active workout already exists. Resume it or abandon it first.` |
| Plan version conflict | `This plan changed in another tab. Review the latest version.` |
| No 3D model | `3D preview unavailable. Follow the written instructions.` |
| Inappropriate preview claims | Never use `Perfect form guaranteed` / `Medical-grade anatomical accuracy` |

## 4. SEO and content basics
Descriptive HTML title, meta description, semantic main/heading hierarchy, Open Graph preview assets **only if owned/licensed**, canonical URL once deployed, no bogus search keywords. Do not place private workout stats or account identity in public SEO pages. Product names in screenshots/preview must be clearly fictional where demo data is shown.
