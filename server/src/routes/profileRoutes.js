import { Router } from "express";
import { ApiError } from "../errors/ApiError.js";
import { User } from "../models/User.js";
import { createAuthMiddleware } from "../auth/middleware.js";
import { toSafeUser, validateProfilePatch } from "../auth/validation.js";

export function createProfileRouter(config) {
  const router = Router();
  const { requireCsrf, requireSession } = createAuthMiddleware(config);

  router.get("/", requireSession, async (req, res) => {
    const user = await User.findById(req.authUserId);
    if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ data: toSafeUser(user) });
  });

  router.patch("/", requireSession, requireCsrf, async (req, res) => {
    const updates = validateProfilePatch(req.body);
    const user = await User.findByIdAndUpdate(
      req.authUserId,
      { $set: updates },
      { returnDocument: "after", runValidators: true },
    );
    if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ data: toSafeUser(user) });
  });

  return router;
}
