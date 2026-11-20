import assert from "node:assert/strict";
import { after, test } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { connectDatabase } from "../src/db/connect.js";
import { AuthSession } from "../src/models/AuthSession.js";
import { IdempotencyRecord } from "../src/models/IdempotencyRecord.js";
import { User } from "../src/models/User.js";
import { WorkoutSession } from "../src/models/WorkoutSession.js";

let replicaSet;

after(async () => {
  await mongoose.disconnect();
  if (replicaSet) {
    await replicaSet.stop();
  }
});

test("database startup waits for critical indexes and persists a document", async () => {
  replicaSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });

  await connectDatabase(replicaSet.getUri("fittrack_test"));
  assert.equal(mongoose.connection.readyState, 1);
  assert.equal(mongoose.connection.client.topology.description.type, "ReplicaSetWithPrimary");

  const database = mongoose.connection.db;
  const usersIndexes = await database.collection(User.collection.collectionName).indexes();
  assert.ok(usersIndexes.some((index) => index.unique && index.key.emailNormalized === 1));

  const sessionsIndexes = await database
    .collection(WorkoutSession.collection.collectionName)
    .indexes();
  const activeWorkoutIndex = sessionsIndexes.find(
    (index) => index.name === "one_active_workout_per_user",
  );
  assert.equal(activeWorkoutIndex?.unique, true);
  assert.deepEqual(activeWorkoutIndex?.partialFilterExpression, { status: "in_progress" });

  const idempotencyIndexes = await database
    .collection(IdempotencyRecord.collection.collectionName)
    .indexes();
  assert.ok(idempotencyIndexes.some((index) => index.name === "scoped_idempotency_key"));
  assert.equal(
    idempotencyIndexes.find((index) => index.name === "idempotency_ttl")?.expireAfterSeconds,
    0,
  );

  const authSessionIndexes = await database
    .collection(AuthSession.collection.collectionName)
    .indexes();
  assert.equal(
    authSessionIndexes.find((index) => index.key.expiresAt === 1)?.expireAfterSeconds,
    0,
  );

  const collection = mongoose.connection.db.collection("module01_smoke_test");
  await collection.insertOne({ status: "connected" });
  const stored = await collection.findOne({ status: "connected" });

  assert.deepEqual(stored?.status, "connected");
});
