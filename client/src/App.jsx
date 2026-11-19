import { useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import { ExerciseDetailPage, ExerciseLibraryPage } from "./pages/ExercisePages.jsx";
import { LoginPage, ProfilePage, RegisterPage } from "./pages/AuthPages.jsx";
import { PlanDetailPage, PlansPage } from "./pages/PlanPages.jsx";
import { WorkoutPage } from "./pages/WorkoutPage.jsx";

const navigation = [
  ["Features", "#features"],
  ["3D Exercises", "#demo"],
  ["How It Works", "#how-it-works"],
  ["Progress", "#progress"],
];

const features = [
  {
    number: "01",
    title: "Explore Exercises",
    description:
      "Find movements by muscle group, equipment, and experience level.",
  },
  {
    number: "02",
    title: "Build Custom Plans",
    description: "Organize exercises and targets around the routine you want.",
  },
  {
    number: "03",
    title: "Log Every Set",
    description: "Record the repetitions, load, or duration you actually did.",
  },
  {
    number: "04",
    title: "Resume Workouts",
    description: "Pick up an active session without losing your place.",
  },
  {
    number: "05",
    title: "Review History",
    description: "Keep completed sessions available as a record of your work.",
  },
  {
    number: "06",
    title: "See Trends",
    description: "Understand consistency and exercise progress from saved data.",
  },
];

const steps = [
  {
    number: "01",
    title: "Choose a Goal",
    description: "Set a training preference and available equipment.",
  },
  {
    number: "02",
    title: "Build a Plan",
    description: "Choose exercises and targets for each workout day.",
  },
  {
    number: "03",
    title: "Log Your Workout",
    description: "Save actual completed repetitions, loads, or durations.",
  },
  {
    number: "04",
    title: "Review Your Progress",
    description: "Explore saved history and transparent trends.",
  },
];

function SectionHeading({
  centered = false,
  description,
  eyebrow,
  id,
  title,
}) {
  return (
    <div className={`section-heading${centered ? " section-heading-centered" : ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      <p className="section-description">{description}</p>
    </div>
  );
}

function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <nav aria-label="Main navigation" className="nav-shell">
        <a
          aria-label="FitTrack home"
          className="wordmark"
          href="#top"
          onClick={closeMenu}
        >
          <span aria-hidden="true" className="wordmark-mark">
            <span />
            <span />
            <span />
          </span>
          <span>FitTrack</span>
        </a>
        <button
          aria-controls="primary-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          className="menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <span aria-hidden="true">{menuOpen ? "Close" : "Menu"}</span>
        </button>
        <div
          className={`nav-links${menuOpen ? " nav-links-open" : ""}`}
          id="primary-navigation"
        >
          {navigation.map(([label, href]) => (
            <a href={href} key={href} onClick={closeMenu}>
              {label}
            </a>
          ))}
          <a className="nav-cta" href="#how-it-works" onClick={closeMenu}>
            Explore the Preview
          </a>
          {user ? (
            <>
              <Link className="nav-account-link" onClick={closeMenu} to="/exercises">
                Exercise library
              </Link>
              <Link className="nav-account-link" onClick={closeMenu} to="/profile">
                Your profile
              </Link>
            </>
          ) : (
            <>
              <Link className="nav-account-link" onClick={closeMenu} to="/login">
                Sign in
              </Link>
              <Link className="nav-account-cta" onClick={closeMenu} to="/register">
                Create account
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function AnatomyPair({ className = "" }) {
  return (
    <div className={`anatomy-pair ${className}`}>
      <figure className="anatomy-card anatomy-card-male">
        <img
          alt="Stylized static male anatomy illustration adapted from the Open Anatomy 3D model"
          height="620"
          src="/assets/landing/anatomy-male.svg"
          width="360"
        />
        <figcaption>Male model · static SVG</figcaption>
      </figure>
      <figure className="anatomy-card anatomy-card-female">
        <img
          alt="Stylized static female anatomy illustration adapted from the Open Anatomy 3D model"
          height="620"
          src="/assets/landing/anatomy-female.svg"
          width="360"
        />
        <figcaption>Female model · static SVG</figcaption>
      </figure>
    </div>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="hero-section" id="top">
      <div className="hero-copy">
        <p className="eyebrow hero-eyebrow">
          Personal workout tracker <span>·</span> Product preview
        </p>
        <h1 id="hero-title">
          Build Your Plan.
          <br />
          Track Every Set.
          <br />
          <span>Own Your Progress.</span>
        </h1>
        <p className="hero-description">
          Explore exercises, create training routines, record your real
          workouts, and see progress you can actually explain.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/register">
            Create an Account
          </Link>
          <a className="button button-secondary" href="#how-it-works">
            See How It Works
          </a>
        </div>
        <p className="availability-note">
          Accounts and profile preferences are available. Workout planning and
          tracking are being built module by module.
        </p>
      </div>
      <div className="hero-visual">
        <div className="visual-orbit visual-orbit-one" />
        <div className="visual-orbit visual-orbit-two" />
        <div className="visual-label">
          <span aria-hidden="true" className="status-dot" />
          Anatomy reference · static artwork
        </div>
        <AnatomyPair />
        <p className="visual-caption">
          Illustrative static models — no exercise animation is shown.
        </p>
      </div>
      <a aria-label="Scroll to FitTrack features" className="scroll-cue" href="#why">
        <span aria-hidden="true">↓</span>
        Scroll to explore
      </a>
    </section>
  );
}

function WhyFitTrack() {
  return (
    <section aria-labelledby="why-title" className="why-section section-pad" id="why">
      <div className="why-copy">
        <p className="eyebrow">Training, with context</p>
        <h2 id="why-title">Workouts Worth Remembering.</h2>
        <p className="section-description">
          A routine is only part of the story. FitTrack is designed to help you
          capture what you actually lifted, how many repetitions you completed,
          and what you want to improve next.
        </p>
      </div>
      <ul className="principle-list">
        <li>
          <span aria-hidden="true">01</span>
          <div>
            <h3>Plan with control</h3>
            <p>Shape routines around your own goals and available equipment.</p>
          </div>
        </li>
        <li>
          <span aria-hidden="true">02</span>
          <div>
            <h3>Train with clarity</h3>
            <p>Keep exercise details and actual set records together.</p>
          </div>
        </li>
        <li>
          <span aria-hidden="true">03</span>
          <div>
            <h3>Review real history</h3>
            <p>Use saved sessions, not guessed statistics, to see your work.</p>
          </div>
        </li>
      </ul>
    </section>
  );
}

function Features() {
  return (
    <section
      aria-labelledby="features-title"
      className="features-section section-pad"
      id="features"
    >
      <SectionHeading
        description="A clear place for the details that make a training routine your own."
        eyebrow="Built around your routine"
        id="features-title"
        title="Everything You Need to Stay Organized."
      />
      <div className="feature-grid">
        {features.map((feature) => (
          <article className="feature-card" key={feature.number}>
            <span aria-hidden="true" className="feature-number">
              {feature.number}
            </span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function DemoSection() {
  return (
    <section
      aria-labelledby="demo-title"
      className="demo-section section-pad"
      id="demo"
    >
      <div className="demo-art">
        <div className="demo-frame">
          <div className="demo-frame-heading">
            <span>ANATOMY PREVIEW</span>
            <span className="demo-frame-state">STATIC</span>
          </div>
          <img
            alt="Static stylized anatomy illustration; it is not an exercise animation or interactive 3D viewer"
            className="demo-model"
            height="620"
            loading="lazy"
            src="/assets/landing/anatomy-male.svg"
            width="360"
          />
          <p className="demo-fallback" role="status">
            3D preview unavailable — exercise instructions are not part of this preview
          </p>
        </div>
        <p className="demo-disclaimer">
          Static model illustration. No exercise clip has been reviewed or
          verified for this preview.
        </p>
      </div>
      <div className="demo-copy">
        <SectionHeading
          description="Explore clear exercise instructions with a controlled 3D demonstration where reviewed animation is available. Every exercise remains readable without 3D."
          eyebrow="Movement, made clearer"
          id="demo-title"
          title="See the Movement. Understand the Steps."
        />
        <p className="demo-coaching-note">
          Illustrative movement; not personalized coaching.
        </p>
        <a className="text-link" href="#exercises">
          Explore the catalog preview <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}

function ExercisePreview() {
  return (
    <section
      aria-labelledby="exercise-title"
      className="exercise-section section-pad"
      id="exercises"
    >
      <div className="exercise-copy">
        <SectionHeading
          description="Browse options by muscle group, equipment and experience level. Your goal guides discovery—it never locks you out of other exercises."
          eyebrow="Find your next movement"
          id="exercise-title"
          title="Find Movements That Fit Your Routine."
        />
        <p className="preview-disclaimer">
          The catalog is not connected yet. This is an interface concept, not a
          searchable exercise list.
        </p>
        <a className="button button-secondary" href="#how-it-works">
          See the planned workflow
        </a>
      </div>
      <div
        aria-label="Illustrative exercise catalog interface concept"
        className="catalog-preview"
        role="img"
      >
        <div className="catalog-preview-top">
          <div>
            <span className="catalog-kicker">DISCOVERY PREVIEW</span>
            <h3>Explore exercises</h3>
          </div>
          <span aria-hidden="true" className="catalog-menu">
            ···
          </span>
        </div>
        <div className="catalog-search">
          <span aria-hidden="true">⌕</span>
          Search exercises
        </div>
        <p className="catalog-filter-label">FILTER BY</p>
        <div aria-hidden="true" className="catalog-filters">
          <span>Muscle group</span>
          <span>Equipment</span>
          <span>Experience</span>
        </div>
        <div aria-hidden="true" className="catalog-placeholder">
          <span className="catalog-placeholder-mark">FT</span>
          <span>Exercise results appear here</span>
        </div>
      </div>
    </section>
  );
}

function ProgressPreview() {
  return (
    <section
      aria-labelledby="progress-title"
      className="progress-section section-pad"
      id="progress"
    >
      <div className="progress-copy">
        <SectionHeading
          description="Review the sessions you've completed, compare exercise records, and understand training consistency without guessing."
          eyebrow="Evidence over estimates"
          id="progress-title"
          title="Progress That Has a Source."
        />
        <p className="preview-disclaimer">
          Example data for illustration. This chart contains no visitor or
          account data.
        </p>
        <a className="text-link" href="#how-it-works">
          See how progress will be reviewed <span aria-hidden="true">↗</span>
        </a>
      </div>
      <figure
        aria-describedby="progress-chart-description"
        className="chart-card"
      >
        <figcaption className="chart-card-heading">
          <span>Training consistency</span>
          <span className="chart-example-label">EXAMPLE DATA</span>
        </figcaption>
        <svg
          aria-hidden="true"
          className="progress-chart"
          preserveAspectRatio="none"
          viewBox="0 0 640 290"
        >
          <defs>
            <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#489fb5" stopOpacity=".3" />
              <stop offset="100%" stopColor="#489fb5" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            className="chart-grid"
            d="M56 48H620M56 104H620M56 160H620M56 216H620"
          />
          <path
            className="chart-area"
            d="M56 216C105 206 124 169 169 181S229 206 277 151 352 132 394 148 469 93 512 113 574 62 620 71V252H56Z"
          />
          <path
            className="chart-line"
            d="M56 216C105 206 124 169 169 181S229 206 277 151 352 132 394 148 469 93 512 113 574 62 620 71"
          />
          <path className="chart-axis" d="M56 32V252H620" />
          <circle className="chart-point" cx="620" cy="71" r="6" />
          <text className="chart-label" x="56" y="278">
            Earlier
          </text>
          <text className="chart-label" textAnchor="end" x="620" y="278">
            Recent
          </text>
          <text className="chart-label" transform="rotate(-90 19 145)" x="19" y="145">
            Example only
          </text>
        </svg>
        <p className="chart-description" id="progress-chart-description">
          Illustrative curve only; no numerical or personal workout data is
          represented.
        </p>
      </figure>
    </section>
  );
}

function HowItWorks() {
  return (
    <section
      aria-labelledby="how-title"
      className="steps-section section-pad"
      id="how-it-works"
    >
      <SectionHeading
        centered
        description="A straightforward path from planning a session to understanding what you have done."
        eyebrow="A simple training loop"
        id="how-title"
        title="Make Each Session Count."
      />
      <ol className="steps-grid">
        {steps.map((step) => (
          <li className="step-card" key={step.number}>
            <span aria-hidden="true" className="step-number">
              {step.number}
            </span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function OpenAnatomyCredit() {
  return (
    <p className="anatomy-credit">
      Anatomy: BodyParts3D © The Database Center for Life Science (CC BY 4.0);
      female organs: Human Reference Atlas 3D Reference Organs, HuBMAP (CC BY
      4.0); female body: MakeHuman (CC0). Modified by{" "}
      <a
        href="https://github.com/MervinR07/open-anatomy-3d"
        rel="noreferrer"
        target="_blank"
      >
        open-anatomy-3d
      </a>
      , CC BY 4.0. FitTrack artwork is a simplified static adaptation;{" "}
      <a
        href="https://creativecommons.org/licenses/by/4.0/"
        rel="noreferrer"
        target="_blank"
      >
        license
      </a>
      . Not for diagnosis.
    </p>
  );
}

function Outro() {
  return (
    <section aria-labelledby="outro-title" className="outro-section" id="outro">
      <div aria-hidden="true" className="outro-watermark">
        FITTRACK
      </div>
      <div className="outro-content">
        <p className="eyebrow">Your next session starts here</p>
        <h2 id="outro-title">Make Every Workout Count.</h2>
        <p>
          Turn training intentions into a record you can trust.
        </p>
        <div className="outro-actions">
          <Link className="button button-primary" to="/register">
            Create an Account
          </Link>
          <a className="button button-secondary" href="#top">
            Back to Top
          </a>
        </div>
        <p className="availability-note">
          Have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
      <footer className="site-footer">
        <div className="footer-main">
          <a className="footer-wordmark" href="#top">
            FitTrack
          </a>
          <p>Personal workout tracking.</p>
          <nav aria-label="Footer navigation" className="footer-links">
            <a href="#why">About</a>
            <a href="#features">Features</a>
            <a href="#progress">Progress preview</a>
          </nav>
        </div>
        <OpenAnatomyCredit />
        <p className="copyright">
          © {new Date().getFullYear()} FitTrack. Product preview.
        </p>
      </footer>
    </section>
  );
}

function LandingPage() {
  return (
    <div className="landing-page">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <WhyFitTrack />
        <Features />
        <DemoSection />
        <ExercisePreview />
        <ProgressPreview />
        <HowItWorks />
        <Outro />
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">FitTrack</p>
      <h1>Page not found</h1>
      <Link className="button button-primary" to="/">
        Return to the landing page
      </Link>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<LandingPage />} path="/" />
        <Route element={<LoginPage />} path="/login" />
        <Route element={<RegisterPage />} path="/register" />
        <Route
          element={
            <ProtectedRoute>
              <ExerciseLibraryPage />
            </ProtectedRoute>
          }
          path="/exercises"
        />
        <Route
          element={
            <ProtectedRoute>
              <ExerciseDetailPage />
            </ProtectedRoute>
          }
          path="/exercises/:exerciseId"
        />
        <Route
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
          path="/profile"
        />
        <Route
          element={
            <ProtectedRoute>
              <PlansPage />
            </ProtectedRoute>
          }
          path="/plans"
        />
        <Route
          element={
            <ProtectedRoute>
              <PlanDetailPage />
            </ProtectedRoute>
          }
          path="/plans/:planId"
        />
        <Route
          element={
            <ProtectedRoute>
              <WorkoutPage />
            </ProtectedRoute>
          }
          path="/workout/:sessionId"
        />
        <Route element={<NotFound />} path="*" />
      </Routes>
    </AuthProvider>
  );
}
