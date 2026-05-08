/**
 * Authentication Context (SEC-001)
 *
 * Centralizes authentication state.
 * Access token is stored only in memory, refresh token in HttpOnly cookie.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { clearAccessToken, setAccessToken, subscribeAccessToken, subscribeLogout } from "@/lib/auth-token-store";

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

async function fetchSession(): Promise<{ token: string; user: AuthUser } | null> {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (!data?.token || !data?.user) {
    return null;
  }

  return {
    token: data.token as string,
    user: data.user as AuthUser,
  };
}

function clearLegacyAuthStorage(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const userRef = useRef<AuthUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const hydrateSession = useCallback(async () => {
    clearLegacyAuthStorage();

    try {
      const session = await fetchSession();
      if (!session) {
        clearAccessToken({ broadcast: false });
        setToken(null);
        setUser(null);
        return;
      }

      setAccessToken(session.token, { broadcast: false });
      setToken(session.token);
      setUser(session.user);
    } catch {
      clearAccessToken({ broadcast: false });
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      await hydrateSession();
      if (isMounted) {
        setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [hydrateSession]);

  const login = useCallback((nextToken: string, nextUser: AuthUser) => {
    clearLegacyAuthStorage();
    setAccessToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
    } catch {
      // Best effort logout.
    } finally {
      clearLegacyAuthStorage();
      clearAccessToken();
      setToken(null);
      setUser(null);
      setLocation("/auth");
    }
  }, [setLocation]);

  useEffect(() => {
    const unsubscribeToken = subscribeAccessToken((nextToken) => {
      setToken(nextToken);
      if (!nextToken) {
        setUser(null);
        return;
      }

      if (!userRef.current) {
        void hydrateSession();
      }
    });

    const unsubscribeLogout = subscribeLogout(() => {
      clearLegacyAuthStorage();
      setUser(null);
      setToken(null);

      if (!window.location.pathname.startsWith("/auth")) {
        setLocation("/auth");
      }
    });

    return () => {
      unsubscribeToken();
      unsubscribeLogout();
    };
  }, [hydrateSession, setLocation]);

  // Listen for 401 responses globally to auto-logout
  useEffect(() => {
    const handleUnauthorized = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.status === 401) {
        void logout();
      }
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [logout]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
