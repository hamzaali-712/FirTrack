import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../");
const DEVELOPMENT_AUTH_HMAC_SECRET =
  "fittrack-development-only-hmac-secret-not-for-production";

export function loadEnvironment() {
  dotenv.config({ path: resolve(projectRoot, ".env") });
  return getConfig();
}

export function getConfig(env = process.env) {
  const mongoUri = env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required.");
  }
  if (!/^mongodb(?:\+srv)?:\/\//.test(mongoUri)) {
    throw new Error("MONGODB_URI must be a MongoDB connection URI.");
  }

  const port = Number(env.PORT ?? 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  const nodeEnv = env.NODE_ENV ?? "development";
  const appOrigin = env.APP_ORIGIN ?? "http://localhost:5173";
  try {
    const originUrl = new URL(appOrigin);
    if (
      !["http:", "https:"].includes(originUrl.protocol) ||
      originUrl.origin !== appOrigin
    ) {
      throw new Error();
    }
  } catch {
    throw new Error("APP_ORIGIN must be an HTTP(S) origin without a path.");
  }
  if (nodeEnv === "production" && !appOrigin.startsWith("https://")) {
    throw new Error("APP_ORIGIN must use HTTPS in production.");
  }

  const authHmacSecret = env.AUTH_HMAC_SECRET?.trim();
  const isPlaceholderSecret =
    authHmacSecret === DEVELOPMENT_AUTH_HMAC_SECRET ||
    authHmacSecret === "replace-with-at-least-32-random-characters";
  if (
    nodeEnv === "production" &&
    (!authHmacSecret || authHmacSecret.length < 32 || isPlaceholderSecret)
  ) {
    throw new Error(
      "AUTH_HMAC_SECRET must be a non-placeholder value of at least 32 characters in production.",
    );
  }

  const trustProxyHops = Number(env.TRUST_PROXY_HOPS ?? 0);
  if (
    !Number.isInteger(trustProxyHops) ||
    trustProxyHops < 0 ||
    trustProxyHops > 10
  ) {
    throw new Error("TRUST_PROXY_HOPS must be an integer between 0 and 10.");
  }

  const allowedOrigins = new Set([appOrigin]);
  if (nodeEnv !== "production") {
    const localOrigins = {
      "http://localhost:5173": "http://127.0.0.1:5173",
      "http://127.0.0.1:5173": "http://localhost:5173",
    };
    const localAlias = localOrigins[appOrigin];
    if (localAlias) {
      allowedOrigins.add(localAlias);
    }
  }

  return {
    allowedOrigins: [...allowedOrigins],
    appOrigin,
    authHmacSecret: authHmacSecret || DEVELOPMENT_AUTH_HMAC_SECRET,
    mongoUri,
    nodeEnv,
    port,
    trustProxyHops,
  };
}
