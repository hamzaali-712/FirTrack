import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { AuthSession } from "../models/AuthSession.js";
import { ApiError } from "../errors/ApiError.js";
import { enforceCsrfBootstrapRateLimit } from "./rateLimit.js";

export const SESSION_COOKIE = "fittrack.sid";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PRE_AUTH_TTL_MS = 10 * 60 * 1000;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function readCookie(req) {
  const cookieHeader = req.headers.cookie ?? "";
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== SESSION_COOKIE) continue;
    return part.slice(separator + 1).trim();
  }
  return null;
}

function csrfTokenFor(tokenHash, secret) {
  return createHmac("sha256", secret).update(`fittrack-csrf:${tokenHash}`).digest("base64url");
}

function setSessionCookie(res, token, nodeEnv, maxAge) {
  const cookie = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    ...(nodeEnv === "production" ? ["Secure"] : []),
  ].join("; ");
  res.setHeader("Set-Cookie", cookie);
}

export async function findCurrentSession(req) {
  const token = readCookie(req);
  if (!token || !/^[A-Za-z0-9_-]{40,}$/.test(token)) return null;
  return AuthSession.findOne({
    tokenHash: sha256(token),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
}

export async function createSession({ res, userId = null, config, previousSession = null }) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = sha256(token);
  const expiresAt = new Date(
    Date.now() + (userId ? SESSION_TTL_MS : PRE_AUTH_TTL_MS),
  );
  const csrfToken = csrfTokenFor(tokenHash, config.authHmacSecret);

  if (previousSession) {
    previousSession.revokedAt = new Date();
    await previousSession.save();
  }
  const session = await AuthSession.create({
    tokenHash,
    userId,
    csrfTokenHash: sha256(csrfToken),
    expiresAt,
  });

  setSessionCookie(
    res,
    token,
    config.nodeEnv,
    userId ? Math.floor(SESSION_TTL_MS / 1000) : Math.floor(PRE_AUTH_TTL_MS / 1000),
  );
  return { session, csrfToken };
}

export async function ensureCsrfSession(req, res, config) {
  const existing = await findCurrentSession(req);
  if (existing) {
    const csrfToken = csrfTokenFor(existing.tokenHash, config.authHmacSecret);
    return { session: existing, csrfToken };
  }
  await enforceCsrfBootstrapRateLimit({
    config,
    ip: req.ip || req.socket.remoteAddress || "unknown",
  });
  return createSession({ res, config });
}

export function validateCsrfToken(session, token) {
  if (typeof token !== "string" || token.length > 256) return false;
  const actual = Buffer.from(sha256(token), "hex");
  const expected = Buffer.from(session.csrfTokenHash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function clearSessionCookie(res, nodeEnv) {
  setSessionCookie(res, "", nodeEnv, 0);
}

export function requireCsrfOrigin(req, allowedOrigins) {
  const origin = req.get("origin");
  let requestOrigin;
  if (origin) {
    try {
      const parsed = new URL(origin);
      if (parsed.origin !== origin) throw new Error();
      requestOrigin = parsed.origin;
    } catch {
      throw new ApiError(403, "CSRF_REJECTED", "The request origin is not allowed.");
    }
  } else {
    const referer = req.get("referer");
    try {
      requestOrigin = referer ? new URL(referer).origin : null;
    } catch {
      requestOrigin = null;
    }
  }
  if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
    throw new ApiError(403, "CSRF_REJECTED", "The request origin is not allowed.");
  }
}
