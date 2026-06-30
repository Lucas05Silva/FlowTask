"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { Logo } from "@/components/Logo";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas">
        <div className="animate-pulse">
          <Logo size={40} />
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
