"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface AuthUser {
  username: string;
  name: string;
  avatarUrl: string | null;
  isPublic: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  updateUser: (updates: Partial<AuthUser>) => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_USER = "rs_user";
const STORAGE_TOKEN = "rs_token";
const STORAGE_TOKEN_EXP = "rs_token_exp";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const saveSession = (u: AuthUser, token: string) => {
    setUser(u);
    setAccessToken(token);
    localStorage.setItem(STORAGE_USER, JSON.stringify(u));
    localStorage.setItem(STORAGE_TOKEN, token);
    localStorage.setItem(STORAGE_TOKEN_EXP, String(Date.now() + 14 * 60 * 1000)); // 14min
  };

  const clearSession = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(STORAGE_USER);
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_TOKEN_EXP);
  };

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      setAccessToken(data.accessToken);
      localStorage.setItem(STORAGE_TOKEN, data.accessToken);
      localStorage.setItem(STORAGE_TOKEN_EXP, String(Date.now() + 14 * 60 * 1000));
      return data.accessToken;
    } catch {
      return null;
    }
  }, []);

  // On mount: restore from localStorage, then validate with server
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_USER);
    const storedToken = localStorage.getItem(STORAGE_TOKEN);
    const storedExp = localStorage.getItem(STORAGE_TOKEN_EXP);

    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }

    const tokenStillValid = storedToken && storedExp && Date.now() < Number(storedExp);

    if (tokenStillValid) {
      setAccessToken(storedToken);
      setLoading(false);
    } else {
      // Try to get a new access token via refresh cookie
      refreshToken().then((token) => {
        if (!token && !storedUser) {
          // No refresh token AND no stored user — truly logged out
          clearSession();
        }
        // If there's a stored user but refresh failed, keep them logged in
        // (next API call will try again)
        setLoading(false);
      });
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Erro ao fazer login");
    saveSession(data.user, data.accessToken);
  };

  const register = async (formData: RegisterData) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Erro ao criar conta");
    saveSession(data.user, data.accessToken);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    clearSession();
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_USER, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout, refreshToken, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
