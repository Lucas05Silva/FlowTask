"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star, Award, CheckCircle2, Trophy, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "xp" | "achievement" | "success";
type ToastPosition = "bottom-right" | "top-center";

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  position?: ToastPosition;
}

interface ToastItem extends ToastInput {
  id: number;
}

interface ToastContextValue {
  toast: (t: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, LucideIcon> = {
  xp: Star,
  achievement: Trophy,
  success: CheckCircle2,
};

const ACCENT: Record<ToastVariant, string> = {
  xp: "var(--brand-purple)",
  achievement: "#F59E0B", // Amber / Gold
  success: "var(--success)",
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((t: ToastInput) => {
    const id = ++counter;
    const isAchievement = t.variant === "achievement";
    const position = t.position || (isAchievement ? "top-center" : "bottom-right");
    const duration = isAchievement ? 4000 : 2400;

    setItems((prev) => [...prev, { id, variant: "xp", position, ...t }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), duration);
  }, []);

  const topCenterItems = items.filter((i) => i.position === "top-center");
  const bottomRightItems = items.filter((i) => i.position === "bottom-right");

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* TOP CENTER TOAST CONTAINER (Achievement) */}
      <div className="pointer-events-none fixed top-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
        <AnimatePresence>
          {topCenterItems.map((item) => {
            const Icon = ICONS[item.variant ?? "xp"];
            const isAch = item.variant === "achievement";

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.9 }}
                transition={{ type: "spring", damping: 20, stiffness: 350 }}
                className={cn(
                  "pointer-events-auto flex items-center gap-3.5 rounded-card border px-5 py-3.5 shadow-pop min-w-[280px] max-w-[400px]",
                  isAch
                    ? "border-amber-400 bg-gradient-to-r from-amber-500/10 to-amber-600/5 dark:from-amber-500/15 dark:to-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                    : "border-line bg-surface"
                )}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-500/20 border border-amber-300/40 text-amber-500 animate-bounce">
                  <Icon className="size-5.5 fill-amber-500/10" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs text-muted font-bold leading-normal mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* BOTTOM RIGHT TOAST CONTAINER (XP / Success) */}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[60] flex flex-col items-end gap-2 md:bottom-6">
        <AnimatePresence>
          {bottomRightItems.map((item) => {
            const Icon = ICONS[item.variant ?? "xp"];
            const accent = ACCENT[item.variant ?? "xp"];

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.9 }}
                transition={{ type: "spring", damping: 24, stiffness: 320 }}
                className="pointer-events-auto flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-pop"
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full"
                  style={{ backgroundColor: `color-mix(in srgb, ${accent} 18%, transparent)`, color: accent }}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-content">{item.title}</p>
                  {item.description && <p className="text-xs text-muted">{item.description}</p>}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
