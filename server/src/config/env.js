import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../");

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

  return {
    appOrigin,
    mongoUri,
    nodeEnv: env.NODE_ENV ?? "development",
    port,
  };
}
