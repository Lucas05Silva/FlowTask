"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "./AuthProvider";
import { ToastProvider } from "./ToastProvider";
import { GamificationProvider } from "./GamificationProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <GamificationProvider>{children}</GamificationProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
