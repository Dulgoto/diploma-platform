import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { get } from "../api/apiClient.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
  );
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() =>
    Boolean(typeof localStorage !== "undefined" && localStorage.getItem(TOKEN_KEY)),
  );

  useEffect(() => {
    if (!token) {
      setUser(null);
      setAuthLoading(false);
      return undefined;
    }

    let cancelled = false;
    setAuthLoading(true);

    get("/api/users/account")
      .then((account) => {
        if (!cancelled) {
          setUser(account);
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        if (err.status === 401 || err.status === 403) {
          setToken(null);
          setUser(null);
          if (typeof localStorage !== "undefined") {
            localStorage.removeItem(TOKEN_KEY);
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAuthLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback((newToken, userData) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(TOKEN_KEY, newToken);
    }
    setToken(newToken);
    if (userData !== undefined) {
      setUser(userData);
    }
  }, []);

  const logout = useCallback(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      logout,
      isAuthenticated: Boolean(token),
      authLoading,
    }),
    [token, user, login, logout, authLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
