import assert from "node:assert/strict";
import { once } from "node:events";
import { after, test } from "node:test";
import { createApp } from "../src/app.js";

const servers = [];

after(async () => {
  await Promise.all(
    servers.map(
      (server) =>
        new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

async function startTestServer(app) {
  const server = app.listen(0, "127.0.0.1");
  servers.push(server);
  await once(server, "listening");
  return `http://127.0.0.1:${server.address().port}`;
}

test("health endpoint returns the versioned API liveness envelope", async () => {
  const baseUrl = await startTestServer(createApp());
  const response = await fetch(`${baseUrl}/api/v1/health`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("x-request-id"), /^[0-9a-f-]{36}$/i);
  assert.deepEqual(await response.json(), {
    data: { service: "fittrack-api", status: "ok" },
  });
});

test("readiness reports a disconnected database as unavailable", async () => {
  const baseUrl = await startTestServer(createApp({ isDatabaseReady: () => false }));
  const response = await fetch(`${baseUrl}/api/v1/ready`);
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.error.code, "SERVICE_UNAVAILABLE");
  assert.equal(body.error.requestId, response.headers.get("x-request-id"));
});

test("readiness reports ready only when the database check passes", async () => {
  const baseUrl = await startTestServer(createApp({ isDatabaseReady: () => true }));
  const response = await fetch(`${baseUrl}/api/v1/ready`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { status: "ready" } });
});

test("malformed JSON receives a safe client error", async () => {
  const baseUrl = await startTestServer(createApp());
  const response = await fetch(`${baseUrl}/api/v1/health`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "BAD_JSON");
  assert.equal(body.error.requestId, response.headers.get("x-request-id"));
});

test("oversized JSON receives a safe payload error", async () => {
  const baseUrl = await startTestServer(createApp());
  const response = await fetch(`${baseUrl}/api/v1/health`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value: "x".repeat(65 * 1024) }),
  });
  const body = await response.json();

  assert.equal(response.status, 413);
  assert.equal(body.error.code, "PAYLOAD_TOO_LARGE");
  assert.equal(body.error.requestId, response.headers.get("x-request-id"));
});
