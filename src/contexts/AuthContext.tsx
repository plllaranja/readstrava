"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface AuthUser {
  id?: string;
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
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
      if (!res.ok) {
        setUser(null);
        setAccessToken(null);
        return null;
      }
      const data = await res.json();
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("rs_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
    refreshToken().finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Erro ao fazer login");
    }
    const data = await res.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
    localStorage.setItem("rs_user", JSON.stringify(data.user));
  };

  const register = async (formData: RegisterData) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Erro ao criar conta");
    }
    const data = await res.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
    localStorage.setItem("rs_user", JSON.stringify(data.user));
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("rs_user");
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
