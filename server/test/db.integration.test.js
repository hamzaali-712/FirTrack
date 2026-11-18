import assert from "node:assert/strict";
import { after, test } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { connectDatabase } from "../src/db/connect.js";

let replicaSet;

after(async () => {
  await mongoose.disconnect();
  if (replicaSet) {
    await replicaSet.stop();
  }
});

test("Mongoose connects to a MongoDB replica set and persists a document", async () => {
  replicaSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });

  await connectDatabase(replicaSet.getUri("fittrack_test"));
  assert.equal(mongoose.connection.readyState, 1);
  assert.equal(mongoose.connection.client.topology.description.type, "ReplicaSetWithPrimary");

  const collection = mongoose.connection.db.collection("module01_smoke_test");
  await collection.insertOne({ status: "connected" });
  const stored = await collection.findOne({ status: "connected" });

  assert.deepEqual(stored?.status, "connected");
});
