import { randomUUID } from "node:crypto";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";

export function createApp({
  isDatabaseReady = () => mongoose.connection.readyState === 1,
} = {}) {
  const app = express();

  app.disable("x-powered-by");
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
    const isPayloadTooLarge = error.type === "entity.too.large";
    const status = isMalformedJson ? 400 : isPayloadTooLarge ? 413 : 500;
    const code = isMalformedJson
      ? "BAD_JSON"
      : isPayloadTooLarge
        ? "PAYLOAD_TOO_LARGE"
        : "INTERNAL_ERROR";

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
            : "An unexpected error occurred.",
        requestId: res.locals.requestId,
      },
    });
  });

  return app;
}
