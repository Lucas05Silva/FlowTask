"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { CelebrationResult } from "@/lib/gamification";
import { fireConfetti, fireBigConfetti } from "@/lib/confetti";
import { useToast } from "./ToastProvider";
import { useNotifications } from "@/hooks/useNotifications";
import { LevelUpModal } from "@/components/gamification/LevelUpModal";

interface GamificationContextValue {
  /** Trigger all celebration feedback (confetti + toasts + level-up modal). */
  celebrate: (result: CelebrationResult, opts?: { big?: boolean }) => void;
}

const GamificationContext = createContext<GamificationContextValue | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [levelUp, setLevelUp] = useState<{ level: number; title: string } | null>(null);

  const celebrate = useCallback(
    (result: CelebrationResult, opts?: { big?: boolean }) => {
      if (opts?.big) void fireBigConfetti();
      else void fireConfetti();
      if (result.xpGained > 0) {
        toast({ variant: "xp", title: `+${result.xpGained} XP`, description: "Mandou bem! 🎉" });
      }
      result.achievements.forEach((ach, i) => {
        setTimeout(
          () => toast({ variant: "achievement", title: `Conquista: ${ach.title}`, description: ach.description }),
          (i + 1) * 350,
        );
        // Persist a real-time notification (title includes the achievement name for dedup).
        addNotification({
          type: "conquista",
          title: `Conquista: ${ach.title}`,
          message: `🏆 Você desbloqueou "${ach.title}"!`,
          link: "/perfil",
        });
      });
      if (result.leveledUp) {
        void fireBigConfetti();
        setLevelUp({ level: result.newLevel, title: result.newTitle });
        addNotification({
          type: "levelup",
          title: `Nível ${result.newLevel} alcançado`,
          message: `⬆️ Parabéns! Você subiu para o Nível ${result.newLevel} — ${result.newTitle}!`,
          link: "/perfil",
        });
      }
    },
    [toast, addNotification],
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
