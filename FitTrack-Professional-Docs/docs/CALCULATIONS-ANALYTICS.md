# FitTrack — Calculations, Metric Semantics and Mathematical Validation

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## 1. Governing rules
These metrics are educational/performance-tracking calculations, **not diagnosis or treatment**. All results derive from user-authorized, **completed** workout sessions unless a metric explicitly targets an active session. Missing values remain missing; never silently coerce `null` into `0` or count unperformed prescribed sets. Round only for display; compute in consistent internal numeric units. Save server-authoritative UTC timestamps and group by an explicitly defined local timezone/week boundary.

## 2. Canonical definitions
| Symbol | Definition |
|---|---|
| `s` | One persisted performed set |
| `c(s)` | `1` if set is marked completed and valid, otherwise `0` |
| `r(s)` | Actual integer repetitions performed; not prescribed reps |
| `w(s)` | Actual **external** training load in kilograms, ≥0; not the participant's total moving body mass |
| `t(s)` | Duration in whole seconds for a timed set |
| `D` | Chosen date window, using saved UTC timestamps mapped to configured display timezone |
| `W(D)` | Completed workout sessions whose `completedAt` falls inside `D` |

## 3. Required P0 metrics
### 3.1 Completed workouts count
\[N_{workouts}(D)=\sum_{x\in Sessions}\mathbf{1}(x.status=completed\land x.completedAt\in D)\]
Abandoned and in-progress excluded; never count a planned day as completed.

### 3.2 Completed performed sets
\[N_{sets}(D)=\sum_{x\in W(D)}\sum_{s\in x.sets} c(s)\]
A completed session is validated to contain at least one valid completed set. A `duration` set has a duration rather than reps/weight.

### 3.3 External-load volume (`kg·reps`)
\[V_{external}(D)=\sum_{x\in W(D)}\sum_{s\in x.sets,\ trackingType=reps\_weight} c(s)\,r(s)\,w(s)\]
Do not label this energy expenditure, mechanical work, total training stress or calories. A 0-kg bodyweight exercise contributes 0 to **external-load** volume even though exercise effort exists; chart explanation must say so. Never include duration-only sets.

### 3.4 Workout duration
\[T_x=\max(0, completedAt_x-startedAt_x)\]
Display minutes = seconds/60, rounded for UI. Exclude abandoned from completed duration analytics. Timestamps are server generated; if a clock inconsistency occurs, flag data integrity instead of hiding broken input.

### 3.5 Weekly frequency
For configured IANA timezone `tz`, define half-open local intervals `[Monday 00:00, next Monday 00:00)` and convert interval bounds to UTC for query. Count completed timestamps inside those exact bounds. Handle DST by calendar-local boundaries (week need not contain 168 UTC hours). **TD-03 must ratify timezone policy before implementation**; recommended default `Asia/Karachi` for university demonstration is a *proposal*, not forced on all users. Browser timezone may seed the preference but must be validated and persisted if adopted.

### 3.6 Change between comparable measures
\[\Delta\% = \frac{new-old}{|old|}\times100,\quad old\ne0\]
This metric is useful only for comparable quantities, tracking type, unit, exercise and sampling strategy; if baseline is zero, return **undefined / N/A**, not infinity. For load trends, specify “maximum actual logged external weight” or “top completed working set” and use consistently. Prefer sorted timestamps over array order.

## 4. Worked example for acceptance tests
A user completes three Bench Press sets: **12×40 kg**, **10×45 kg**, **8×50 kg**.
- Completed sets: `3`.
- External load volume: `(12×40) + (10×45) + (8×50) = 480+450+400 = 1,330 kg·reps`.
- Maximum recorded external load among the sets: `50 kg`.
- Planned 3×10 must **not** replace actual values.
- The workout contributes exactly `1` to completed workout count, irrespective of number of sets.

