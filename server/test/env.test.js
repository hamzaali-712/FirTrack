import assert from "node:assert/strict";
import test from "node:test";
import { getConfig } from "../src/config/env.js";

test("configuration requires a MongoDB URI", () => {
  assert.throws(() => getConfig({}), /MONGODB_URI is required/);
});

test("configuration validates MongoDB URI and server port", () => {
  assert.throws(
    () => getConfig({ MONGODB_URI: "https://example.test" }),
    /must be a MongoDB connection URI/,
  );
  assert.throws(
    () => getConfig({ MONGODB_URI: "mongodb://localhost/db", PORT: "70000" }),
    /PORT must be an integer/,
  );
  assert.throws(
    () =>
      getConfig({
        MONGODB_URI: "mongodb://localhost/db",
        APP_ORIGIN: "https://example.test/path",
      }),
    /APP_ORIGIN must be an HTTP\(S\) origin/,
  );
});

test("configuration accepts the local development settings", () => {
  assert.deepEqual(
    getConfig({
      MONGODB_URI: "mongodb://127.0.0.1:27017/fittrack",
      PORT: "5000",
      APP_ORIGIN: "http://localhost:5173",
    }),
    {
      appOrigin: "http://localhost:5173",
      mongoUri: "mongodb://127.0.0.1:27017/fittrack",
      nodeEnv: "development",
      port: 5000,
    },
  );
});
