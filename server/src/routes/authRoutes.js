import { Router } from "express";
import argon2 from "argon2";
import { ApiError } from "../errors/ApiError.js";
import { User } from "../models/User.js";
import { createAuthMiddleware } from "../auth/middleware.js";
import { enforceAuthRateLimit } from "../auth/rateLimit.js";
import {
  clearSessionCookie,
  createSession,
  ensureCsrfSession,
  findCurrentSession,
} from "../auth/session.js";
import { toSafeUser, validateLogin, validateRegistration } from "../auth/validation.js";

function getClientIp(req) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function createAuthRouter(config) {
  const router = Router();
  const { requireCsrf, requireSession } = createAuthMiddleware(config);

  router.get("/csrf", async (req, res) => {
    const { csrfToken } = await ensureCsrfSession(req, res, config);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ data: { csrfToken } });
  });

  router.post("/register", requireCsrf, async (req, res) => {
    if (req.authSession?.userId) {
      throw new ApiError(409, "ALREADY_AUTHENTICATED", "Sign out before creating another account.");
    }
    await enforceAuthRateLimit({
      config,
      ip: getClientIp(req),
      kind: "register",
    });
    const input = validateRegistration(req.body);

    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    let user;
    try {
      user = await User.create({
        name: input.name,
        emailNormalized: input.emailNormalized,
        passwordHash,
      });
    } catch (error) {
      if (error?.code === 11000 && error?.keyPattern?.emailNormalized) {
        throw new ApiError(409, "EMAIL_ALREADY_REGISTERED", "An account already uses this email.");
      }
      throw error;
    }

    await createSession({
      res,
      userId: user._id,
      config,
      previousSession: req.authSession,
    });
    res.setHeader("Cache-Control", "no-store");
    res.status(201).json({ data: { authenticated: true, user: toSafeUser(user) } });
  });

  router.post("/login", requireCsrf, async (req, res) => {
    if (req.authSession?.userId) {
      throw new ApiError(409, "ALREADY_AUTHENTICATED", "You are already signed in.");
    }
    const ip = getClientIp(req);
    await enforceAuthRateLimit({ config, ip, kind: "login-ip" });
    const input = validateLogin(req.body);
    await enforceAuthRateLimit({
      config,
      email: input.emailNormalized,
      ip,
      kind: "login-email",
    });

    const user = await User.findOne({ emailNormalized: input.emailNormalized }).select("+passwordHash");
    if (!user) {
      await argon2.hash(input.password, { type: argon2.argon2id });
      throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }
    const passwordMatches = await argon2.verify(user.passwordHash, input.password);
    if (!passwordMatches) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }

    const previousSession = req.authSession ?? (await findCurrentSession(req));
    await createSession({ res, userId: user._id, config, previousSession });
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      data: { authenticated: true, user: toSafeUser(user) },
    });
  });

  router.post("/logout", requireSession, requireCsrf, async (req, res) => {
    req.authSession.revokedAt = new Date();
    await req.authSession.save();
    clearSessionCookie(res, config.nodeEnv);
    res.setHeader("Cache-Control", "no-store");
    res.status(204).end();
  });

  router.get("/session", requireSession, async (req, res) => {
    const user = await User.findById(req.authUserId);
    if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({
      data: {
        authenticated: true,
        user: toSafeUser(user),
        expiresAt: req.authSession.expiresAt,
      },
    });
  });

  return router;
}