Another session has `Plank, 45sec` and `Running, 900sec`. They count as **valid timed sets** where marked completed, but not in `kg·reps` volume. This illustrates why cardio volume must not be mixed with weight-based metrics.

## 5. Optional P1 fitness-related formulas with limitations
### 5.1 Adult body mass index (BMI)
\[BMI=\frac{mass_{kg}}{height_{m}^{2}}\]
BMI is only a screening measure and does not distinguish fat from muscle. Do not classify a 16–19-year-old using adult BMI categories; the current profile schema allows ages from 16, so either **restrict adult BMI interpretation to age ≥20** or use an appropriate age-specific authoritative approach in a separately approved feature. No diagnostic conclusion. Reference: https://www.cdc.gov/bmi/adult-calculator/index.html

### 5.2 Estimated one-repetition maximum (1RM), Epley-style approximation
\[1RM_{estimate}=weight_{kg}\left(1+\frac{reps}{30}\right)\]
This is an empirical approximation with exercise/form/repetition/effort assumptions; accuracy varies. Only offer it as **estimated** for suitable nonzero external-load resistance sets, ideally in a bounded rep range adopted after review. Do not use for timed sets, unloaded bodyweight exercises or users with missing comparable input. Never imply a safe lifting recommendation or a direct measured result. Advanced feature only.

### 5.3 Basal metabolic rate / energy expenditure
Not part of P0. Future calculations require explicit formula provenance, demographic input basis, error ranges and professional review; **do not calculate daily calories or exercise calories from workout duration alone**.

## 6. Aggregation implementation map
- Server `analyticsService` scopes match by `userId` and `status:'completed'` first; uses index `{userId,status,completedAt}`.
- Project only required fields, group within bounded windows, limit chart points and paginate large historical lists.
- Resist MongoDB aggregation injection: construct pipelines from approved server constants, never accept raw pipeline or arbitrary field names from client.
- Convert UTC timestamps to configured local week intervals with a tested date library or documented robust implementation; no implicit host-server timezone.
- Return stable empty value semantics: counts `0`; trend `[]` when no sample; comparisons `null` when undefined. Do not draw a fake chart with fabricated starter points.
- For a new account render meaningful guidance rather than inferring progress.

## 7. Example response semantics (illustrative, not an extra committed endpoint)
```json
{
  "data": {
    "completedWorkoutCount": 1,
    "completedSetCount": 3,
    "externalLoadVolumeKgReps": 1330,
    "timeWindow": {
      "startUtc": "2026-11-16T00:00:00.000Z",
      "endUtcExclusive": "2026-11-23T00:00:00.000Z",
      "displayTimezone": "Etc/UTC"
    }
  }
}
```
Existing published API endpoints and their exact field names take precedence; do not return these new sample fields without coordinated API change and tests.

## 8. Test cases
| Test ID | Inputs | Expected result |
|---|---|---|
| CAL-01 | One completed session with 3 resistance sets as above | `1` completed session; `3` sets; `1330 kg·reps` |
| CAL-02 | Same plan but no completed session | Count `0` |
| CAL-03 | Abandoned session with saved sets | Never count in completed-only metrics |
| CAL-04 | Timed plank 60 sec | Valid duration; zero external-load volume contribution |
| CAL-05 | Prior comparison zero | Percent change `null` / N/A |
| CAL-06 | Negative/NaN/Infinity input | Reject on API validation, never aggregate |
| CAL-07 | Two exercises with different units | No mixed-volume metric |
| CAL-08 | Local Monday week boundary | Completed at boundary counted in exactly one week |
| CAL-09 | Daylight savings timezone | Local calendar week handled correctly |
| CAL-10 | BMI with age 16 | No adult category returned |
| CAL-11 | Session plan edited after completion | Aggregate values unchanged |

## 9. Release sign-off
Require product owner approval for wording and metric labels, QA tests for sample data, and independent review of any health screening functionality. Unverified calculations must not be presented as medical facts.
