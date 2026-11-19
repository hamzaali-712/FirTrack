import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../auth/api.js";
import { useAuth } from "../auth/AuthContext.jsx";

const muscleGroups = [
  ["chest", "Chest"],
  ["back", "Back"],
  ["shoulders", "Shoulders"],
  ["biceps", "Biceps"],
  ["triceps", "Triceps"],
  ["legs_glutes", "Legs & glutes"],
  ["core", "Core"],
  ["cardio", "Cardio"],
];
const equipmentOptions = [
  ["bodyweight", "Bodyweight"],
  ["dumbbells", "Dumbbells"],
  ["barbell", "Barbell"],
  ["machine", "Machine"],
  ["cable", "Cable"],
  ["other", "Other"],
];
const difficultyOptions = [
  ["beginner", "Beginner"],
  ["intermediate", "Intermediate"],
  ["advanced", "Advanced"],
];
const goalLabels = {
  muscle_gain: "Muscle gain",
  strength: "Strength",
  fat_loss: "Fat loss",
  endurance: "Endurance",
  general_fitness: "General fitness",
};
const equipmentLabels = Object.fromEntries(equipmentOptions);
const groupLabels = Object.fromEntries(muscleGroups);

function ApplicationHeader({ active = "" }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");

  async function handleSignOut() {
    setLogoutError("");
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
        <Link aria-current={active === "profile" ? "page" : undefined} to="/profile">
          Profile
        </Link>
        <span className="application-user">{user.name}</span>
        <button className="button button-secondary" onClick={handleSignOut} type="button">
          Sign out
        </button>
      </nav>
      {logoutError ? <p className="account-error" role="alert">{logoutError}</p> : null}
    </header>
  );
}

function ExerciseCard({ exercise }) {
  return (
    <article className="exercise-card">
      <div aria-hidden="true" className="exercise-card-art">
        {exercise.imageUrl ? (
          <img alt="" loading="lazy" src={exercise.imageUrl} />
        ) : (
          <span className="exercise-placeholder">FT</span>
        )}
      </div>
      <div className="exercise-card-content">
        <div className="exercise-card-meta">
          <span>{groupLabels[exercise.primaryMuscleGroup] ?? exercise.primaryMuscleGroup}</span>
          <span>{exercise.difficulty}</span>
        </div>
        <h2>
          <Link to={`/exercises/${exercise.id}`}>{exercise.name}</Link>
        </h2>
        <p>{exercise.equipment.map((item) => equipmentLabels[item] ?? item).join(" · ")}</p>
        <div className="exercise-card-bottom">
          <span>{exercise.trackingType.replaceAll("_", " ")}</span>
          <span className={exercise.animationAvailable ? "exercise-media-ready" : "exercise-media-missing"}>
            {exercise.animationAvailable ? "Reviewed 3D demo" : "No reviewed 3D demo"}
          </span>
        </div>
      </div>
    </article>
  );
}

