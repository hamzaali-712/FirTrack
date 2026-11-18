# FitTrack — Product Idea and Vision

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## Positioning
**FitTrack helps people plan workouts, learn common movements through vetted content, log what they actually perform, and understand progression—without a trainer subscription or complicated setup.** It targets individual gym-goers, students, beginners and experienced home/gym trainees, rather than gym administrators.

## The pain
People forget their sets and loads, struggle to build repeatable routines, and sometimes choose movements without an accessible explanation. Generic catalogs often present too few alternatives or conflate prescribed targets with completed work. FitTrack connects discovery, a reusable routine, actual workout state, durable history and accessible visual instruction.

## Product promise
- Personal goal preference suggests, but never restricts, exercises.
- Curated exercise choices for eight major groups; extensible taxonomy for subgroups and more categories.
- Multiple independent plans, prescribed and performed data separated.
- Reliable workout recovery and immutable historical truth.
- Clear analytics with date windows, units, missing-data behavior and no fabricated values.
- Responsive Ocean Breeze experience with a genuinely useful 3D demonstration layer when assets are verified.

## Key differentiator
**Instruction + execution + evidence:** users can view a realistic anatomical demonstration where available, build the movement into a plan, track actual reps/weight or timed sets, then compare real performed sessions. 3D content is an educational visual aid, **not** real-time form analysis, a training prescription or medical advice.

## Personas and jobs-to-be-done
| Persona | Problem | FitTrack outcome |
|---|---|---|
| Beginner | Unfamiliar exercise mechanics | Instructions, difficulty tags, supported 3D preview |
| Strength trainee | Forgets training loads | Past sets, reliable progressive comparisons |
| Muscle-gain trainee | Wants more options for a muscle group | Filtering across exercise alternatives |
| Home trainee | Limited equipment | Equipment-aware discovery |
| Consistency-focused trainee | Doesn't see pattern over weeks | Completed-only frequency dashboard |

## Brand and voice
FitTrack is calm, clear, energetic and trustworthy. Brand palette is Ocean Breeze, with high-contrast semantic colors. Manrope is preferred. Headlines emphasize **tracking and agency**, not exaggerated body-transformation guarantees. The reference site's typography-heavy hero/footer is inspiration only, not copy or brand content.

## Reference journey
Register -> choose goal -> filter Chest -> open one approved 3D demonstration -> select exercises -> build Monday plan -> start workout -> log actual reps/weight -> refresh/resume -> complete -> inspect history/graphs -> adjust plan without retroactive history edits.

## Roadmap boundaries
P0: functional MERN workflow, 32+ seeded exercises, accessible 3D viewer + one validated clip, branded landing, core charts. P1: broad media coverage, advanced muscle mapping/3D clip inventory, extra exercise categories, body-metric history, templates and advanced insights. Never claim all exercises are animated unless individual assets are validated.
