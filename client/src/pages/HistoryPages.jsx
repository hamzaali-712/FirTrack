import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../auth/api.js";
import { useAuth } from "../auth/AuthContext.jsx";

function ApplicationHeader({ active = "" }) {
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
      <nav aria-label="Account navigation" className="application-nav">
        <Link aria-current={active === "exercises" ? "page" : undefined} to="/exercises">Exercise library</Link>
        <Link aria-current={active === "plans" ? "page" : undefined} to="/plans">Plans</Link>
        <Link aria-current={active === "history" ? "page" : undefined} to="/history">History</Link>
        <Link to="/profile">Profile</Link>
        <span className="application-user">{user.name}</span>
        <button className="button button-secondary" onClick={handleSignOut} type="button">Sign out</button>
      </nav>
    </header>
  );
}

function durationLabel(minutes) {
  if (minutes === null || minutes === undefined) return "Duration unavailable";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

export function HistoryPage() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    apiRequest(`/sessions?status=completed&page=${page}&limit=10&sort=completed_desc`, {
      signal: controller.signal,
    })
      .then(setResult)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "We could not load workout history.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, reloadKey]);

  return (
    <main className="application-page">
      <ApplicationHeader active="history" />
      <section className="library-content history-content">
        <p className="eyebrow">Completed sessions</p>
        <h1>Workout history</h1>
        {loading ? (
          <p aria-live="polite" className="account-status">Loading history…</p>
        ) : error ? (
          <div className="exercise-message" role="alert">
            <p>{error}</p>
            <button className="button button-secondary" onClick={() => setReloadKey((value) => value + 1)} type="button">Retry</button>
          </div>
        ) : result?.data.length ? (
          <>
            <div className="history-list">
              {result.data.map((session) => (
                <article className="history-card" key={session.id}>
                  <div>
                    <p className="history-status">Completed</p>
                    <h2>{session.planNameSnapshot}</h2>
                    <p>{session.dayLabelSnapshot}</p>
                  </div>
                  <dl className="history-facts">
                    <div>
                      <dt>Completed</dt>
                      <dd>{new Date(session.completedAt).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt>Duration</dt>
                      <dd>{durationLabel(session.durationMinutes)}</dd>
                    </div>
                    <div>
                      <dt>Completed sets</dt>
                      <dd>{session.completedSetCount}</dd>
                    </div>
                  </dl>
                  <Link className="button button-secondary" to={`/history/${session.id}`}>View details</Link>
                </article>
              ))}
            </div>
            {result.meta.totalPages > 1 ? (
              <nav aria-label="Workout history pages" className="exercise-pagination">
                <button className="button button-secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} type="button">Previous</button>
                <span>Page {page} of {result.meta.totalPages}</span>
                <button className="button button-secondary" disabled={!result.meta.hasNextPage} onClick={() => setPage((value) => value + 1)} type="button">Next</button>
              </nav>
            ) : null}
          </>
        ) : (
          <div className="exercise-empty">
            <h2>No completed workouts yet</h2>
            <p>Finish a workout to create an immutable history record.</p>
            <Link className="button button-primary" to="/plans">View workout plans</Link>
          </div>
        )}
      </section>
    </main>
  );
}

export function HistoryDetailPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    apiRequest(`/sessions/${sessionId}`, { signal: controller.signal })
      .then(setSession)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "We could not load this workout.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [sessionId]);

  return (
    <main className="application-page">
      <ApplicationHeader active="history" />
      <section className="library-content history-detail-content">
        <Link className="text-link exercise-back-link" to="/history">← Back to history</Link>
        {loading ? (
          <p aria-live="polite" className="account-status">Loading workout…</p>
        ) : error ? (
          <div className="exercise-message" role="alert">
            <h1>Workout unavailable</h1>
            <p>{error}</p>
          </div>
        ) : session ? (
          <>
            <p className="eyebrow">{session.status.replaceAll("_", " ")}</p>
            <h1>{session.planNameSnapshot}</h1>
            <p className="history-detail-label">{session.dayLabelSnapshot}</p>
            <div className="history-summary">
              <div><span>Started</span><strong>{new Date(session.startedAt).toLocaleString()}</strong></div>
              {session.completedAt ? <div><span>Completed</span><strong>{new Date(session.completedAt).toLocaleString()}</strong></div> : null}
              {session.durationMinutes !== undefined ? <div><span>Duration</span><strong>{durationLabel(session.durationMinutes)}</strong></div> : null}
            </div>
            <div className="history-exercises">
              {session.exercises.map((exercise) => (
                <article className="history-exercise" key={exercise.id}>
                  <h2>{exercise.nameSnapshot}</h2>
                  <div className="history-set-table">
                    {exercise.sets.map((set) => (
                      <div className="history-set-row" key={set.id}>
                        <strong>Set {set.position + 1}</strong>
                        {exercise.trackingType === "duration"
                          ? <span>{set.durationSec ?? "—"} sec</span>
                          : <span>{set.reps ?? "—"} reps</span>}
                        {exercise.trackingType === "reps_weight"
                          ? <span>{set.weightKg ?? "—"} kg</span>
                          : null}
                        <span className={set.completed ? "history-complete" : "history-incomplete"}>
                          {set.completed ? "Completed" : "Not completed"}
                        </span>
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
