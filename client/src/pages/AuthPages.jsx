import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiClientError, apiRequest } from "../auth/api.js";
import { useAuth } from "../auth/AuthContext.jsx";

const goals = [
  ["muscle_gain", "Muscle gain"],
  ["strength", "Strength"],
  ["fat_loss", "Fat loss"],
  ["endurance", "Endurance"],
  ["general_fitness", "General fitness"],
];
const experienceLevels = [
  ["beginner", "Beginner"],
  ["intermediate", "Intermediate"],
  ["advanced", "Advanced"],
];
const equipmentOptions = [
  ["bodyweight", "Bodyweight"],
  ["dumbbells", "Dumbbells"],
  ["barbell", "Barbell"],
  ["machine", "Machine"],
  ["cable", "Cable"],
  ["other", "Other"],
];

function getErrorMessage(error) {
  if (error instanceof ApiClientError) return error.message;
  return "We could not reach FitTrack. Check your connection and try again.";
}

function fieldErrorFor(error, name) {
  return error instanceof ApiClientError
    ? error.fieldErrors.find((item) => item.field === name)?.message
    : undefined;
}

function AccountFrame({ eyebrow, title, children, footer }) {
  return (
    <main className="account-page">
      <header className="account-header">
        <Link aria-label="FitTrack home" className="wordmark" to="/">
          <span aria-hidden="true" className="wordmark-mark">
            <span />
            <span />
            <span />
          </span>
          <span>FitTrack</span>
        </Link>
        <Link className="account-home-link" to="/">Back to home</Link>
      </header>
      <section aria-labelledby="account-title" className="account-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="account-title">{title}</h1>
        {children}
        {footer ? <div className="account-footer">{footer}</div> : null}
      </section>
    </main>
  );
}

export function LoginPage() {
  const { signIn, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (user) navigate("/profile", { replace: true });
  }, [navigate, user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await signIn(values);
      navigate(location.state?.from?.pathname ?? "/profile", { replace: true });
    } catch (requestError) {
      setError(requestError);
    } finally {
      setPending(false);
    }
  }

  return (
    <AccountFrame
      eyebrow="Welcome back"
      title="Sign in to FitTrack."
      footer={<>New to FitTrack? <Link to="/register">Create an account</Link></>}
    >
      <form className="account-form" onSubmit={handleSubmit}>
        {error ? <p className="account-error" role="alert">{getErrorMessage(error)}</p> : null}
        <label htmlFor="login-email">Email</label>
        <input
          autoComplete="email"
          id="login-email"
          maxLength="254"
          onChange={(event) => setValues({ ...values, email: event.target.value })}
          required
          type="email"
          value={values.email}
        />
        <label htmlFor="login-password">Password</label>
        <input
          autoComplete="current-password"
          id="login-password"
          maxLength="128"
          onChange={(event) => setValues({ ...values, password: event.target.value })}
          required
          type="password"
          value={values.password}
        />
        <button className="button button-primary account-submit" disabled={pending} type="submit">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AccountFrame>
  );
}

export function RegisterPage() {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (user) navigate("/profile", { replace: true });
  }, [navigate, user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await signUp(values);
      navigate("/profile", { replace: true });
    } catch (requestError) {
      setError(requestError);
    } finally {
      setPending(false);
    }
  }

  return (
    <AccountFrame
      eyebrow="Start with the essentials"
      title="Create your account."
      footer={<>Already registered? <Link to="/login">Sign in</Link></>}
    >
      <form className="account-form" onSubmit={handleSubmit}>
        {error ? <p className="account-error" role="alert">{getErrorMessage(error)}</p> : null}
        <label htmlFor="register-name">Name</label>
        <input
          autoComplete="name"
          id="register-name"
          maxLength="80"
          minLength="2"
          onChange={(event) => setValues({ ...values, name: event.target.value })}
          required
          type="text"
          value={values.name}
        />
        {fieldErrorFor(error, "name") ? <p className="field-error">{fieldErrorFor(error, "name")}</p> : null}
        <label htmlFor="register-email">Email</label>
        <input
          autoComplete="email"
          id="register-email"
          maxLength="254"
          onChange={(event) => setValues({ ...values, email: event.target.value })}
          required
          type="email"
          value={values.email}
        />
        {fieldErrorFor(error, "email") ? <p className="field-error">{fieldErrorFor(error, "email")}</p> : null}
        <label htmlFor="register-password">Password</label>
        <input
          autoComplete="new-password"
          id="register-password"
          maxLength="128"
          minLength="8"
          onChange={(event) => setValues({ ...values, password: event.target.value })}
          required
          type="password"
          value={values.password}
        />
        <span className="input-hint">Use 8–128 characters.</span>
        {fieldErrorFor(error, "password") ? <p className="field-error">{fieldErrorFor(error, "password")}</p> : null}
        <button className="button button-primary account-submit" disabled={pending} type="submit">
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AccountFrame>
  );
}

function profileFromUser(user) {
  return {
    name: user.name,
    primaryGoal: user.primaryGoal,
    experienceLevel: user.experienceLevel,
    equipmentPreferences: user.equipmentPreferences ?? [],
    age: user.age ?? "",
    heightCm: user.heightCm ?? "",
    currentWeightKg: user.currentWeightKg ?? "",
  };
}

