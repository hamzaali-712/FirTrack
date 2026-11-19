import mongoose from "mongoose";

const authRateLimitSchema = new mongoose.Schema(
  {
    keyHash: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { versionKey: false },
);

export const AuthRateLimit =
  mongoose.models.AuthRateLimit ?? mongoose.model("AuthRateLimit", authRateLimitSchema);
