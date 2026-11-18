import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";

function FoundationStatus() {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState({ state: "checking" });

  useEffect(() => {
    const controller = new AbortController();
    setStatus({ state: "checking" });

    fetch("/api/v1/health", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`API health check returned ${response.status}.`);
        }

        const result = await response.json();
        if (result.data?.status !== "ok") {
          throw new Error("API health check returned an unexpected response.");
        }

        setStatus({ state: "available" });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setStatus({ state: "unavailable" });
        }
      });

    return () => controller.abort();
  }, [attempt]);

  const label = {
    checking: "Checking API…",
    available: "API is responding",
    unavailable: "API is unavailable",
  }[status.state];

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12 text-brand-alabaster-grey">
      <section
        aria-labelledby="foundation-title"
        className="w-full max-w-2xl rounded-2xl border border-ocean-border bg-ocean-surface p-8 shadow-2xl sm:p-12"
      >
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-brand-sky-blue">
          FitTrack · Module 01
        </p>
        <h1
          id="foundation-title"
          className="font-ui text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Foundation status
        </h1>
        <p className="mt-4 max-w-prose leading-7 text-ocean-secondary">
          The React, Vite, Tailwind, Express, and MongoDB foundation is being
          established. Product features are not part of this module.
        </p>
        <div
          aria-live="polite"
          className="mt-8 flex flex-wrap items-center gap-4"
        >
          <p
            className="rounded-full border border-ocean-border px-4 py-2 text-sm"
            role="status"
          >
            {label}
          </p>
          {status.state === "unavailable" && (
            <button
              className="rounded-xl bg-brand-amber-glow px-4 py-2 font-semibold text-canvas transition-colors hover:bg-brand-sky-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber-glow"
              onClick={() => setAttempt((value) => value + 1)}
              type="button"
            >
              Retry
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center text-brand-alabaster-grey">
      <h1 className="font-ui text-3xl font-bold">Page not found</h1>
      <Link
        className="mt-4 rounded-lg text-brand-sky-blue underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-amber-glow"
        to="/"
      >
        Return to foundation status
      </Link>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<FoundationStatus />} path="/" />
      <Route element={<NotFound />} path="*" />
    </Routes>
  );
}
