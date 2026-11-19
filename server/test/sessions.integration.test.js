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
import { WorkoutSession } from "../src/models/WorkoutSession.js";

const config = {
  allowedOrigins: ["http://localhost:5173"],
  authHmacSecret: "fittrack-session-test-secret-long-enough",
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
let plan;

before(async () => {
  replicaSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
    timeoutMS: 60000,
  });
  await connectDatabase(replicaSet.getUri("fittrack_sessions_test"));
  await Promise.all([
    AuthSession.init(),
    Exercise.init(),
    IdempotencyRecord.init(),
    User.init(),
    WorkoutPlan.init(),
    WorkoutSession.init(),
  ]);
  await seedExerciseCatalog();

  userA = await User.create({
    name: "Session Owner A",
    emailNormalized: "session-owner-a@example.test",
    passwordHash: "test-only",
  });
  userB = await User.create({
    name: "Session Owner B",
    emailNormalized: "session-owner-b@example.test",
    passwordHash: "test-only",
  });

  async function cookieFor(user) {
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

  const a = await cookieFor(userA);
  cookieA = a.cookie;
  csrfA = a.csrf;
  const b = await cookieFor(userB);
  cookieB = b.cookie;
  csrfB = b.csrf;

  const pushUp = await Exercise.findOne({ slug: "push-up" });
  const squat = await Exercise.findOne({ slug: "squat" });
  plan = await WorkoutPlan.create({
    userId: userA._id,
    name: "Session Test Plan",
    description: "",
    version: 1,
    archivedAt: null,
    days: [{
      label: "Push and Strength",
      weekday: 1,
      exercises: [
        {
          exerciseId: pushUp._id,
          position: 0,
          targetSets: 2,
          targetReps: 10,
          targetDurationSec: null,
          targetWeightKg: null,
        },
        {
          exerciseId: squat._id,
          position: 1,
          targetSets: 1,
          targetReps: 8,
          targetDurationSec: null,
          targetWeightKg: 40,
        },
      ],
    }],
  });

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
  const headers = { cookie, origin: "http://localhost:5173" };
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

async function startWorkout() {
  return request("/sessions", {
    method: "POST",
    body: { planId: plan._id.toString(), dayId: plan.days[0]._id.toString() },
    idempotencyKey: "db19c23d-8f5d-45bc-b6e7-ec884768fbb1",
  });
}

test("start snapshots targets and the same retry replays the session", async () => {
  const first = await startWorkout();
  assert.equal(first.response.status, 201);
  assert.equal(first.body.data.status, "in_progress");
  assert.equal(first.body.data.exercises.length, 2);
  assert.equal(first.body.data.exercises[0].sets.length, 2);
  assert.equal(first.body.data.exercises[1].sets.length, 1);
  assert.equal(first.body.data.exercises[1].targetWeightKg, 40);

  const replay = await startWorkout();
  assert.equal(replay.response.status, 201);
  assert.equal(replay.body.data.id, first.body.data.id);
  assert.equal(await WorkoutSession.countDocuments({ userId: userA._id, status: "in_progress" }), 1);

  const active = await request("/sessions/active");
  assert.equal(active.response.status, 200);
  assert.equal(active.body.data.id, first.body.data.id);
});

test("concurrent starts and cross-owner access are safely rejected", async () => {
  const secondStart = await request("/sessions", {
    method: "POST",
    body: { planId: plan._id.toString(), dayId: plan.days[0]._id.toString() },
    idempotencyKey: "b29d58e4-cf96-4a02-a2af-2e3a8056f13c",
  });
  assert.equal(secondStart.response.status, 409);
  assert.equal(secondStart.body.error.code, "ACTIVE_SESSION_EXISTS");

  const active = await request("/sessions/active");
  const foreign = await request(`/sessions/${active.body.data.id}`, { cookie: cookieB, csrf: csrfB });
  assert.equal(foreign.response.status, 404);
});

test("performed sets persist only through confirmed CAS writes", async () => {
  const active = await request("/sessions/active");
  const session = active.body.data;
  const set = session.exercises[1].sets[0];

  const saved = await request(`/sessions/${session.id}/sets/${set.id}`, {
    method: "PATCH",
    body: { version: session.version, reps: 8, weightKg: 40, durationSec: null, completed: true },
  });
  assert.equal(saved.response.status, 200);
  assert.equal(saved.body.data.set.completed, true);
  assert.equal(saved.body.data.set.weightKg, 40);
  assert.equal(saved.body.data.version, 2);

  const stale = await request(`/sessions/${session.id}/sets/${set.id}`, {
    method: "PATCH",
    body: { version: session.version, reps: 8, weightKg: 40, durationSec: null, completed: true },
  });
  assert.equal(stale.response.status, 409);
  assert.equal(stale.body.error.code, "VERSION_CONFLICT");

  const refreshed = await request(`/sessions/active`);
  assert.equal(refreshed.body.data.version, 2);
  assert.equal(refreshed.body.data.exercises[1].sets[0].weightKg, 40);
});

test("completion requires a completed set and repeated completion preserves timestamp", async () => {
  const active = await request("/sessions/active");
  const session = active.body.data;

  await request(`/sessions/${session.id}/sets/${session.exercises[0].sets[0].id}`, {
    method: "PATCH",
    body: { version: session.version, reps: 10, weightKg: null, durationSec: null, completed: true },
  });
  const refreshed = await request(`/sessions/active`);

  const complete = await request(`/sessions/${session.id}/complete`, {
    method: "POST",
    body: { version: refreshed.body.data.version },
  });
  assert.equal(complete.response.status, 200);
  assert.equal(complete.body.data.status, "completed");
  assert.ok(complete.body.data.completedAt);

  const repeated = await request(`/sessions/${session.id}/complete`, {
    method: "POST",
    body: { version: 1 },
  });
  assert.equal(repeated.response.status, 200);
  assert.equal(repeated.body.data.completedAt, complete.body.data.completedAt);
});

test("abandon frees the active slot and terminal states cannot be reversed", async () => {
  const key = "e5b35f3d-02e4-4631-9567-7a24e744c1dc";
  await request("/sessions", {
    method: "POST",
    body: { planId: plan._id.toString(), dayId: plan.days[0]._id.toString() },
    idempotencyKey: key,
  });

  const active = await request("/sessions/active");
  if (active.body.data) {
    const abandoned = await request(`/sessions/${active.body.data.id}/abandon`, {
      method: "POST",
      body: { version: active.body.data.version },
    });
    assert.equal(abandoned.response.status, 200);
    assert.equal(abandoned.body.data.status, "abandoned");

    const repeat = await request(`/sessions/${active.body.data.id}/abandon`, {
      method: "POST",
      body: { version: 1 },
    });
    assert.equal(repeat.response.status, 200);
  } else {
    assert.fail("Expected a fresh active session after terminal completion.");
  }

  const emptyActive = await request("/sessions/active");
  assert.equal(emptyActive.body.data, null);
});

test("history is owner-scoped, paginated, and archived-plan snapshots remain readable", async () => {
  const first = await WorkoutSession.create({
    userId: userA._id,
    sourcePlanId: plan._id,
    sourceDayId: plan.days[0]._id,
    planNameSnapshot: "Immutable Monday Plan",
    dayLabelSnapshot: "Monday Snapshot",
    status: "completed",
    startedAt: new Date("2026-11-18T10:00:00.000Z"),
    completedAt: new Date("2026-11-18T11:00:00.000Z"),
    abandonedAt: null,
    version: 3,
    exercises: [{
      exerciseId: (await Exercise.findOne({ slug: "push-up" }))._id,
      nameSnapshot: "Push-Up",
      trackingType: "reps_only",
      position: 0,
      targetSets: 1,
      targetReps: 10,
      targetDurationSec: null,
      targetWeightKg: null,
      sets: [{
        position: 0,
        reps: 12,
        weightKg: null,
        durationSec: null,
        completed: true,
      }],
    }],
  });
  await WorkoutSession.create({
    userId: userA._id,
    sourcePlanId: plan._id,
    sourceDayId: plan.days[0]._id,
    planNameSnapshot: "Second Completed Plan",
    dayLabelSnapshot: "Second Day",
    status: "completed",
    startedAt: new Date("2026-11-19T10:00:00.000Z"),
    completedAt: new Date("2026-11-19T10:30:00.000Z"),
    abandonedAt: null,
    version: 2,
    exercises: [],
  });

  plan.archivedAt = new Date();
  await plan.save();

  const list = await request("/sessions?status=completed&page=1&limit=1");
  assert.equal(list.response.status, 200);
  assert.equal(list.body.data.length, 1);
  assert.equal(list.body.meta.limit, 1);
  assert.equal(list.body.meta.hasNextPage, true);
  assert.equal(list.body.data[0].completedSetCount >= 0, true);

  const detail = await request(`/sessions/${first._id.toString()}`);
  assert.equal(detail.response.status, 200);
  assert.equal(detail.body.data.planNameSnapshot, "Immutable Monday Plan");
  assert.equal(detail.body.data.exercises[0].sets[0].reps, 12);
  assert.equal(detail.body.data.status, "completed");

  const foreign = await request(`/sessions/${first._id.toString()}`, { cookie: cookieB, csrf: csrfB });
  assert.equal(foreign.response.status, 404);

  const invalid = await request("/sessions?status=unknown");
  assert.equal(invalid.response.status, 400);
});
