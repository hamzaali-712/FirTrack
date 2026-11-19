import mongoose from "mongoose";

const performedSetSchema = new mongoose.Schema(
  {
    position: { type: Number, required: true, min: 0, max: 11 },
    reps: { type: Number, default: null, min: 0, max: 100 },
    weightKg: { type: Number, default: null, min: 0, max: 500 },
    durationSec: { type: Number, default: null, min: 0, max: 7200 },
    completed: { type: Boolean, required: true, default: false },
  },
  { _id: true, strict: "throw" },
);

const snapshotExerciseSchema = new mongoose.Schema(
  {
    exerciseId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Exercise" },
    nameSnapshot: { type: String, required: true, trim: true, maxlength: 100 },
    trackingType: {
      type: String,
      required: true,
      enum: ["reps_weight", "reps_only", "duration"],
    },
    position: { type: Number, required: true, min: 0, max: 19 },
    targetSets: { type: Number, required: true, min: 1, max: 12 },
    targetReps: { type: Number, default: null, min: 1, max: 100 },
    targetDurationSec: { type: Number, default: null, min: 1, max: 7200 },
    targetWeightKg: { type: Number, default: null, min: 0, max: 500 },
    sets: { type: [performedSetSchema], default: [] },
  },
  { _id: true, strict: "throw" },
);

const workoutSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User", index: true },
    sourcePlanId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "WorkoutPlan" },
    sourceDayId: { type: mongoose.Schema.Types.ObjectId, required: true },
    planNameSnapshot: { type: String, required: true, trim: true, maxlength: 80 },
    dayLabelSnapshot: { type: String, required: true, trim: true, maxlength: 50 },
    status: {
      type: String,
      required: true,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
    },
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date, default: null },
    abandonedAt: { type: Date, default: null },
    version: { type: Number, required: true, default: 1, min: 1 },
    exercises: { type: [snapshotExerciseSchema], default: [] },
  },
  { timestamps: true, strict: "throw", versionKey: false },
);

workoutSessionSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "in_progress" },
    name: "one_active_workout_per_user",
  },
);
workoutSessionSchema.index(
  { userId: 1, status: 1, completedAt: -1, _id: -1 },
  { name: "owner_session_status_history" },
);
workoutSessionSchema.index(
  { userId: 1, startedAt: -1, _id: -1 },
  { name: "owner_session_start_history" },
);

export const WorkoutSession =
  mongoose.models.WorkoutSession ??
  mongoose.model("WorkoutSession", workoutSessionSchema);
