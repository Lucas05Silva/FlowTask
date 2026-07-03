"use client";

/* Session state is synced from Supabase Auth — setState in effect is intentional. */
/* eslint-disable react-hooks/set-state-in-effect */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { User } from "@/types";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { hydrate, teardownData } from "@/lib/data/store";
import { useData } from "@/hooks/useData";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "E-mail ainda não confirmado.";
  if (m.includes("network")) return "Falha de conexão. Tente novamente.";
  return "Não foi possível entrar.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const data = useData();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    const sb = getSupabase();
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) void hydrate();
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) void hydrate();
      else teardownData();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!supabaseConfigured) return { ok: false, error: "Supabase não configurado." };
    const { error } = await getSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { ok: false, error: translateError(error.message) };
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    if (supabaseConfigured) await getSupabase().auth.signOut();
    teardownData();
  }, []);

  const user = session
    ? data.users.find(
        (u) =>
          u.id === session.user.id ||
          (!!session.user.email && u.email.toLowerCase() === session.user.email.toLowerCase()),
      ) ?? null
    : null;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
