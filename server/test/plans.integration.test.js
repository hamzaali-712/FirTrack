import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { after, before, test } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { seedExerciseCatalog } from "../src/catalog/exerciseSeed.js";
import { connectDatabase } from "../src/db/connect.js";
import { AuthSession } from "../src/models/AuthSession.js";
import { Exercise } from "../src/models/Exercise.js";
import { IdempotencyRecord } from "../src/models/IdempotencyRecord.js";
import { User } from "../src/models/User.js";
import { WorkoutPlan } from "../src/models/WorkoutPlan.js";

const config = {
  allowedOrigins: ["http://localhost:5173"],
  authHmacSecret: "fittrack-plan-test-secret-long-enough",
  nodeEnv: "test",
  trustProxyHops: 0,
};
let replicaSet;
let server;
let baseUrl;
let userA;
let userB;
let cookieA;
let cookieB;
let csrfA;
let csrfB;

before(async () => {
  replicaSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
    instanceOpts: [{ storageEngine: "wiredTiger" }],
    timeoutMS: 60000,
  });
  await connectDatabase(replicaSet.getUri("fittrack_plans_test"));
  await Promise.all([
    AuthSession.init(),
    Exercise.init(),
    IdempotencyRecord.init(),
    User.init(),
    WorkoutPlan.init(),
  ]);
  await seedExerciseCatalog();

  userA = await User.create({
    name: "Plan Owner A",
    emailNormalized: "plan-owner-a@example.test",
    passwordHash: "test-only",
  });
  userB = await User.create({
    name: "Plan Owner B",
    emailNormalized: "plan-owner-b@example.test",
    passwordHash: "test-only",
  });

  async function authenticatedCookie(user) {
    const token = randomBytes(32).toString("base64url");
    const csrfRaw = randomBytes(24).toString("base64url");
    await AuthSession.create({
      tokenHash: createHash("sha256").update(token).digest("hex"),
      userId: user._id,
      csrfTokenHash: createHash("sha256").update(csrfRaw).digest("hex"),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    return { cookie: `fittrack.sid=${token}`, csrf: csrfRaw };
  }

  const sessionA = await authenticatedCookie(userA);
  cookieA = sessionA.cookie;
  csrfA = sessionA.csrf;
  const sessionB = await authenticatedCookie(userB);
  cookieB = sessionB.cookie;
  csrfB = sessionB.csrf;

  server = createApp({ config, isDatabaseReady: () => true }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (replicaSet) await replicaSet.stop();
});

async function request(path, { cookie = cookieA, csrf = csrfA, method = "GET", body, idempotencyKey } = {}) {
  const headers = {
    cookie,
    origin: "http://localhost:5173",
  };
  if (method !== "GET") headers["x-csrf-token"] = csrf;
  if (body !== undefined) headers["content-type"] = "application/json";
  if (idempotencyKey) headers["idempotency-key"] = idempotencyKey;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = response.status === 204 ? "" : await response.text();
  return { response, body: text ? JSON.parse(text) : null };
}

async function pushUpExerciseId() {
  return (await Exercise.findOne({ slug: "push-up" }))._id.toString();
}

function validCreate(exerciseId) {
  return {
    name: "Chest and Strength",
    description: "A controlled training plan",
    days: [
      {
        label: "Push Day",
        weekday: 1,
        exercises: [
          {
            exerciseId,
            position: 0,
            targetSets: 3,
            targetReps: 10,
            targetWeightKg: null,
          },
        ],
      },
    ],
  };
}

test("create is idempotent and independent plans persist separately", async () => {
  const exerciseId = await pushUpExerciseId();
  const key = "6d754c7f-4a57-4c87-ae60-3fd5e6a4db21";
  const first = await request("/plans", {
    method: "POST",
    body: validCreate(exerciseId),
    idempotencyKey: key,
  });
  assert.equal(first.response.status, 201);
  assert.equal(first.body.data.name, "Chest and Strength");
  assert.equal(first.body.data.days[0].exercises[0].targetReps, 10);

  const replay = await request("/plans", {
    method: "POST",
    body: validCreate(exerciseId),
    idempotencyKey: key,
  });
  assert.equal(replay.response.status, 201);
  assert.equal(replay.body.data.id, first.body.data.id);
  assert.equal(await WorkoutPlan.countDocuments({ userId: userA._id }), 1);

  const changed = await request("/plans", {
    method: "POST",
    body: { ...validCreate(exerciseId), name: "Different Body" },
    idempotencyKey: key,
  });
  assert.equal(changed.response.status, 409);
  assert.equal(changed.body.error.code, "IDEMPOTENCY_KEY_REUSED");

  const second = await request("/plans", {
    method: "POST",
    body: { ...validCreate(exerciseId), name: "Second Plan" },
    idempotencyKey: "22a5f9ef-f31d-44a8-a6ac-e624f2e42b70",
  });
  assert.equal(second.response.status, 201);

  const list = await request("/plans");
  assert.equal(list.response.status, 200);
  assert.equal(list.body.meta.total, 2);
  assert.equal(new Set(list.body.data.map((plan) => plan.id)).size, 2);
});

test("plan updates use CAS and preserve stable nested IDs", async () => {
  const exerciseId = await pushUpExerciseId();
  const created = await request("/plans", {
    method: "POST",
    body: validCreate(exerciseId),
    idempotencyKey: "3d0ea11f-9bbd-4cce-b5f4-0f2dcd4fdf16",
  });
  const plan = created.body.data;

  const stale = await request(`/plans/${plan.id}`, {
    method: "PATCH",
    body: { version: 1, name: "Stale Update" },
  });
  assert.equal(stale.response.status, 200);

  const staleRetry = await request(`/plans/${plan.id}`, {
    method: "PATCH",
    body: { version: 1, name: "Overwrite Attempt" },
  });
  assert.equal(staleRetry.response.status, 409);
  assert.equal(staleRetry.body.error.code, "VERSION_CONFLICT");

  const detail = await request(`/plans/${plan.id}`);
  assert.equal(detail.body.data.name, "Stale Update");
  assert.equal(detail.body.data.version, 2);
  assert.equal(detail.body.data.days[0].id, plan.days[0].id);
  assert.equal(detail.body.data.days[0].exercises[0].id, plan.days[0].exercises[0].id);
});

test("validation and cross-user access fail safely", async () => {
  const exerciseId = await pushUpExerciseId();
  const invalid = await request("/plans", {
    method: "POST",
    body: {
      name: "Bad target",
      days: [{
        label: "Push",
        exercises: [{
          exerciseId,
          position: 0,
          targetSets: 3,
          targetReps: 0,
        }],
      }],
    },
    idempotencyKey: "13dca81d-70d1-4ee8-a5c0-aa1215c24f9e",
  });
  assert.equal(invalid.response.status, 422);
  assert.equal(invalid.body.error.code, "VALIDATION_ERROR");

  const created = await request("/plans", {
    method: "POST",
    body: validCreate(exerciseId),
    idempotencyKey: "df01f5de-2257-452c-8146-0ebef0b27c37",
  });
  const planId = created.body.data.id;

  const foreignDetail = await request(`/plans/${planId}`, { cookie: cookieB, csrf: csrfB });
  assert.equal(foreignDetail.response.status, 404);
  const foreignPatch = await request(`/plans/${planId}`, {
    cookie: cookieB,
    csrf: csrfB,
    method: "PATCH",
    body: { version: 1, name: "Foreign update" },
  });
  assert.equal(foreignPatch.response.status, 404);
  const foreignArchive = await request(`/plans/${planId}`, {
    cookie: cookieB,
    csrf: csrfB,
    method: "DELETE",
  });
  assert.equal(foreignArchive.response.status, 404);
});

test("archive is soft, idempotent, and removes the plan from the active list", async () => {
  const exerciseId = await pushUpExerciseId();
  const created = await request("/plans", {
    method: "POST",
    body: validCreate(exerciseId),
    idempotencyKey: "a8e330bb-a252-43bb-85b3-5e9f3debc00a",
  });
  const planId = created.body.data.id;

  const first = await request(`/plans/${planId}`, { method: "DELETE" });
  assert.equal(first.response.status, 204);
  const second = await request(`/plans/${planId}`, { method: "DELETE" });
  assert.equal(second.response.status, 204);
  const detail = await request(`/plans/${planId}`);
  assert.equal(detail.response.status, 404);
  const stored = await WorkoutPlan.findById(planId);
  assert.ok(stored.archivedAt);
});
