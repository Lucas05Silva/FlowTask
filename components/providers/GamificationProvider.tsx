"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { CelebrationResult } from "@/lib/gamification";
import type { Goal } from "@/types";
import { fireConfetti, fireBigConfetti } from "@/lib/confetti";
import { useToast } from "./ToastProvider";
import { useNotifications } from "@/hooks/useNotifications";
import { LevelUpModal } from "@/components/gamification/LevelUpModal";
import { GoalCompleteModal } from "@/components/gamification/GoalCompleteModal";

interface GamificationContextValue {
  /** Trigger all celebration feedback (confetti + toasts + level-up modal). */
  celebrate: (result: CelebrationResult, opts?: { big?: boolean }) => void;
}

const GamificationContext = createContext<GamificationContextValue | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [levelUp, setLevelUp] = useState<{ level: number; title: string } | null>(null);
  const [completedGoal, setCompletedGoal] = useState<Goal | null>(null);

  const celebrate = useCallback(
    (result: CelebrationResult, opts?: { big?: boolean }) => {
      if (opts?.big || result.completedGoal) void fireBigConfetti();
      else void fireConfetti();

      // XP Toast
      if (result.xpGained > 0 && !result.completedGoal) {
        toast({ variant: "xp", title: `+${result.xpGained} XP`, description: "Mandou bem! 🎉" });
      }

      // 1. Goal Progress Toast
      if (result.goalProgress) {
        const { goal, newValue } = result.goalProgress;
        const totalBlocks = 10;
        const filled = Math.round((newValue / goal.targetAmount) * totalBlocks);
        const bar = "█".repeat(filled) + "░".repeat(totalBlocks - filled);
        const pctVal = Math.round((newValue / goal.targetAmount) * 100);
        const remaining = goal.targetAmount - newValue;

        toast({
          variant: "success",
          title: "🎯 Meta avançou!",
          description: `"${goal.title}"\n${bar} ${newValue}/${goal.targetAmount} (${pctVal}%)\nFaltam ${remaining} ${goal.unit || "itens"} para concluir!`,
        });
      }

      // 2. Goal Complete Celebration
      if (result.completedGoal) {
        setCompletedGoal(result.completedGoal);
        addNotification({
          type: "conquista",
          title: `Meta Concluída: ${result.completedGoal.title}`,
          message: `🏆 Vocês concluíram a meta "${result.completedGoal.title}"! +${result.completedGoal.xpReward} XP.`,
          link: "/metas",
        });
      }

      // 3. Achievements Toasts
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

      // 4. Level Up Celebration
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
      <GoalCompleteModal
        open={completedGoal !== null}
        goal={completedGoal}
        onClose={() => setCompletedGoal(null)}
        onViewGoals={() => {
          setCompletedGoal(null);
          router.push("/metas");
        }}
      />
    </GamificationContext.Provider>
  );
}

export function useGamification(): GamificationContextValue {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error("useGamification must be used within GamificationProvider");
  return ctx;
}
