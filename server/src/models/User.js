import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    emailNormalized: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      unique: true,
    },
    passwordHash: { type: String, required: true, select: false },
    primaryGoal: {
      type: String,
      enum: [
        "muscle_gain",
        "strength",
        "fat_loss",
        "endurance",
        "general_fitness",
      ],
      default: "general_fitness",
    },
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    equipmentPreferences: {
      type: [
        {
          type: String,
          enum: ["bodyweight", "dumbbells", "barbell", "machine", "cable", "other"],
        },
      ],
      default: [],
    },
    age: { type: Number, min: 16, max: 100, default: null },
    heightCm: { type: Number, min: 80, max: 250, default: null },
    currentWeightKg: { type: Number, min: 20, max: 350, default: null },
  },
  { timestamps: true, versionKey: false },
);

export const User = mongoose.models.User ?? mongoose.model("User", userSchema);
