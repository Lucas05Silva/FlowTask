"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { getHydrated, getHydrateError, retryHydrate, subscribe } from "@/lib/data/store";
import { supabaseConfigured } from "@/lib/supabase/client";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { Logo } from "@/components/Logo";
import { ErrorState } from "@/components/ui/ErrorState";

const LEGACY_CLEAN_KEY = "flowtask_storage_cleaned_v1";

/** One-time removal of legacy mock localStorage keys (pre-Supabase). */
function cleanLegacyStorage() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(LEGACY_CLEAN_KEY)) return;
  Object.keys(localStorage)
    .filter((k) => k === "flowtask:data" || k === "flowtask:version" || k === "flowtask:auth")
    .forEach((k) => localStorage.removeItem(k));
  localStorage.setItem(LEGACY_CLEAN_KEY, "true");
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hydrated = useSyncExternalStore(subscribe, getHydrated, () => false);
  const hydrateError = useSyncExternalStore(subscribe, getHydrateError, () => null);
  const dataReady = hydrated || !supabaseConfigured;

  useEffect(() => {
    cleanLegacyStorage();
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Authenticated but data failed to load → error with retry.
  if (user && supabaseConfigured && !hydrated && hydrateError) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas px-4">
        <div className="w-full max-w-md">
          <ErrorState
            message="Não foi possível sincronizar com o servidor. Verifique sua conexão e tente de novo."
            onRetry={() => void retryHydrate()}
          />
        </div>
      </div>
    );
  }

  if (loading || !user || !dataReady) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-pulse">
            <Logo size={40} />
          </div>
          {user && !dataReady && <p className="text-sm text-muted">Sincronizando seus dados…</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-canvas bg-aurora">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 px-4 pb-24 pt-6 md:pb-10 lg:px-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
