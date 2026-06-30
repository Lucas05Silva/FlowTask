"use client";

/* Mount guard to avoid SSR/client icon mismatch — setState in effect is intentional. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      className="grid size-11 place-items-center rounded-input text-muted transition-colors hover:bg-panel hover:text-content"
    >
      {mounted && theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
