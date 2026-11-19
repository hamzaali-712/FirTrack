import mongoose from "mongoose";

const idempotencyRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    method: { type: String, required: true, enum: ["POST"] },
    routeKey: { type: String, required: true, enum: ["plans", "sessions"] },
    key: { type: String, required: true, match: /^[a-f\d]{8}-[a-f\d]{4}-[1-5][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i },
    payloadHash: { type: String, required: true, match: /^[a-f\d]{64}$/ },
    statusCode: { type: Number, required: true },
    responseBody: { type: mongoose.Schema.Types.Mixed, required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, strict: "throw", versionKey: false },
);

idempotencyRecordSchema.index(
  { userId: 1, method: 1, routeKey: 1, key: 1 },
  { unique: true, name: "scoped_idempotency_key" },
);
idempotencyRecordSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "idempotency_ttl" },
);

export const IdempotencyRecord =
  mongoose.models.IdempotencyRecord ??
  mongoose.model("IdempotencyRecord", idempotencyRecordSchema);
