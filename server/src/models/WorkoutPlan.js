import mongoose from "mongoose";
import { EXERCISE_TRACKING_TYPES } from "./Exercise.js";

const planExerciseSchema = new mongoose.Schema(
  {
    exerciseId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Exercise" },
    position: { type: Number, required: true, min: 0, max: 19 },
    targetSets: { type: Number, required: true, min: 1, max: 12 },
    targetReps: { type: Number, default: null, min: 1, max: 100 },
    targetDurationSec: { type: Number, default: null, min: 1, max: 7200 },
    targetWeightKg: { type: Number, default: null, min: 0, max: 500 },
  },
  { _id: true, strict: "throw" },
);

const planDaySchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, minlength: 1, maxlength: 50 },
    weekday: { type: Number, default: null, min: 0, max: 6 },
    exercises: { type: [planExerciseSchema], default: [] },
  },
  { _id: true, strict: "throw" },
);

const workoutPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User", index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    days: { type: [planDaySchema], required: true, default: [] },
    version: { type: Number, required: true, default: 1, min: 1 },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true, strict: "throw", versionKey: false },
);

workoutPlanSchema.index(
  { userId: 1, archivedAt: 1, updatedAt: -1, _id: 1 },
  { name: "owned_active_plans" },
);

export { EXERCISE_TRACKING_TYPES };
export const WorkoutPlan =
  mongoose.models.WorkoutPlan ?? mongoose.model("WorkoutPlan", workoutPlanSchema);
