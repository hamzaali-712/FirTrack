import mongoose from "mongoose";

export const EXERCISE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "legs_glutes",
  "core",
  "cardio",
];
export const EXERCISE_EQUIPMENT = [
  "bodyweight",
  "dumbbells",
  "barbell",
  "machine",
  "cable",
  "other",
];
export const EXERCISE_DIFFICULTIES = ["beginner", "intermediate", "advanced"];
export const EXERCISE_TRACKING_TYPES = ["reps_weight", "reps_only", "duration"];
export const EXERCISE_GOALS = [
  "muscle_gain",
  "strength",
  "fat_loss",
  "endurance",
  "general_fitness",
];

const animationSchema = new mongoose.Schema(
  {
    format: { type: String, enum: ["glb"], required: true },
    assetUrl: { type: String, required: true },
    posterUrl: { type: String, default: null },
    clipName: { type: String, required: true },
    modelRigId: { type: String, required: true },
    primaryMuscleRegions: [{ type: String, enum: EXERCISE_GROUPS }],
    reviewRef: { type: String, required: true },
  },
  { _id: false, strict: "throw" },
);

const exerciseSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      maxlength: 100,
    },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    primaryMuscleGroup: { type: String, enum: EXERCISE_GROUPS, required: true },
    secondaryMuscleGroups: [{ type: String, enum: EXERCISE_GROUPS }],
    equipment: {
      type: [{ type: String, enum: EXERCISE_EQUIPMENT }],
      required: true,
      validate: (values) => values.length > 0 && new Set(values).size === values.length,
    },
    difficulty: { type: String, enum: EXERCISE_DIFFICULTIES, required: true },
    trackingType: { type: String, enum: EXERCISE_TRACKING_TYPES, required: true },
    instructions: {
      type: [{ type: String, trim: true, minlength: 8, maxlength: 280 }],
      required: true,
      validate: (values) => values.length >= 2 && values.length <= 8,
    },
    safetyNotes: {
      type: [{ type: String, trim: true, minlength: 8, maxlength: 280 }],
      default: [],
    },
    goalTags: {
      type: [{ type: String, enum: EXERCISE_GOALS }],
      default: [],
      validate: (values) => new Set(values).size === values.length,
    },
    imageUrl: {
      type: String,
      default: null,
      validate: (value) =>
        value === null ||
        (typeof value === "string" &&
          /^\/assets\/exercises\/[A-Za-z0-9._/-]+$/.test(value) &&
          !value.includes("..")),
    },
    animation: { type: animationSchema, default: null },
    animationStatus: {
      type: String,
      enum: ["missing", "pending", "verified"],
      default: "missing",
      select: false,
    },
    contentReviewStatus: {
      type: String,
      enum: ["draft", "reviewed"],
      default: "draft",
      select: false,
    },
    isActive: { type: Boolean, default: true, required: true },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

exerciseSchema.index(
  { isActive: 1, primaryMuscleGroup: 1, name: 1, _id: 1 },
  { name: "active_exercises_by_group" },
);
exerciseSchema.index(
  { isActive: 1, equipment: 1, name: 1, _id: 1 },
  { name: "active_exercises_by_equipment" },
);
exerciseSchema.index(
  { isActive: 1, difficulty: 1, name: 1, _id: 1 },
  { name: "active_exercises_by_difficulty" },
);

export const Exercise =
  mongoose.models.Exercise ?? mongoose.model("Exercise", exerciseSchema);
