import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { authError, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="account-page">
        <p aria-live="polite" className="account-status">
          Checking your session…
        </p>
      </main>
    );
  }
  if (authError) {
    return (
      <main className="account-page">
        <p className="account-error" role="alert">{authError}</p>
        <button className="button button-secondary" onClick={() => window.location.reload()} type="button">
          Retry
        </button>
      </main>
    );
  }
  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }
  return children;
}