export function ExerciseLibraryPage() {
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [goal, setGoal] = useState(user.primaryGoal ?? "");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchText.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    const controller = new AbortController();
    const parameters = new URLSearchParams({ page: String(page), limit: "12" });
    if (search) parameters.set("q", search);
    if (muscleGroup) parameters.set("muscleGroup", muscleGroup);
    if (equipment) parameters.set("equipment", equipment);
    if (difficulty) parameters.set("difficulty", difficulty);
    if (goal) {
      parameters.set("goal", goal);
      parameters.set("sort", "relevance");
    }

    setLoading(true);
    setError("");
    apiRequest(`/exercises?${parameters.toString()}`, { signal: controller.signal })
      .then(setResult)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "We could not load exercises. Please try again.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [difficulty, equipment, goal, muscleGroup, page, reloadKey, search]);

  function updateFilter(setter) {
    return (event) => {
      setter(event.target.value);
      setPage(1);
    };
  }

  function clearFilters() {
    setSearchText("");
    setSearch("");
    setMuscleGroup("");
    setEquipment("");
    setDifficulty("");
    setGoal("");
    setPage(1);
  }

  return (
    <main className="application-page">
      <ApplicationHeader active="exercises" />
      <section aria-labelledby="exercise-library-title" className="library-content">
        <p className="eyebrow">Move with context</p>
        <h1 id="exercise-library-title">Exercise library</h1>
        <p className="section-description">
          Search the curated catalog and open an exercise for instructions and tracking details.
        </p>

        <form className="exercise-filters" onSubmit={(event) => event.preventDefault()}>
          <label className="exercise-search" htmlFor="exercise-search">
            Search by name
            <input
              autoComplete="off"
              id="exercise-search"
              maxLength="100"
              onChange={(event) => updateFilter(setSearchText)(event)}
              placeholder="Try “row” or “press”"
              type="search"
              value={searchText}
            />
          </label>
          <label htmlFor="filter-muscle">
            Muscle group
            <select id="filter-muscle" onChange={updateFilter(setMuscleGroup)} value={muscleGroup}>
              <option value="">All groups</option>
              {muscleGroups.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label htmlFor="filter-equipment">
            Equipment
            <select id="filter-equipment" onChange={updateFilter(setEquipment)} value={equipment}>
              <option value="">All equipment</option>
              {equipmentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label htmlFor="filter-difficulty">
            Difficulty
            <select id="filter-difficulty" onChange={updateFilter(setDifficulty)} value={difficulty}>
              <option value="">All levels</option>
              {difficultyOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label htmlFor="filter-goal">
            Recommendation
            <select id="filter-goal" onChange={updateFilter(setGoal)} value={goal}>
              <option value="">No goal preference</option>
              {Object.entries(goalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button className="button button-secondary filter-clear" onClick={clearFilters} type="button">
            Clear filters
          </button>
        </form>

        {loading ? (
          <p aria-live="polite" className="account-status">Loading exercises…</p>
        ) : error ? (
          <div className="exercise-message" role="alert">
            <p>{error}</p>
            <button className="button button-secondary" onClick={() => setReloadKey((value) => value + 1)} type="button">
              Retry
            </button>
          </div>
        ) : (
          <>
            <p aria-live="polite" className="exercise-result-count">
              {result?.meta.total ?? 0} {result?.meta.total === 1 ? "exercise" : "exercises"}
            </p>
            {result?.data.length ? (
              <div className="exercise-grid">
                {result.data.map((exercise) => <ExerciseCard exercise={exercise} key={exercise.id} />)}
              </div>
            ) : (
              <div className="exercise-empty">
                <h2>No exercises found</h2>
                <p>Try another search or clear the selected filters.</p>
                <button className="button button-secondary" onClick={clearFilters} type="button">
                  Clear filters
                </button>
              </div>
            )}
            {result?.meta.totalPages > 1 ? (
              <nav aria-label="Exercise result pages" className="exercise-pagination">
                <button
                  className="button button-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  type="button"
                >
                  Previous
                </button>
                <span aria-live="polite">Page {page} of {result.meta.totalPages}</span>
                <button
                  className="button button-secondary"
                  disabled={!result.meta.hasNextPage}
                  onClick={() => setPage((value) => value + 1)}
                  type="button"
                >
                  Next
                </button>
              </nav>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}

export function ExerciseDetailPage() {
  const { exerciseId } = useParams();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    apiRequest(`/exercises/${encodeURIComponent(exerciseId)}`, { signal: controller.signal })
      .then(setExercise)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "We could not load this exercise.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [exerciseId]);

  return (
    <main className="application-page">
      <ApplicationHeader active="exercises" />
      <section aria-labelledby="exercise-detail-title" className="exercise-detail-content">
        <Link className="text-link exercise-back-link" to="/exercises">
          <span aria-hidden="true">←</span> Back to exercise library
        </Link>
        {loading ? (
          <p aria-live="polite" className="account-status">Loading exercise…</p>
        ) : error ? (
          <div className="exercise-message" role="alert">
            <h1>Exercise unavailable</h1>
            <p>{error}</p>
            <Link className="button button-secondary" to="/exercises">Return to library</Link>
          </div>
        ) : exercise ? (
          <>
            <p className="eyebrow">
              {groupLabels[exercise.primaryMuscleGroup] ?? exercise.primaryMuscleGroup}
            </p>
            <h1 id="exercise-detail-title">{exercise.name}</h1>
            <div className="exercise-detail-facts">
              <span><strong>Equipment</strong>{exercise.equipment.map((item) => equipmentLabels[item] ?? item).join(", ")}</span>
              <span><strong>Difficulty</strong>{exercise.difficulty}</span>
              <span><strong>Tracking</strong>{exercise.trackingType.replaceAll("_", " ")}</span>
              <span><strong>Secondary groups</strong>{exercise.secondaryMuscleGroups.length
                ? exercise.secondaryMuscleGroups.map((item) => groupLabels[item] ?? item).join(", ")
                : "Not listed"}</span>
            </div>
            <div className="exercise-detail-grid">
              <section aria-labelledby="exercise-instructions-title" className="exercise-detail-panel">
                <h2 id="exercise-instructions-title">Instructions</h2>
                <ol className="exercise-instructions">
                  {exercise.instructions.map((instruction, index) => (
                    <li key={`${index}-${instruction}`}>{instruction}</li>
                  ))}
                </ol>
                {exercise.safetyNotes.length ? (
                  <aside className="exercise-safety-note">
                    <h3>Keep it controlled</h3>
                    <ul>{exercise.safetyNotes.map((note) => <li key={note}>{note}</li>)}</ul>
                  </aside>
                ) : null}
              </section>
              <aside className="exercise-media-panel">
                {exercise.imageUrl ? (
                  <img alt={`${exercise.name} reference`} className="exercise-detail-image" src={exercise.imageUrl} />
                ) : (
                  <div aria-hidden="true" className="exercise-detail-placeholder">FT</div>
                )}
                <h2>{exercise.animation ? "Reviewed demonstration" : "Demonstration unavailable"}</h2>
                <p>
                  {exercise.animation
                    ? "A reviewed animation is available for this exercise."
                    : "No reviewed 3D animation or image is available. The exercise instructions remain available."}
                </p>
              </aside>
            </div>
            <p className="exercise-goal-tags">
              Suggested goals: {exercise.goalTags.map((tag) => goalLabels[tag] ?? tag).join(" · ")}
            </p>
          </>
        ) : null}
      </section>
    </main>
  );
}
