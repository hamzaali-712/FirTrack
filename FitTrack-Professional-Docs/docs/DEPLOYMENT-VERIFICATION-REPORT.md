# FitTrack — Module 11 Deployment Verification

## Status

Provider-neutral deployment preparation is implemented and verified locally. The user selected Render for the API and Vercel for the SPA. Vercel CLI is available through `npx` but reports logged out; Windows Application Control blocked execution of the verified Render CLI binary. No deployment API tokens are present in the process environment, service URLs are unavailable, and production MongoDB/secret-store readiness is unknown. This report does not claim that production or staging is running.

## Implemented

- Added validated `HOST` configuration with a loopback default; deployment can explicitly bind to a platform-required IPv4 or IPv6 address.
- API startup now waits for all registered Mongoose models to initialize their declared indexes before opening the listener.
- Added a read-only `npm run smoke:deployment` check for the SPA mount point, API liveness/readiness, and rejection of unauthenticated access to the private session endpoint.
- Added smoke-check tests for successful responses, insecure URLs, unavailable readiness, anonymous access, malformed SPA responses, and a real loopback HTTP connection.
- Reconciled the operations guide with the actual environment variables and npm scripts, and documented provider-specific work that remains open.

## Verification

| Check | Result |
|---|---|
| `npm test` | Passed, 10/10 |
| `npm run test:db` | Passed, 1/1; a disposable MongoDB replica set verified user-email uniqueness, the one-active-workout partial unique index, idempotency uniqueness/TTL, session TTL, and document persistence |
| `npm run test:auth` | Passed, 7/7 |
| `npm run test:exercises` | Passed, 7/7 |
| `npm run test:plans` | Passed, 4/4 |
| `npm run test:sessions` | Passed, 7/7 |
| `npm run test:analytics` | Passed, 4/4 |
| `npm run test:deployment-smoke` | Passed, 6/6 |
| `npm run build` | Passed; Vite reports the existing 969.89 KB raw lazy 3D viewer chunk advisory |
| `git diff --check` | Passed |

The smoke check was exercised with mocked failure/success responses and a loopback HTTP fixture. It was not run against a deployed FitTrack URL or production database.

## Release blockers and risks

- Install/authenticate the Render and Vercel CLIs, then provision/link the selected services and confirm their public URLs. Configure Vercel to proxy `/api/v1` to Render and set Render `APP_ORIGIN` to the exact Vercel origin.
- Confirm/provision a staging/production MongoDB replica set with a rotated private credential stored only in Render's secret manager. Verify connectivity, indexes, backups and restore, migration/seed behavior, monitoring, and provider-specific rollback.
- Run the smoke command against the real staging URL and perform authenticated staging scenarios using non-production accounts.
- Complete the outstanding full accessibility audit and supported-browser matrix.
- The pinned 3D candidate still lacks independent rights-chain and movement review; the product's 3D release gate remains blocked.

No platform credential, domain, database secret, or live service was created or changed during this module. `npx vercel whoami` confirmed Vercel is logged out; Render CLI execution was denied by Windows Application Control. No MongoDB CLI was present.
