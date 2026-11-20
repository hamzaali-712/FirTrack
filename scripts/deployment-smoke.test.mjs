import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { runDeploymentSmoke } from "./deployment-smoke.mjs";

function mockResponse(status, body, contentType = "application/json") {
  return new Response(
    typeof body === "string" ? body : JSON.stringify(body),
    { status, headers: { "content-type": contentType } },
  );
}

test("deployment smoke checks SPA, API liveness/readiness, and anonymous isolation", async () => {
  const requestedPaths = [];
  const fetchImpl = async (input) => {
    const path = new URL(input).pathname;
    requestedPaths.push(path);
    if (path === "/") {
      return mockResponse(200, '<div id="root"></div>', "text/html");
    }
    if (path === "/api/v1/health") {
      return mockResponse(200, { data: { service: "fittrack-api", status: "ok" } });
    }
    if (path === "/api/v1/ready") {
      return mockResponse(200, { data: { status: "ready" } });
    }
    return mockResponse(401, { error: { code: "UNAUTHENTICATED" } });
  };

  const checks = await runDeploymentSmoke({
    deploymentUrl: "http://localhost:5173",
    fetchImpl,
  });

  assert.deepEqual(checks, [
    "SPA root",
    "API liveness",
    "API readiness",
    "anonymous session isolation",
  ]);
  assert.deepEqual(requestedPaths, [
    "/",
    "/api/v1/health",
    "/api/v1/ready",
    "/api/v1/auth/session",
  ]);
});

test("deployment smoke performs the checks over a real loopback HTTP connection", async (context) => {
  const server = createServer((request, response) => {
    response.setHeader("content-type", "application/json");
    if (request.url === "/") {
      response.setHeader("content-type", "text/html");
      response.end('<div id="root"></div>');
    } else if (request.url === "/api/v1/health") {
      response.end(JSON.stringify({ data: { service: "fittrack-api", status: "ok" } }));
    } else if (request.url === "/api/v1/ready") {
      response.end(JSON.stringify({ data: { status: "ready" } }));
    } else {
      response.statusCode = 401;
      response.end(JSON.stringify({ error: { code: "UNAUTHENTICATED" } }));
    }
  });
  server.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  context.after(
    () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  );

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const checks = await runDeploymentSmoke({
    deploymentUrl: `http://127.0.0.1:${address.port}`,
  });

  assert.equal(checks.length, 4);
});

test("deployment URL must be a safe HTTPS origin except for loopback smoke tests", async () => {
  await assert.rejects(
    runDeploymentSmoke({ fetchImpl: async () => assert.fail("fetch must not run") }),
    /Set FITTRACK_DEPLOYMENT_URL/,
  );
  await assert.rejects(
    runDeploymentSmoke({
      deploymentUrl: "http://app.example.test",
      fetchImpl: async () => assert.fail("fetch must not run"),
    }),
    /must be an HTTPS origin/,
  );
  await assert.rejects(
    runDeploymentSmoke({
      deploymentUrl: "https://user:pass@app.example.test",
      fetchImpl: async () => assert.fail("fetch must not run"),
    }),
    /must be an HTTPS origin/,
  );
});

test("smoke check fails when readiness is unavailable", async () => {
  const fetchImpl = async (input) => {
    const path = new URL(input).pathname;
    if (path === "/") return mockResponse(200, '<div id="root"></div>', "text/html");
    if (path === "/api/v1/health") {
      return mockResponse(200, { data: { service: "fittrack-api", status: "ok" } });
    }
    return mockResponse(503, { error: { code: "SERVICE_UNAVAILABLE" } });
  };

  await assert.rejects(
    runDeploymentSmoke({ deploymentUrl: "http://127.0.0.1:5173", fetchImpl }),
    /API readiness expected HTTP 200, received 503/,
  );
});

test("smoke check fails when private session endpoint allows anonymous access", async () => {
  const fetchImpl = async (input) => {
    const path = new URL(input).pathname;
    if (path === "/") return mockResponse(200, '<div id="root"></div>', "text/html");
    if (path === "/api/v1/health") {
      return mockResponse(200, { data: { service: "fittrack-api", status: "ok" } });
    }
    if (path === "/api/v1/ready") {
      return mockResponse(200, { data: { status: "ready" } });
    }
    return mockResponse(200, { data: { user: { name: "unexpected" } } });
  };

  await assert.rejects(
    runDeploymentSmoke({ deploymentUrl: "http://localhost:5173", fetchImpl }),
    /Anonymous session isolation expected HTTP 401, received 200/,
  );
});

test("smoke check rejects an SPA response without the app mount point", async () => {
  await assert.rejects(
    runDeploymentSmoke({
      deploymentUrl: "http://localhost:5173",
      fetchImpl: async () => mockResponse(200, "<html></html>", "text/html"),
    }),
    /did not contain the FitTrack application mount point/,
  );
});