function profilePayload(values) {
  return {
    name: values.name,
    primaryGoal: values.primaryGoal,
    experienceLevel: values.experienceLevel,
    equipmentPreferences: values.equipmentPreferences,
    age: values.age === "" ? null : Number(values.age),
    heightCm: values.heightCm === "" ? null : Number(values.heightCm),
    currentWeightKg: values.currentWeightKg === "" ? null : Number(values.currentWeightKg),
  };
}

export function ProfilePage() {
  const { signOut, updateProfile, user } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(() => profileFromUser(user));
  const [loadError, setLoadError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState(null);
  const [pending, setPending] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest("/profile")
      .then((profile) => {
        if (active) setValues(profileFromUser(profile));
      })
      .catch((error) => {
        if (active) setLoadError(getErrorMessage(error));
      });
    return () => {
      active = false;
    };
  }, []);

  function updateField(field, value) {
    setSaveMessage("");
    setValues((current) => ({ ...current, [field]: value }));
  }

  function toggleEquipment(value) {
    setValues((current) => ({
      ...current,
      equipmentPreferences: current.equipmentPreferences.includes(value)
        ? current.equipmentPreferences.filter((item) => item !== value)
        : [...current.equipmentPreferences, value],
    }));
    setSaveMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setSaveError(null);
    setSaveMessage("");
    try {
      await updateProfile(profilePayload(values));
      setSaveMessage("Profile saved.");
    } catch (error) {
      setSaveError(error);
    } finally {
      setPending(false);
    }
  }

  async function handleLogout() {
    setLogoutPending(true);
    setSaveError(null);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      setSaveError(error);
    } finally {
      setLogoutPending(false);
    }
  }

  return (
    <main className="account-page profile-page">
      <header className="account-header">
        <Link className="wordmark" to="/">
          <span aria-hidden="true" className="wordmark-mark"><span /><span /><span /></span>
          <span>FitTrack</span>
        </Link>
        <div className="profile-header-actions">
          <span className="profile-greeting">Hi, {user.name}</span>
          <button className="button button-secondary" disabled={logoutPending} onClick={handleLogout} type="button">
            {logoutPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </header>
      <section aria-labelledby="profile-title" className="profile-card">
        <p className="eyebrow">Your account</p>
        <h1 id="profile-title">Profile and preferences</h1>
        <p className="section-description">
          Set preferences for your FitTrack experience. Physical details are optional.
        </p>
        <p className="profile-email">{user.email}</p>
        {loadError ? <p className="account-error" role="alert">{loadError}</p> : null}
        <form className="account-form profile-form" onSubmit={handleSubmit}>
          <label htmlFor="profile-name">Name</label>
          <input
            autoComplete="name"
            id="profile-name"
            maxLength="80"
            minLength="2"
            onChange={(event) => updateField("name", event.target.value)}
            required
            value={values.name}
          />
          {fieldErrorFor(saveError, "name") ? <p className="field-error">{fieldErrorFor(saveError, "name")}</p> : null}

          <label htmlFor="profile-goal">Primary goal</label>
          <select id="profile-goal" onChange={(event) => updateField("primaryGoal", event.target.value)} value={values.primaryGoal}>
            {goals.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>

          <label htmlFor="profile-experience">Experience level</label>
          <select
            id="profile-experience"
            onChange={(event) => updateField("experienceLevel", event.target.value)}
            value={values.experienceLevel}
          >
            {experienceLevels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>

          <fieldset className="equipment-fieldset">
            <legend>Equipment preferences</legend>
            <div className="equipment-options">
              {equipmentOptions.map(([value, label]) => (
                <label className="equipment-option" key={value}>
                  <input
                    checked={values.equipmentPreferences.includes(value)}
                    onChange={() => toggleEquipment(value)}
                    type="checkbox"
                    value={value}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <span className="input-hint">Leave all unchecked if you have no preference.</span>
          </fieldset>

          <div className="profile-number-grid">
            <label htmlFor="profile-age">
              Age
              <input
                id="profile-age"
                max="100"
                min="16"
                onChange={(event) => updateField("age", event.target.value)}
                type="number"
                value={values.age}
              />
            </label>
            <label htmlFor="profile-height">
              Height (cm)
              <input
                id="profile-height"
                max="250"
                min="80"
                onChange={(event) => updateField("heightCm", event.target.value)}
                step="0.1"
                type="number"
                value={values.heightCm}
              />
            </label>
            <label htmlFor="profile-weight">
              Current weight (kg)
              <input
                id="profile-weight"
                max="350"
                min="20"
                onChange={(event) => updateField("currentWeightKg", event.target.value)}
                step="0.1"
                type="number"
                value={values.currentWeightKg}
              />
            </label>
          </div>
          {fieldErrorFor(saveError, "age") ? <p className="field-error">{fieldErrorFor(saveError, "age")}</p> : null}
          {fieldErrorFor(saveError, "heightCm") ? <p className="field-error">{fieldErrorFor(saveError, "heightCm")}</p> : null}
          {fieldErrorFor(saveError, "currentWeightKg") ? <p className="field-error">{fieldErrorFor(saveError, "currentWeightKg")}</p> : null}
          {saveError ? <p className="account-error" role="alert">{getErrorMessage(saveError)}</p> : null}
          {saveMessage ? <p aria-live="polite" className="save-confirmation" role="status">{saveMessage}</p> : null}
          <button className="button button-primary account-submit" disabled={pending || Boolean(loadError)} type="submit">
            {pending ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>
    </main>
  );
}
