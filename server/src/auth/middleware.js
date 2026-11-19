import { ApiError } from "../errors/ApiError.js";
import { findCurrentSession, requireCsrfOrigin, validateCsrfToken } from "./session.js";

export function createAuthMiddleware(config) {
  async function requireSession(req, _res, next) {
    const session = await findCurrentSession(req);
    if (!session?.userId) {
      throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
    }
    req.authSession = session;
    req.authUserId = session.userId;
    next();
  }

  async function requireCsrf(req, _res, next) {
    requireCsrfOrigin(req, config.allowedOrigins);
    const session = req.authSession ?? (await findCurrentSession(req));
    const token = req.get("x-csrf-token");
    if (!session || !validateCsrfToken(session, token)) {
      throw new ApiError(403, "CSRF_REJECTED", "The CSRF token is missing or invalid.");
    }
    req.authSession = session;
    next();
  }

  return { requireCsrf, requireSession };
}
