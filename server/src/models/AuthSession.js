import mongoose from "mongoose";

const authSessionSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    csrfTokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

authSessionSchema.index({ tokenHash: 1, revokedAt: 1, expiresAt: 1 });

export const AuthSession =
  mongoose.models.AuthSession ?? mongoose.model("AuthSession", authSessionSchema);
