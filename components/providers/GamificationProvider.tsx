"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { CelebrationResult } from "@/lib/gamification";
import { fireConfetti, fireBigConfetti } from "@/lib/confetti";
import { useToast } from "./ToastProvider";
import { LevelUpModal } from "@/components/gamification/LevelUpModal";

interface GamificationContextValue {
  /** Trigger all celebration feedback (confetti + toasts + level-up modal). */
  celebrate: (result: CelebrationResult) => void;
}

const GamificationContext = createContext<GamificationContextValue | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [levelUp, setLevelUp] = useState<{ level: number; title: string } | null>(null);

  const celebrate = useCallback(
    (result: CelebrationResult) => {
      void fireConfetti();
      if (result.xpGained > 0) {
        toast({ variant: "xp", title: `+${result.xpGained} XP`, description: "Mandou bem! 🎉" });
      }
      result.achievements.forEach((ach, i) => {
        setTimeout(
          () => toast({ variant: "achievement", title: `Conquista: ${ach.title}`, description: ach.description }),
          (i + 1) * 350,
        );
      });
      if (result.leveledUp) {
        void fireBigConfetti();
        setLevelUp({ level: result.newLevel, title: result.newTitle });
      }
    },
    [toast],
  );

  return (
    <GamificationContext.Provider value={{ celebrate }}>
      {children}
      <LevelUpModal
        open={levelUp !== null}
        level={levelUp?.level ?? 1}
        title={levelUp?.title ?? ""}
        onClose={() => setLevelUp(null)}
      />
    </GamificationContext.Provider>
  );
}

export function useGamification(): GamificationContextValue {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error("useGamification must be used within GamificationProvider");
  return ctx;
}
