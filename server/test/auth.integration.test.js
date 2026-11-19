import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { after, afterEach, before, test } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { AuthRateLimit } from "../src/models/AuthRateLimit.js";
import { AuthSession } from "../src/models/AuthSession.js";
import { User } from "../src/models/User.js";
import { enforceAuthRateLimit } from "../src/auth/rateLimit.js";
import { connectDatabase } from "../src/db/connect.js";

const config = {
  allowedOrigins: ["http://localhost:5173"],
  authHmacSecret: "fittrack-auth-integration-test-secret",
  nodeEnv: "test",
  trustProxyHops: 1,
};
const appOrigin = config.allowedOrigins[0];
let replicaSet;
let server;
let baseUrl;
let userCounter = 0;

before(async () => {
  replicaSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  await connectDatabase(replicaSet.getUri("fittrack_auth_test"));
  await Promise.all([User.init(), AuthSession.init(), AuthRateLimit.init()]);
  server = createApp({ config, isDatabaseReady: () => true }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (replicaSet) await replicaSet.stop();
});

afterEach(async () => {
  await AuthRateLimit.deleteMany({});
});

async function request(path, { method = "GET", cookie, csrf, body, origin = appOrigin } = {}) {
  const headers = {};
  if (origin) headers.origin = origin;
  headers["x-forwarded-for"] = "198.51.100.42";
  if (cookie) headers.cookie = cookie;
  if (csrf) headers["x-csrf-token"] = csrf;
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = response.status === 204 ? "" : await response.text();
  return {
    cookie: response.headers.get("set-cookie")?.split(";")[0] ?? cookie ?? null,
    data: text ? JSON.parse(text) : null,
    response,
  };
}

async function bootstrap() {
  const result = await request("/auth/csrf");
  assert.equal(result.response.status, 200);
  assert.ok(result.cookie?.startsWith("fittrack.sid="));
  return { cookie: result.cookie, csrf: result.data.data.csrfToken };
}

async function registerAccount() {
  userCounter += 1;
  const credentials = {
    name: `Test User ${userCounter}`,
    email: `test-${userCounter}@example.test`,
    password: "AsecurePassword123!",
  };
  const preAuth = await bootstrap();
  const registered = await request("/auth/register", {
    method: "POST",
    cookie: preAuth.cookie,
    csrf: preAuth.csrf,
    body: credentials,
  });
  assert.equal(registered.response.status, 201);
  return { cookie: registered.cookie, credentials, user: registered.data.data.user };
}

test("registration rotates the pre-auth session and returns no credential material", async () => {
  const preAuth = await bootstrap();
  const credentials = {
    name: "Avery Runner",
    email: "  Avery@Example.test ",
    password: "AsecurePassword123!",
  };
  const registered = await request("/auth/register", {
    method: "POST",
    cookie: preAuth.cookie,
    csrf: preAuth.csrf,
    body: credentials,
  });

  assert.equal(registered.response.status, 201);
  assert.notEqual(registered.cookie, preAuth.cookie);
  assert.match(registered.response.headers.get("set-cookie"), /HttpOnly/i);
  assert.equal(registered.data.data.user.email, "avery@example.test");
  assert.equal("passwordHash" in registered.data.data.user, false);
  assert.equal("password" in registered.data.data.user, false);

  const profile = await request("/profile", { cookie: registered.cookie });
  assert.equal(profile.response.status, 200);
  assert.equal(profile.data.data.name, credentials.name);
  const oldSession = await request("/profile", { cookie: preAuth.cookie });
  assert.equal(oldSession.response.status, 401);
});

test("login errors are generic, duplicate email is normalized, and login rotates session", async () => {
  const first = await bootstrap();
  const credentials = {
    name: "Duplicate User",
    email: "same@example.test",
    password: "AsecurePassword123!",
  };
  const created = await request("/auth/register", {
    method: "POST",
    cookie: first.cookie,
    csrf: first.csrf,
    body: credentials,
  });
  assert.equal(created.response.status, 201);

  const duplicateBootstrap = await bootstrap();
  const duplicate = await request("/auth/register", {
    method: "POST",
    cookie: duplicateBootstrap.cookie,
    csrf: duplicateBootstrap.csrf,
    body: { ...credentials, email: " SAME@example.test " },
  });
  assert.equal(duplicate.response.status, 409);
  assert.equal(duplicate.data.error.code, "EMAIL_ALREADY_REGISTERED");

  const wrongPassword = await bootstrap();
  const badPassword = await request("/auth/login", {
    method: "POST",
    cookie: wrongPassword.cookie,
    csrf: wrongPassword.csrf,
    body: { email: credentials.email, password: "IncorrectPassword123!" },
  });
  const unknownAccount = await bootstrap();
  const badEmail = await request("/auth/login", {
    method: "POST",
    cookie: unknownAccount.cookie,
    csrf: unknownAccount.csrf,
    body: { email: "missing@example.test", password: "IncorrectPassword123!" },
  });
  assert.equal(badPassword.response.status, 401);
  assert.equal(badEmail.response.status, 401);
  assert.equal(badPassword.data.error.code, badEmail.data.error.code);
  assert.equal(badPassword.data.error.message, badEmail.data.error.message);

  const loginBootstrap = await bootstrap();
  const login = await request("/auth/login", {
    method: "POST",
    cookie: loginBootstrap.cookie,
    csrf: loginBootstrap.csrf,
    body: { email: credentials.email, password: credentials.password },
  });
  assert.equal(login.response.status, 200);
  assert.notEqual(login.cookie, loginBootstrap.cookie);
  assert.equal((await request("/auth/session", { cookie: login.cookie })).response.status, 200);
  assert.equal(
    (await request("/auth/session", { cookie: loginBootstrap.cookie })).response.status,
    401,
  );
});

test("profile updates are allowlisted and reject invalid values without changing saved data", async () => {
  const account = await registerAccount();
  const token = await request("/auth/csrf", { cookie: account.cookie });
  const updated = await request("/profile", {
    method: "PATCH",
    cookie: account.cookie,
    csrf: token.data.data.csrfToken,
    body: {
      name: "Updated User",
      primaryGoal: "strength",
      equipmentPreferences: ["barbell", "dumbbells"],
      age: null,
    },
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.data.data.primaryGoal, "strength");
  assert.deepEqual(updated.data.data.equipmentPreferences, ["barbell", "dumbbells"]);
  assert.equal(updated.data.data.age, null);

  const invalid = await request("/profile", {
    method: "PATCH",
    cookie: account.cookie,
    csrf: token.data.data.csrfToken,
    body: { age: 100.5, role: "admin" },
  });
  assert.equal(invalid.response.status, 422);
  assert.equal((await request("/profile", { cookie: account.cookie })).data.data.name, "Updated User");

  const invalidAge = await request("/profile", {
    method: "PATCH",
    cookie: account.cookie,
    csrf: token.data.data.csrfToken,
    body: { age: 100.5 },
  });
  assert.equal(invalidAge.response.status, 422);
  assert.equal(invalidAge.data.error.fieldErrors[0].field, "age");
});

test("cross-origin or missing CSRF tokens cannot mutate profile data", async () => {
  const account = await registerAccount();
  const token = await request("/auth/csrf", { cookie: account.cookie });
  const crossOrigin = await request("/profile", {
    method: "PATCH",
    cookie: account.cookie,
    csrf: token.data.data.csrfToken,
    body: { name: "Attacker Edit" },
    origin: "https://not-allowed.example",
  });
  const missingToken = await request("/profile", {
    method: "PATCH",
    cookie: account.cookie,
    body: { name: "Attacker Edit" },
  });
  assert.equal(crossOrigin.response.status, 403);
  assert.equal(missingToken.response.status, 403);
  assert.notEqual((await request("/profile", { cookie: account.cookie })).data.data.name, "Attacker Edit");
});

test("logout revokes the server session and clears the cookie", async () => {
  const account = await registerAccount();
  const token = await request("/auth/csrf", { cookie: account.cookie });
  const logout = await request("/auth/logout", {
    method: "POST",
    cookie: account.cookie,
    csrf: token.data.data.csrfToken,
  });
  assert.equal(logout.response.status, 204);
  assert.match(logout.response.headers.get("set-cookie"), /Max-Age=0/);
  assert.equal((await request("/profile", { cookie: account.cookie })).response.status, 401);
});

test("session expiry is enforced synchronously and shared rate limits return retry timing", async () => {
  const account = await registerAccount();
  const token = account.cookie.slice("fittrack.sid=".length);
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await AuthSession.updateOne(
    { tokenHash },
    { $set: { expiresAt: new Date(Date.now() - 1000) } },
  );
  assert.equal((await request("/profile", { cookie: account.cookie })).response.status, 401);

  const rateLimitArgs = {
    config,
    ip: "192.0.2.88",
    kind: "register",
  };
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await enforceAuthRateLimit(rateLimitArgs);
  }
  await assert.rejects(
    enforceAuthRateLimit(rateLimitArgs),
    (error) => error.status === 429 && error.retryAfter > 0,
  );
});

test("registration rate limit returns 429 with Retry-After before password hashing", async () => {
  const ip = "198.51.100.42";
  const windowMs = 60 * 60 * 1000;
  const currentBucket = Math.floor(Date.now() / windowMs);
  await AuthRateLimit.create(
    [currentBucket, currentBucket + 1].map((bucket) => ({
      keyHash: createHmac("sha256", config.authHmacSecret)
        .update(`register-ip:${ip}:${bucket}`)
        .digest("hex"),
      count: 5,
      expiresAt: new Date((bucket + 1) * windowMs),
    })),
  );

  const preAuth = await bootstrap();
  const limited = await request("/auth/register", {
    method: "POST",
    cookie: preAuth.cookie,
    csrf: preAuth.csrf,
    body: {
      name: "Rate Limit User",
      email: "rate-limit@example.test",
      password: "AsecurePassword123!",
    },
  });
  assert.equal(limited.response.status, 429);
  assert.ok(Number(limited.response.headers.get("retry-after")) > 0);
  assert.equal(limited.data.error.code, "RATE_LIMITED");
});
