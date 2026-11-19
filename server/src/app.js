import { randomUUID } from "node:crypto";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import { ApiError } from "./errors/ApiError.js";
import { createAuthRouter } from "./routes/authRoutes.js";
import { createProfileRouter } from "./routes/profileRoutes.js";

export function createApp({
  isDatabaseReady = () => mongoose.connection.readyState === 1,
  config = {
    allowedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
    authHmacSecret: "fittrack-test-hmac-secret-long-enough",
    nodeEnv: "test",
    trustProxyHops: 0,
  },
} = {}) {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxyHops);
  app.use((req, res, next) => {
    const requestId = randomUUID();
    res.locals.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    next();
  });
  app.use(helmet());
  app.use(express.json({ limit: "64kb" }));

  app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({
      data: {
        service: "fittrack-api",
        status: "ok",
      },
    });
  });

  app.get("/api/v1/ready", (_req, res) => {
    if (!isDatabaseReady()) {
      return res.status(503).json({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "The database is not connected.",
          requestId: res.locals.requestId,
        },
      });
    }

    return res.status(200).json({ data: { status: "ready" } });
  });

  app.use("/api/v1/auth", createAuthRouter(config));
  app.use("/api/v1/profile", createProfileRouter(config));

  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "The requested resource was not found.",
        requestId: res.locals.requestId,
      },
    });
  });

  app.use((error, _req, res, _next) => {
    const isMalformedJson = error instanceof SyntaxError && "body" in error;
    const isPayloadTooLarge = error?.type === "entity.too.large";
    const apiError = error instanceof ApiError;
    const status = isMalformedJson
      ? 400
      : isPayloadTooLarge
        ? 413
        : apiError
          ? error.status
          : 500;
    const code = isMalformedJson
      ? "BAD_JSON"
      : isPayloadTooLarge
        ? "PAYLOAD_TOO_LARGE"
        : apiError
          ? error.code
          : "INTERNAL_ERROR";

    if (error.retryAfter) {
      res.setHeader("Retry-After", String(error.retryAfter));
    }

    if (status === 500) {
      console.error("Unhandled API error.", {
        name: error.name,
        requestId: res.locals.requestId,
      });
    }

    res.status(status).json({
      error: {
        code,
        message: isMalformedJson
          ? "The request body contains invalid JSON."
          : isPayloadTooLarge
            ? "The request body exceeds the allowed size."
            : apiError
              ? error.message
              : "An unexpected error occurred.",
        ...(apiError && error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
        requestId: res.locals.requestId,
      },
    });
  });

  return app;
}
