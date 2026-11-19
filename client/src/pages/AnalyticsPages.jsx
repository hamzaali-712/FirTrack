import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
        <Link aria-current={active === "dashboard" ? "page" : undefined} to="/dashboard">Dashboard</Link>
        <Link aria-current={active === "progress" ? "page" : undefined} to="/progress">Progress</Link>
        <Link to="/exercises">Exercise library</Link>
        <Link to="/plans">Plans</Link>
        <Link to="/history">History</Link>
        <span className="application-user">{user.name}</span>
        <button className="button button-secondary" onClick={handleSignOut} type="button">Sign out</button>
      </nav>
    </header>
  );
}

function StatCard({ label, value, detail }) {
  return (
    <article className="analytics-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <p>{detail}</p> : null}
    </article>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    apiRequest("/dashboard/summary", { signal: controller.signal })
      .then(setData)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "We could not load your dashboard.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="application-page">
      <ApplicationHeader active="dashboard" />
      <section className="library-content analytics-content">
        <p className="eyebrow">Personal overview</p>
        <h1>Welcome, {user.name}</h1>
        {loading ? (
          <p aria-live="polite" className="account-status">Loading dashboard…</p>
        ) : error ? (
          <p className="account-error" role="alert">{error}</p>
        ) : data ? (
          <>
            <div className="analytics-primary-actions">
              <Link className="button button-primary" to="/exercises">Explore exercises</Link>
              <Link className="button button-secondary" to="/plans">Build or open plans</Link>
              {data.activeSessionId
                ? <Link className="button button-secondary" to={`/workout/${data.activeSessionId}`}>Resume active workout</Link>
                : <Link className="button button-secondary" to="/plans">Start from a plan</Link>}
            </div>
            <div className="analytics-stats">
              <StatCard detail="Completed workouts only" label="This week" value={data.completedWorkoutsThisWeek} />
              <StatCard detail="Performed completed sets" label="Sets" value={data.completedSetsThisWeek} />
              <StatCard detail="Server-derived completed duration" label="Training time" value={`${data.totalDurationMinutesThisWeek} min`} />
            </div>
            <section className="analytics-panel" aria-labelledby="recent-workouts-title">
              <div className="analytics-panel-heading">
                <div>
                  <p className="eyebrow">Latest activity</p>
                  <h2 id="recent-workouts-title">Recent workouts</h2>
                </div>
                <Link className="text-link" to="/history">View history</Link>
              </div>
              {data.recentWorkouts.length ? (
                <div className="analytics-recent-list">
                  {data.recentWorkouts.map((session) => (
                    <article key={session.id}>
                      <div>
                        <strong>{session.dayLabelSnapshot}</strong>
                        <span>{new Date(session.completedAt).toLocaleString()}</span>
                      </div>
                      <Link className="button button-secondary" to={`/history/${session.id}`}>View</Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="analytics-empty">
                  <h3>No completed workouts yet</h3>
                  <p>Complete a workout to populate this dashboard.</p>
                </div>
              )}
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

export function ProgressPage() {
  const [weeks, setWeeks] = useState(8);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    apiRequest(`/progress/summary?weeks=${weeks}`, { signal: controller.signal })
      .then(setData)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "We could not load progress.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [weeks, reloadKey]);

  const maxWorkouts = data
    ? Math.max(1, ...data.workoutsByWeek.map((week) => week.completedWorkouts))
    : 1;

  return (
    <main className="application-page">
      <ApplicationHeader active="progress" />
      <section className="library-content analytics-content">
        <p className="eyebrow">Completed workout trends</p>
        <h1>Progress</h1>
        <label className="analytics-range" htmlFor="progress-weeks">
          Time range
          <select
            id="progress-weeks"
            onChange={(event) => setWeeks(Number(event.target.value))}
            value={weeks}
          >
            {[4, 8, 12, 26].map((option) => (
              <option key={option} value={option}>{option} weeks</option>
            ))}
          </select>
        </label>
        {loading ? (
          <p aria-live="polite" className="account-status">Loading progress…</p>
        ) : error ? (
          <div className="exercise-message" role="alert">
            <p>{error}</p>
            <button className="button button-secondary" onClick={() => setReloadKey((value) => value + 1)} type="button">Retry</button>
          </div>
        ) : data ? (
          <>
            <div className="analytics-stats progress-stats">
              <StatCard label="Completed workouts" value={data.totalCompletedWorkouts} />
              <StatCard label="Completed sets" value={data.totalCompletedSets} />
              <StatCard detail="Reps × external kilograms; no duration or reps-only volume" label="External-load volume" value={`${data.totalVolumeKg} kg·reps`} />
            </div>
            {data.workoutsByWeek.some((week) => week.completedWorkouts > 0) ? (
              <section className="analytics-panel" aria-labelledby="weekly-chart-title">
                <div className="analytics-panel-heading">
                  <div>
                    <p className="eyebrow">Weekly consistency</p>
                    <h2 id="weekly-chart-title">Completed workouts by Monday week</h2>
                  </div>
                </div>
                <div aria-label="Weekly completed workout bar chart" className="analytics-chart" role="img">
                  {data.workoutsByWeek.map((week) => (
                    <div className="analytics-bar-column" key={week.weekStartLocal}>
                      <span aria-hidden="true">{week.completedWorkouts}</span>
                      <div
                        aria-hidden="true"
                        className="analytics-bar"
                        style={{ height: `${Math.max(8, (week.completedWorkouts / maxWorkouts) * 100)}%` }}
                      />
                      <small>{week.weekStartLocal.slice(5)}</small>
                    </div>
                  ))}
                </div>
                <details className="analytics-table-details">
                  <summary>View data table</summary>
                  <table>
                    <thead>
                      <tr><th scope="col">Monday week</th><th scope="col">Completed workouts</th></tr>
                    </thead>
                    <tbody>
                      {data.workoutsByWeek.map((week) => (
                        <tr key={week.weekStartLocal}>
                          <td>{week.weekStartLocal}</td>
                          <td>{week.completedWorkouts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </section>
            ) : (
              <div className="exercise-empty">
                <h2>No completed workouts in this range</h2>
                <p>The chart has no fabricated data points. Complete a workout to begin your trend.</p>
                <Link className="button button-primary" to="/plans">View plans</Link>
              </div>
            )}
          </>
        ) : null}
      </section>
    </main>
  );
}
