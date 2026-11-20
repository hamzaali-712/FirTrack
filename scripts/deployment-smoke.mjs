import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const requestTimeoutMs = 8000;

function getDeploymentOrigin(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Set FITTRACK_DEPLOYMENT_URL to the deployed app origin.");
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("FITTRACK_DEPLOYMENT_URL must be a valid app origin.");
  }

  const isLocalHost = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalHost)) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "FITTRACK_DEPLOYMENT_URL must be an HTTPS origin; HTTP is allowed only for localhost smoke tests.",
    );
  }

  return url.origin;
}

async function request(fetchImpl, origin, path, name, expectedStatus) {
  let response;
  try {
    response = await fetchImpl(`${origin}${path}`, {
      headers: { Accept: path === "/" ? "text/html" : "application/json" },
      redirect: "manual",
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch (error) {
    throw new Error(`${name} request failed or timed out.`, { cause: error });
  }

  if (response.status !== expectedStatus) {
    throw new Error(`${name} expected HTTP ${expectedStatus}, received ${response.status}.`);
  }
  return response;
}

async function readJson(response, name) {
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`${name} returned invalid JSON.`, { cause: error });
  }
}

export async function runDeploymentSmoke({
  deploymentUrl = process.env.FITTRACK_DEPLOYMENT_URL,
  fetchImpl = fetch,
} = {}) {
  const origin = getDeploymentOrigin(deploymentUrl);
  const checks = [];

  const spaResponse = await request(fetchImpl, origin, "/", "SPA root", 200);
  if (!spaResponse.headers.get("content-type")?.toLowerCase().includes("text/html")) {
    throw new Error("SPA root did not return HTML.");
  }
  const html = await spaResponse.text();
  if (!/id=["']root["']/.test(html)) {
    throw new Error("SPA root did not contain the FitTrack application mount point.");
  }
  checks.push("SPA root");

  const healthResponse = await request(
    fetchImpl,
    origin,
    "/api/v1/health",
    "API liveness",
    200,
  );
  const health = await readJson(healthResponse, "API liveness");
  if (health?.data?.service !== "fittrack-api" || health.data.status !== "ok") {
    throw new Error("API liveness returned an unexpected response.");
  }
  checks.push("API liveness");

  const readyResponse = await request(
    fetchImpl,
    origin,
    "/api/v1/ready",
    "API readiness",
    200,
  );
  const readiness = await readJson(readyResponse, "API readiness");
  if (readiness?.data?.status !== "ready") {
    throw new Error("API readiness returned an unexpected response.");
  }
  checks.push("API readiness");

  const sessionResponse = await request(
    fetchImpl,
    origin,
    "/api/v1/auth/session",
    "Anonymous session isolation",
    401,
  );
  const session = await readJson(sessionResponse, "Anonymous session isolation");
  if (!session?.error || session.data?.user) {
    throw new Error("Anonymous session isolation returned an unexpected response.");
  }
  checks.push("anonymous session isolation");

  return checks;
}

async function main() {
  const checks = await runDeploymentSmoke();
  console.log(`Deployment smoke checks passed: ${checks.join(", ")}.`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    console.error(`Deployment smoke failed: ${error.message}`);
    process.exitCode = 1;
  });
}
