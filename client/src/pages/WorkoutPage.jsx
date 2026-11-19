import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCsrfToken, apiRequest } from "../auth/api.js";
import { useAuth } from "../auth/AuthContext.jsx";

function WorkoutHeader() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header className="application-header">
      <Link aria-label="FitTrack home" className="wordmark" to="/">
        <span aria-hidden="true" className="wordmark-mark"><span /><span /><span /></span>
        <span>FitTrack</span>
      </Link>
      <nav aria-label="Workout navigation" className="application-nav">
        <Link to="/plans">Plans</Link>
        <Link to="/exercises">Exercise library</Link>
        <Link to="/history">History</Link>
        <span className="application-user">{user.name}</span>
        <button className="button button-secondary" onClick={handleSignOut} type="button">
          Sign out
        </button>
      </nav>
    </header>
  );
}

export function WorkoutPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState({});

  async function loadSession() {
    setLoading(true);
    setError("");
    try {
      const result = sessionId === "active"
        ? await apiRequest("/sessions/active")
        : await apiRequest(`/sessions/${sessionId}`);
      if (!result) {
        setError("No active workout is in progress.");
        setLoading(false);
        return;
      }
      if (sessionId === "active") {
        navigate(`/workout/${result.id}`, { replace: true });
      }
      setSession(result);
    } catch (requestError) {
      setError(requestError.message || "We could not load this workout.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  function updateSet(exerciseId, setId, changes) {
    setSession((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, ...changes } : set,
              ),
            }
          : exercise,
      ),
    }));
  }

  async function saveSet(exercise, set) {
    setSaveStatus((current) => ({ ...current, [set.id]: "saving" }));
    setError("");
    try {
      const csrfToken = await getCsrfToken();
      const result = await apiRequest(`/sessions/${sessionId}/sets/${set.id}`, {
        method: "PATCH",
        csrfToken,
        body: {
          version: session.version,
          reps: set.reps,
          weightKg: set.weightKg,
          durationSec: set.durationSec,
          completed: set.completed,
        },
      });
      setSession((current) => ({ ...current, version: result.version }));
      setSaveStatus((current) => ({ ...current, [set.id]: "saved" }));
    } catch (requestError) {
      if (requestError.status === 409) {
        setSaveStatus((current) => ({ ...current, [set.id]: "conflict" }));
        try {
          const refreshed = await apiRequest(`/sessions/${sessionId}`);
          setSession(refreshed);
          setError("The workout changed in another tab. Refetched the confirmed server values.");
        } catch {
          setError("We could not reconcile this workout. Reload before retrying.");
        }
      } else {
        setSaveStatus((current) => ({ ...current, [set.id]: "uncertain" }));
        setError(requestError.message || "The set save was not confirmed.");
      }
    }
  }

  async function finishWorkout() {
    setError("");
    try {
      const csrfToken = await getCsrfToken();
      const result = await apiRequest(`/sessions/${sessionId}/complete`, {
        method: "POST",
        csrfToken,
        body: { version: session.version },
      });
      setSession((current) => ({ ...current, ...result }));
    } catch (requestError) {
      setError(requestError.message || "We could not finish this workout.");
    }
  }

  async function abandonWorkout() {
    if (!window.confirm("Abandon this workout? Performed sets will remain in the read-only abandoned record.")) {
      return;
    }
    try {
      const csrfToken = await getCsrfToken();
      const result = await apiRequest(`/sessions/${sessionId}/abandon`, {
        method: "POST",
        csrfToken,
        body: { version: session.version },
      });
      setSession((current) => ({ ...current, ...result }));
    } catch (requestError) {
      setError(requestError.message || "We could not abandon this workout.");
    }
  }

  return (
    <main className="application-page">
      <WorkoutHeader />
      <section className="library-content workout-page">
        <Link className="text-link exercise-back-link" to="/plans">← Back to plans</Link>
        {loading ? (
          <p aria-live="polite" className="account-status">Loading workout…</p>
        ) : error ? (
          <p className="account-error" role="alert">{error}</p>
        ) : null}
        {session ? (
          <>
            <div className="workout-heading">
              <div>
                <p className="eyebrow">{session.status.replaceAll("_", " ")}</p>
                <h1>{session.planNameSnapshot}</h1>
                <p>{session.dayLabelSnapshot}</p>
              </div>
              {session.status === "in_progress" ? (
                <div className="plan-actions">
                  <button className="button button-secondary" onClick={abandonWorkout} type="button">
                    Abandon
                  </button>
                  <button className="button button-primary" onClick={finishWorkout} type="button">
                    Complete workout
                  </button>
                </div>
              ) : (
                <Link className="button button-secondary" to="/plans">Return to plans</Link>
              )}
            </div>
            <div className="workout-exercises">
              {session.exercises.map((exercise) => (
                <article className="workout-exercise" key={exercise.id}>
                  <h2>{exercise.nameSnapshot}</h2>
                  <p>{exercise.targetSets} {exercise.targetSets === 1 ? "set" : "sets"} · {
                    exercise.trackingType === "duration"
                      ? `${exercise.targetDurationSec ?? ""} seconds`
                      : `${exercise.targetReps ?? ""} reps${exercise.targetWeightKg !== null ? ` · ${exercise.targetWeightKg} kg` : ""}`
                  }</p>
                  <div className="workout-set-list">
                    {exercise.sets.map((set) => (
                      <div className="workout-set" key={set.id}>
                        <strong>Set {set.position + 1}</strong>
                        {exercise.trackingType !== "duration" ? (
                          <label>
                            Reps
                            <input
                              disabled={session.status !== "in_progress"}
                              min="0"
                              max="100"
                              onChange={(event) => updateSet(exercise.id, set.id, { reps: event.target.value === "" ? null : Number(event.target.value) })}
                              type="number"
                              value={set.reps ?? ""}
                            />
                          </label>
                        ) : (
                          <label>
                            Seconds
                            <input
                              disabled={session.status !== "in_progress"}
                              min="0"
                              max="7200"
                              onChange={(event) => updateSet(exercise.id, set.id, { durationSec: event.target.value === "" ? null : Number(event.target.value) })}
                              type="number"
                              value={set.durationSec ?? ""}
                            />
                          </label>
                        )}
                        {exercise.trackingType === "reps_weight" ? (
                          <label>
                            Weight kg
                            <input
                              disabled={session.status !== "in_progress"}
                              min="0"
                              max="500"
                              step="0.5"
                              onChange={(event) => updateSet(exercise.id, set.id, { weightKg: event.target.value === "" ? null : Number(event.target.value) })}
                              type="number"
                              value={set.weightKg ?? ""}
                            />
                          </label>
                        ) : null}
                        <label className="workout-completed">
                          <input
                            checked={set.completed}
                            disabled={session.status !== "in_progress"}
                            onChange={(event) => updateSet(exercise.id, set.id, { completed: event.target.checked })}
                            type="checkbox"
                          />
                          Completed
                        </label>
                        {session.status === "in_progress" ? (
                          <button
                            className="button button-secondary"
                            disabled={saveStatus[set.id] === "saving"}
                            onClick={() => saveSet(exercise, set)}
                            type="button"
                          >
                            {saveStatus[set.id] === "saving"
                              ? "Saving…"
                              : saveStatus[set.id] === "saved"
                                ? "Saved"
                                : saveStatus[set.id] === "conflict"
                                  ? "Refetch required"
                                  : saveStatus[set.id] === "uncertain"
                                    ? "Save uncertain"
                                    : "Save set"}
                          </button>
                        ) : null}
                        {saveStatus[set.id] === "saved" ? (
                          <span className="workout-save-status" role="status">Confirmed by server</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
