import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiClientError, apiRequest, getCsrfToken } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const fetchCsrfToken = useCallback(async () => getCsrfToken(), []);

  useEffect(() => {
    let active = true;
    apiRequest("/auth/session")
      .then((data) => {
        if (active) {
          setUser(data.user);
          setAuthError("");
        }
      })
      .catch((error) => {
        if (!active) return;
        if (error instanceof ApiClientError && error.status === 401) {
          setUser(null);
          setAuthError("");
        } else {
          setAuthError("We could not verify your session. Check your connection and retry.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (credentials) => {
    const csrfToken = await fetchCsrfToken();
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: credentials,
      csrfToken,
    });
    setUser(data.user);
    setAuthError("");
    return data.user;
  }, [fetchCsrfToken]);

  const signUp = useCallback(async (details) => {
    const csrfToken = await fetchCsrfToken();
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: details,
      csrfToken,
    });
    setUser(data.user);
    setAuthError("");
    return data.user;
  }, [fetchCsrfToken]);

  const signOut = useCallback(async () => {
    const csrfToken = await fetchCsrfToken();
    await apiRequest("/auth/logout", { method: "POST", csrfToken });
    setUser(null);
    setAuthError("");
  }, [fetchCsrfToken]);

  const updateProfile = useCallback(
    async (profile) => {
      const csrfToken = await fetchCsrfToken();
      const data = await apiRequest("/profile", {
        method: "PATCH",
        body: profile,
        csrfToken,
      });
      setUser(data);
      return data;
    },
    [fetchCsrfToken],
  );

  const value = useMemo(
    () => ({
      authError,
      loading,
      signIn,
      signOut,
      signUp,
      updateProfile,
      user,
    }),
    [authError, loading, signIn, signOut, signUp, updateProfile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
