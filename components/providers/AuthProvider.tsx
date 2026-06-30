"use client";

/* Mount-time hydration sync from localStorage — setState in effect is intentional here. */
/* eslint-disable react-hooks/set-state-in-effect */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/types";
import { getData } from "@/lib/data/store";
import { useData } from "@/hooks/useData";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_KEY = "flowtask:auth";

/** Mock credentials — replaced by Supabase Auth in the integration phase. */
const MOCK_PASSWORD = "flowtask";

export function AuthProvider({ children }: { children: ReactNode }) {
  const data = useData();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUserId(localStorage.getItem(AUTH_KEY));
    setLoading(false);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    const match = getData().users.find((u) => u.email.toLowerCase() === normalized);
    if (!match) return { ok: false, error: "E-mail não encontrado." };
    if (password !== MOCK_PASSWORD) return { ok: false, error: "Senha incorreta." };
    localStorage.setItem(AUTH_KEY, match.id);
    setUserId(match.id);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setUserId(null);
  }, []);

  const user = userId ? (data.users.find((u) => u.id === userId) ?? null) : null;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
