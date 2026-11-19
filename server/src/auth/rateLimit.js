import { createHmac } from "node:crypto";
import { AuthRateLimit } from "../models/AuthRateLimit.js";
import { ApiError } from "../errors/ApiError.js";

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

async function consumeWindow({ config, scope, identifier, now, windowMs, limit }) {
  const bucket = Math.floor(now.getTime() / windowMs);
  const keyHash = createHmac("sha256", config.authHmacSecret)
    .update(`${scope}:${identifier}:${bucket}`)
    .digest("hex");
  const expiresAt = new Date((bucket + 1) * windowMs);
  const entry = await AuthRateLimit.findOneAndUpdate(
    { keyHash },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  return {
    allowed: entry.count <= limit,
    retryAfter: Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000)),
  };
}

export async function enforceAuthRateLimit({ config, ip, email, kind }) {
  const now = new Date();
  const rules = {
    register: [{ scope: "register-ip", identifier: ip, windowMs: ONE_HOUR, limit: 5 }],
    "login-ip": [{ scope: "login-ip", identifier: ip, windowMs: FIFTEEN_MINUTES, limit: 30 }],
    "login-email": [
      {
        scope: "login-email-ip",
        identifier: `${ip}:${email}`,
        windowMs: FIFTEEN_MINUTES,
        limit: 8,
      },
    ],
  }[kind];
  if (!rules) throw new Error("Unknown authentication rate-limit kind.");

  for (const rule of rules) {
    const result = await consumeWindow({ config, now, ...rule });
    if (!result.allowed) {
      throw new ApiError(429, "RATE_LIMITED", "Too many authentication attempts. Try again later.", {
        retryAfter: result.retryAfter,
      });
    }
  }
}

export async function enforceCsrfBootstrapRateLimit({ config, ip }) {
  const now = new Date();
  const result = await consumeWindow({
    config,
    scope: "csrf-bootstrap-ip",
    identifier: ip,
    now,
    windowMs: ONE_HOUR,
    limit: 60,
  });
  if (!result.allowed) {
    throw new ApiError(429, "RATE_LIMITED", "Too many authentication attempts. Try again later.", {
      retryAfter: result.retryAfter,
    });
  }
}
