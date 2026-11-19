import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiRequest } from "../auth/api.js";
import { getCsrfToken } from "../auth/api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { randomUUID } from "../utils/randomUUID.js";

function ApplicationHeader({ active = "" }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      setLogoutError("We could not confirm sign out. Please try again.");
    }
  }

  return (
    <header className="application-header">
      <Link aria-label="FitTrack home" className="wordmark" to="/">
        <span aria-hidden="true" className="wordmark-mark"><span /><span /><span /></span>
        <span>FitTrack</span>
      </Link>
      <nav aria-label="Account navigation" className="application-nav">
        <Link aria-current={active === "exercises" ? "page" : undefined} to="/exercises">
          Exercise library
        </Link>
        <Link aria-current={active === "plans" ? "page" : undefined} to="/plans">
          Plans
        </Link>
        <Link aria-current={active === "history" ? "page" : undefined} to="/history">History</Link>
        <Link to="/profile">Profile</Link>
        <span className="application-user">{user.name}</span>
        <button className="button button-secondary" onClick={handleSignOut} type="button">
          Sign out
        </button>
      </nav>
      {logoutError ? <p className="account-error" role="alert">{logoutError}</p> : null}
    </header>
  );
}

function emptyPlan() {
  return {
    name: "",
    description: "",
    days: [{
      label: "Workout Day",
      weekday: null,
      exercises: [],
    }],
  };
}

