"use client";

/* Mount-time hydration sync from localStorage / system theme — setState in effect is intentional. */
/* eslint-disable react-hooks/set-state-in-effect */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";
type ThemeSetting = Theme | "system";

interface ThemeContextValue {
  /** The resolved theme actually applied to the DOM. */
  theme: Theme;
  /** The user's preference (may be "system"). */
  setting: ThemeSetting;
  setSetting: (s: ThemeSetting) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "flowtask:theme";

function systemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolve(setting: ThemeSetting): Theme {
  return setting === "system" ? systemTheme() : setting;
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [setting, setSettingState] = useState<ThemeSetting>("system");
  const [theme, setTheme] = useState<Theme>("light");

  // Initialise from storage on mount.
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeSetting | null) ?? "system";
    setSettingState(stored);
    const resolved = resolve(stored);
    setTheme(resolved);
    applyTheme(resolved);
  }, []);

  // React to system changes while on "system".
  useEffect(() => {
    if (setting !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = systemTheme();
      setTheme(resolved);
      applyTheme(resolved);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setting]);

  const setSetting = useCallback((s: ThemeSetting) => {
    setSettingState(s);
    localStorage.setItem(STORAGE_KEY, s);
    const resolved = resolve(s);
    setTheme(resolved);
    applyTheme(resolved);
  }, []);

  const toggle = useCallback(() => {
    setSetting(resolve(setting) === "dark" ? "light" : "dark");
  }, [setting, setSetting]);

  return (
    <ThemeContext.Provider value={{ theme, setting, setSetting, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/** Inline script string to set the theme before hydration (no FOUC). */
export const themeInitScript = `
(function(){
  try {
    var s = localStorage.getItem('${STORAGE_KEY}') || 'system';
    var dark = s === 'dark' || (s === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var t = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t;
  } catch(e){}
})();
`;
