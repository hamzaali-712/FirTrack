import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { after, before, test } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { seedExerciseCatalog, exerciseSeed } from "../src/catalog/exerciseSeed.js";
import { connectDatabase } from "../src/db/connect.js";
import { AuthSession } from "../src/models/AuthSession.js";
import { Exercise, EXERCISE_GROUPS } from "../src/models/Exercise.js";
import { User } from "../src/models/User.js";

const config = {
  allowedOrigins: ["http://localhost:5173"],
  authHmacSecret: "fittrack-exercise-test-secret-long-enough",
  nodeEnv: "test",
  trustProxyHops: 0,
};
let replicaSet;
let server;
let baseUrl;
let cookie;

before(async () => {
  replicaSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  await connectDatabase(replicaSet.getUri("fittrack_exercises_test"));
  await Promise.all([AuthSession.init(), Exercise.init(), User.init()]);
  const seedReport = await seedExerciseCatalog();
  assert.equal(seedReport.seedCount, 32);
  assert.equal(seedReport.activeCount, 32);
  assert.ok(EXERCISE_GROUPS.every((group) => seedReport.groupCounts[group] >= 4));

  const user = await User.create({
    name: "Catalog Test",
    emailNormalized: "catalog-test@example.test",
    passwordHash: "test-only-not-a-real-password-hash",
  });
  const token = randomBytes(32).toString("base64url");
  await AuthSession.create({
    tokenHash: createHash("sha256").update(token).digest("hex"),
    userId: user._id,
    csrfTokenHash: createHash("sha256").update(randomBytes(24)).digest("hex"),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  cookie = `fittrack.sid=${token}`;

  server = createApp({ config, isDatabaseReady: () => true }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (replicaSet) await replicaSet.stop();
});

async function get(path, { authenticated = true } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: authenticated ? { cookie } : {},
  });
  return { response, body: await response.json() };
}

test("seed is idempotent, complete, and has four active exercises per required group", async () => {
  const candidate = await Exercise.findOne({ slug: "incline-dumbbell-press" }).select(
    "+animationStatus +contentReviewStatus",
  );
  candidate.animationStatus = "pending";
  await candidate.save();
  const secondRun = await seedExerciseCatalog();
  assert.equal(secondRun.activeCount, 32);
  assert.equal(await Exercise.countDocuments(), 32);
  const preserved = await Exercise.findOne({ slug: "incline-dumbbell-press" }).select(
    "+animationStatus +contentReviewStatus",
  );
  assert.equal(preserved.animationStatus, "pending");
  assert.equal(preserved.contentReviewStatus, "draft");

  for (const group of EXERCISE_GROUPS) {
    assert.equal(
      await Exercise.countDocuments({ primaryMuscleGroup: group, isActive: true }),
      4,
    );
  }
  assert.equal(new Set(exerciseSeed.map(({ slug }) => slug)).size, 32);
});

test("catalog requires authentication and returns bounded paginated summaries", async () => {
  const anonymous = await get("/exercises", { authenticated: false });
  assert.equal(anonymous.response.status, 401);

  const firstPage = await get("/exercises?limit=12&page=1");
  const secondPage = await get("/exercises?limit=12&page=2");
  assert.equal(firstPage.response.status, 200);
  assert.equal(firstPage.body.data.length, 12);
  assert.equal(firstPage.body.meta.total, 32);
  assert.equal(firstPage.body.meta.totalPages, 3);
  assert.equal(firstPage.body.meta.hasNextPage, true);
  assert.equal(secondPage.body.data.length, 12);
  assert.equal(
    new Set([...firstPage.body.data, ...secondPage.body.data].map(({ id }) => id)).size,
    24,
  );
  assert.equal(firstPage.body.data[0].animationAvailable, false);
  assert.equal(firstPage.body.data[0].imageUrl, null);
  assert.equal("animationStatus" in firstPage.body.data[0], false);
  assert.equal("contentReviewStatus" in firstPage.body.data[0], false);
  assert.match(firstPage.response.headers.get("cache-control"), /no-store/i);
});

test("search and combined filters use literal text and AND semantics", async () => {
  const combined = await get(
    "/exercises?muscleGroup=chest&equipment=dumbbells&difficulty=beginner",
  );
  assert.equal(combined.response.status, 200);
  assert.deepEqual(combined.body.data.map(({ name }) => name), ["Incline Dumbbell Press"]);
  assert.equal(combined.body.meta.total, 1);

  const partialSearch = await get("/exercises?q=PuLl-Up");
  assert.equal(partialSearch.body.meta.total, 1);
  assert.equal(partialSearch.body.data[0].name, "Pull-Up");

  const regexText = new URLSearchParams({ q: ".*" });
  const literalSearch = await get(`/exercises?${regexText.toString()}`);
  assert.equal(literalSearch.response.status, 200);
  assert.equal(literalSearch.body.meta.total, 0);
  assert.deepEqual(literalSearch.body.meta, {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
  });
});

test("goal relevance changes ranking but never removes otherwise matching exercises", async () => {
  const result = await get(
    "/exercises?q=pl&goal=endurance&sort=relevance",
  );
  assert.equal(result.response.status, 200);
  assert.ok(result.body.data.some(({ name }) => name === "Forearm Plank"));
  assert.equal(result.body.meta.total, 1);

  const allExercises = await get("/exercises");
  assert.equal(allExercises.body.meta.total, 32);
});

test("query parser rejects unknown, repeated, out-of-range, and unsupported filters", async () => {
  for (const path of [
    "/exercises?ownerId=any",
    "/exercises?page=1&page=2",
    "/exercises?page=0",
    "/exercises?limit=51",
    "/exercises?muscleGroup=forearms",
    "/exercises?sort=relevance",
    `/exercises?q=${"x".repeat(101)}`,
  ]) {
    const result = await get(path);
    assert.equal(result.response.status, 400, path);
    assert.equal(result.body.error.code, "INVALID_QUERY", path);
  }
});

test("detail exposes instructions, safe null media, and not-found handling", async () => {
  const exercise = await Exercise.findOne({ slug: "incline-dumbbell-press" }).lean();
  const detail = await get(`/exercises/${exercise._id}`);
  assert.equal(detail.response.status, 200);
  assert.equal(detail.body.data.name, "Incline Dumbbell Press");
  assert.ok(detail.body.data.instructions.length >= 2);
  assert.ok(detail.body.data.safetyNotes.length > 0);
  assert.equal(detail.body.data.imageUrl, null);
  assert.equal(detail.body.data.animation, null);
  assert.equal(detail.body.data.animationAvailable, false);
  assert.equal("animationStatus" in detail.body.data, false);
  assert.equal("contentReviewStatus" in detail.body.data, false);

  const malformedId = await get("/exercises/not-an-object-id");
  assert.equal(malformedId.response.status, 400);
  assert.equal(malformedId.body.error.code, "INVALID_ID");
  const missingId = await get("/exercises/000000000000000000000001");
  assert.equal(missingId.response.status, 404);
  assert.equal(missingId.body.error.code, "RESOURCE_NOT_FOUND");
});

test("inactive exercises are hidden from list and detail results", async () => {
  const hidden = await Exercise.findOne({ slug: "rowing-machine" });
  hidden.isActive = false;
  await hidden.save();

  const list = await get("/exercises?muscleGroup=cardio");
  const detail = await get(`/exercises/${hidden._id}`);
  assert.equal(list.body.meta.total, 3);
  assert.equal(detail.response.status, 404);
});
