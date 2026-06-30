"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star, Award, CheckCircle2, type LucideIcon } from "lucide-react";

type ToastVariant = "xp" | "achievement" | "success";

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
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
  achievement: Award,
  success: CheckCircle2,
};
const ACCENT: Record<ToastVariant, string> = {
  xp: "var(--brand-purple)",
  achievement: "var(--prio-alta)",
  success: "var(--success)",
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((t: ToastInput) => {
    const id = ++counter;
    setItems((prev) => [...prev, { id, variant: "xp", ...t }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[60] flex flex-col items-end gap-2 md:bottom-6">
        <AnimatePresence>
          {items.map((item) => {
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
