"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  fetchCurrentUser,
  loginAccount,
  logoutAccount,
  registerAccount,
  type AuthUser,
} from "@/lib/auth-api";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await fetchCurrentUser();
    setUser(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const next = await fetchCurrentUser();
      if (!cancelled) {
        setUser(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      refresh,
      login: async (email, password) => {
        await loginAccount({ email, password });
        // Require a cookie-backed session — never trust the login JSON body alone.
        const confirmed = await fetchCurrentUser();
        if (!confirmed) {
          throw new Error(
            "Signed in, but the browser did not keep the session cookie. Use http://localhost:3001 (not 127.0.0.1) and try again.",
          );
        }
        setUser(confirmed);
        return confirmed;
      },
      register: async (input) => {
        await registerAccount(input);
        const confirmed = await fetchCurrentUser();
        if (!confirmed) {
          throw new Error(
            "Account created, but the session cookie was not kept. Try signing in again.",
          );
        }
        setUser(confirmed);
        return confirmed;
      },
      logout: async () => {
        await logoutAccount();
        setUser(null);
      },
    }),
    [user, loading, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