export function PlansPage() {
  const [plans, setPlans] = useState(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyPlan());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addExerciseId = searchParams.get("addExerciseId");

  async function loadPlans() {
    setError("");
    try {
      const result = await apiRequest("/plans?sort=updated_desc&limit=20");
      setPlans(result);
    } catch (requestError) {
      setError(requestError.message || "We could not load your plans.");
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  async function createPlan(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const csrfToken = await getCsrfToken();
      const result = await apiRequest("/plans", {
        method: "POST",
        body: draft,
        csrfToken,
        idempotencyKey: randomUUID(),
      });
      navigate(`/plans/${result.id}`);
    } catch (requestError) {
      setError(requestError.message || "We could not create the plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="application-page">
      <ApplicationHeader active="plans" />
      <section className="library-content">
        <div className="plans-heading">
          <div>
            <p className="eyebrow">Your routines</p>
            <h1>Workout plans</h1>
          </div>
          <button
            className="button button-primary"
            onClick={() => setCreating((value) => !value)}
            type="button"
          >
            {creating ? "Cancel" : "Create plan"}
          </button>
        </div>
        {error ? <p className="account-error" role="alert">{error}</p> : null}
        {creating ? (
          <form className="plan-create-card" onSubmit={createPlan}>
            <label htmlFor="plan-name">
              Plan name
              <input
                id="plan-name"
                maxLength="80"
                minLength="2"
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                required
                value={draft.name}
              />
            </label>
            <label htmlFor="plan-description">
              Description
              <textarea
                id="plan-description"
                maxLength="500"
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                value={draft.description}
              />
            </label>
            <label htmlFor="plan-day-label">
              First workout day
              <input
                id="plan-day-label"
                maxLength="50"
                onChange={(event) => setDraft({
                  ...draft,
                  days: [{ ...draft.days[0], label: event.target.value }],
                })}
                value={draft.days[0].label}
              />
            </label>
            <button className="button button-primary" disabled={saving} type="submit">
              {saving ? "Saving…" : "Create and edit"}
            </button>
          </form>
        ) : null}
        {!plans ? (
          <p aria-live="polite" className="account-status">Loading plans…</p>
        ) : plans.data.length ? (
          <div className="plans-grid">
            {plans.data.map((plan) => (
              <article className="plan-card" key={plan.id}>
                <p className="plan-card-meta">{plan.dayCount} {plan.dayCount === 1 ? "day" : "days"}</p>
                <h2><Link to={`/plans/${plan.id}`}>{plan.name}</Link></h2>
                <p>Updated {new Date(plan.updatedAt).toLocaleDateString()}</p>
                <Link
                  className="button button-secondary"
                  to={`/plans/${plan.id}${addExerciseId ? `?addExerciseId=${encodeURIComponent(addExerciseId)}` : ""}`}
                >
                  Open plan
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="exercise-empty">
            <h2>No workout plans yet</h2>
            <p>Create a plan, then add catalog exercises and targets.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export function PlanDetailPage() {
  const { planId } = useParams();
  const [searchParams] = useSearchParams();
  const requestedExerciseId = searchParams.get("addExerciseId");
  const [plan, setPlan] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiRequest(`/plans/${planId}`, { signal: controller.signal }),
      apiRequest("/exercises?limit=50", { signal: controller.signal }),
    ])
      .then(([planResult, catalogResult]) => {
        setCatalog(catalogResult.data);
        if (requestedExerciseId) {
          const exercise = catalogResult.data.find((item) => item.id === requestedExerciseId);
          if (exercise) {
            const next = {
              ...planResult,
              days: planResult.days.map((day, index) =>
                index === 0
                  ? {
                      ...day,
                      exercises: [
                        ...day.exercises,
                        {
                          exerciseId: exercise.id,
                          position: day.exercises.length,
                          targetSets: 3,
                          targetReps: exercise.trackingType === "duration" ? null : 10,
                          targetDurationSec: exercise.trackingType === "duration" ? 60 : null,
                          targetWeightKg: exercise.trackingType === "reps_weight" ? 0 : null,
                        },
                      ],
                    }
                  : day,
              ),
            };
            setPlan(next);
            setError("Exercise added locally. Save the plan to confirm it on the server.");
          } else {
            setPlan(planResult);
          }
        } else {
          setPlan(planResult);
        }
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "We could not load this plan.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [planId, requestedExerciseId]);

  function updateDay(dayId, changes) {
    setPlan((current) => ({
      ...current,
      days: current.days.map((day) => day.id === dayId ? { ...day, ...changes } : day),
    }));
  }

  function addExercise(dayId) {
    if (!catalog.length) return;
    const exercise = catalog[0];
    setPlan((current) => ({
      ...current,
      days: current.days.map((day) => {
        if (day.id !== dayId) return day;
        const position = day.exercises.length;
        return {
          ...day,
          exercises: [
            ...day.exercises,
            {
              exerciseId: exercise.id,
              position,
              targetSets: 3,
              targetReps: exercise.trackingType === "duration" ? null : 10,
              targetDurationSec: exercise.trackingType === "duration" ? 60 : null,
              targetWeightKg: exercise.trackingType === "reps_weight" ? 0 : null,
            },
          ],
        };
      }),
    }));
  }

  function removeExercise(dayId, position) {
    setPlan((current) => ({
      ...current,
      days: current.days.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          exercises: day.exercises
            .filter((exercise) => exercise.position !== position)
            .map((exercise, index) => ({ ...exercise, position: index })),
        };
      }),
    }));
  }

  async function savePlan() {
    setSaving(true);
    setError("");
    try {
      const csrfToken = await getCsrfToken();
      const result = await apiRequest(`/plans/${planId}`, {
        method: "PATCH",
        body: {
          version: plan.version,
          name: plan.name,
          description: plan.description,
          days: plan.days,
        },
        csrfToken,
      });
      setPlan(result);
    } catch (requestError) {
      setError(requestError.message || "We could not save this plan.");
    } finally {
      setSaving(false);
    }
  }

  async function startDay(dayId) {
    setSaving(true);
    setError("");
    try {
      const csrfToken = await getCsrfToken();
      const result = await apiRequest("/sessions", {
        method: "POST",
        body: { planId, dayId },
        csrfToken,
        idempotencyKey: randomUUID(),
      });
      navigate(`/workout/${result.id}`);
    } catch (requestError) {
      setError(requestError.message || "We could not start this workout.");
    } finally {
      setSaving(false);
    }
  }

  async function archivePlan() {
    if (!window.confirm("Archive this plan? Its existing completed session history will remain available.")) {
      return;
    }
    setSaving(true);
    setError("");
    try {
      const csrfToken = await getCsrfToken();
      await apiRequest(`/plans/${planId}`, { method: "DELETE", csrfToken });
      navigate("/plans", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "We could not archive this plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="application-page">
      <ApplicationHeader active="plans" />
      <section className="library-content">
        <Link className="text-link exercise-back-link" to="/plans">← Back to plans</Link>
        {loading ? (
          <p aria-live="polite" className="account-status">Loading plan…</p>
        ) : error ? (
          <p className="account-error" role="alert">{error}</p>
        ) : plan ? (
          <>
            <div className="plan-detail-heading">
              <label htmlFor="plan-detail-name">
                Plan name
                <input
                  id="plan-detail-name"
                  maxLength="80"
                  onChange={(event) => setPlan({ ...plan, name: event.target.value })}
                  value={plan.name}
                />
              </label>
              <div className="plan-actions">
                <button className="button button-secondary" disabled={saving} onClick={archivePlan} type="button">
                  Archive
                </button>
                <button className="button button-primary" disabled={saving} onClick={savePlan} type="button">
                  {saving ? "Saving…" : "Save plan"}
                </button>
              </div>
            </div>
            <label className="plan-description-field" htmlFor="plan-detail-description">
              Description
              <textarea
                id="plan-detail-description"
                maxLength="500"
                onChange={(event) => setPlan({ ...plan, description: event.target.value })}
                value={plan.description}
              />
            </label>
            <div className="plan-days">
              {plan.days.map((day) => (
                <article className="plan-day" key={day.id}>
                  <div className="plan-day-heading">
                    <label htmlFor={`day-${day.id}`}>
                      Day name
                      <input
                        id={`day-${day.id}`}
                        maxLength="50"
                        onChange={(event) => updateDay(day.id, { label: event.target.value })}
                        value={day.label}
                      />
                    </label>
                    <button className="button button-secondary" onClick={() => addExercise(day.id)} type="button">
                      Add exercise
                    </button>
                    <button
                      className="button button-primary"
                      disabled={saving || day.exercises.length === 0}
                      onClick={() => startDay(day.id)}
                      type="button"
                    >
                      Start workout
                    </button>
                  </div>
                  {day.exercises.length ? (
                    <div className="plan-exercise-list">
                      {day.exercises.map((entry) => {
                        const exercise = catalog.find((item) => item.id === entry.exerciseId);
                        return (
                          <article className="plan-exercise-row" key={entry.id ?? `${day.id}-${entry.position}`}>
                            <div>
                              <strong>{exercise?.name ?? "Catalog exercise"}</strong>
                              <span>{exercise?.trackingType.replaceAll("_", " ") ?? "Loading tracking type"}</span>
                            </div>
                            <label>
                              Sets
                              <input
                                min="1"
                                max="12"
                                onChange={(event) => setPlan((current) => ({
                                  ...current,
                                  days: current.days.map((item) => item.id === day.id
                                    ? {
                                        ...item,
                                        exercises: item.exercises.map((candidate) => candidate.position === entry.position
                                          ? { ...candidate, targetSets: Number(event.target.value) }
                                          : candidate),
                                      }
                                    : item),
                                }))}
                                type="number"
                                value={entry.targetSets}
                              />
                            </label>
                            {exercise?.trackingType !== "duration" ? (
                              <label>
                                Reps
                                <input
                                  min="1"
                                  max="100"
                                  onChange={(event) => setPlan((current) => ({
                                    ...current,
                                    days: current.days.map((item) => item.id === day.id
                                      ? {
                                          ...item,
                                          exercises: item.exercises.map((candidate) => candidate.position === entry.position
                                            ? { ...candidate, targetReps: Number(event.target.value) }
                                            : candidate),
                                        }
                                      : item),
                                  }))}
                                  type="number"
                                  value={entry.targetReps ?? ""}
                                />
                              </label>
                            ) : (
                              <label>
                                Seconds
                                <input
                                  min="1"
                                  max="7200"
                                  onChange={(event) => setPlan((current) => ({
                                    ...current,
                                    days: current.days.map((item) => item.id === day.id
                                      ? {
                                          ...item,
                                          exercises: item.exercises.map((candidate) => candidate.position === entry.position
                                            ? { ...candidate, targetDurationSec: Number(event.target.value) }
                                            : candidate),
                                        }
                                      : item),
                                  }))}
                                  type="number"
                                  value={entry.targetDurationSec ?? ""}
                                />
                              </label>
                            )}
                            {exercise?.trackingType === "reps_weight" ? (
                              <label>
                                Weight kg
                                <input
                                  min="0"
                                  max="500"
                                  step="0.5"
                                  onChange={(event) => setPlan((current) => ({
                                    ...current,
                                    days: current.days.map((item) => item.id === day.id
                                      ? {
                                          ...item,
                                          exercises: item.exercises.map((candidate) => candidate.position === entry.position
                                            ? { ...candidate, targetWeightKg: Number(event.target.value) }
                                            : candidate),
                                        }
                                      : item),
                                  }))}
                                  type="number"
                                  value={entry.targetWeightKg ?? ""}
                                />
                              </label>
                            ) : null}
                            <button
                              aria-label={`Remove ${exercise?.name ?? "exercise"} from ${day.label}`}
                              className="button button-secondary"
                              onClick={() => removeExercise(day.id, entry.position)}
                              type="button"
                            >
                              Remove
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="plan-empty-day">No exercises yet. Add an exercise to this workout day.</p>
                  )}
                </article>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
