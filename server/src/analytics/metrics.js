export function completedSetCount(session) {
  if (session.status !== "completed") return 0;
  return session.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.reduce(
        (setTotal, set) => setTotal + (set.completed === true ? 1 : 0),
        0,
      ),
    0,
  );
}

export function externalLoadVolume(session) {
  if (session.status !== "completed") return 0;
  let volume = 0;
  for (const exercise of session.exercises) {
    if (exercise.trackingType !== "reps_weight") continue;
    for (const set of exercise.sets) {
      if (
        set.completed === true &&
        Number.isInteger(set.reps) &&
        set.reps >= 1 &&
        set.reps <= 100 &&
        typeof set.weightKg === "number" &&
        Number.isFinite(set.weightKg) &&
        set.weightKg >= 0 &&
        set.weightKg <= 500
      ) {
        volume += set.reps * set.weightKg;
      }
    }
  }
  return volume;
}

export function completedDurationMinutes(session) {
  if (
    session.status !== "completed" ||
    !(session.completedAt instanceof Date) ||
    !(session.startedAt instanceof Date)
  ) {
    return 0;
  }
  const milliseconds = session.completedAt.getTime() - session.startedAt.getTime();
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return null;
  return Math.max(0, Math.round(milliseconds / 60000));
}
