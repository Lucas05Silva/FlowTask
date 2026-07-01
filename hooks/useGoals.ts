"use client";

import { useCallback } from "react";
import type { Goal, GoalType, GoalCheckItem, GoalStatus, FlowTaskData, Achievement } from "@/types";
import { updateData } from "@/lib/data/store";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/components/providers/AuthProvider";
import { levelFromXp, type CelebrationResult } from "@/lib/gamification";
import { uid, todayISO } from "@/lib/utils";

export interface GoalFormData {
  title: string;
  description: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  unit?: string;
  checklist?: GoalCheckItem[];
  deadline: string | null;
  category: string | null;
  linkedModule: string | null;
  xpReward: number;
}

export function useGoals() {
  const data = useData();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // Auto-resolve delayed/atrasada status on the fly p/ renderização
  const today = todayISO();
  const goals = data.goals.map((g) => {
    if (g.status !== "concluida" && g.deadline && g.deadline < today) {
      return { ...g, status: "atrasada" as GoalStatus };
    }
    return g;
  });

  const rewardUser = useCallback(
    (d: FlowTaskData, xpReward: number, manualAchievementId?: string): { nextData: FlowTaskData; result: CelebrationResult | null } => {
      if (!userId) return { nextData: d, result: null };

      const users = d.users.map((u) => ({ ...u }));
      const me = users.find((u) => u.id === userId);
      if (!me) return { nextData: d, result: null };

      const xpBefore = me.xp;
      const levelBefore = levelFromXp(xpBefore).level;
      let totalXpGained = xpReward;

      me.xp += xpReward;

      let userAchievements = d.userAchievements;
      const unlocked: Achievement[] = [];

      if (manualAchievementId) {
        const alreadyHas = userAchievements.some(
          (ua) => ua.userId === userId && ua.achievementId === manualAchievementId
        );
        if (!alreadyHas) {
          const ach = d.achievements.find((a) => a.id === manualAchievementId);
          if (ach) {
            userAchievements = [
              ...userAchievements,
              {
                id: uid("ua"),
                userId,
                achievementId: manualAchievementId,
                unlockedAt: new Date().toISOString(),
              },
            ];
            me.xp += ach.xpReward;
            totalXpGained += ach.xpReward;
            unlocked.push(ach);
          }
        }
      }

      const after = levelFromXp(me.xp);
      me.level = after.level;

      const result: CelebrationResult = {
        xpGained: totalXpGained,
        leveledUp: after.level > levelBefore,
        newLevel: after.level,
        newTitle: after.title,
        achievements: unlocked,
        streakCount: me.streakCount,
      };

      return {
        nextData: { ...d, users, userAchievements },
        result,
      };
    },
    [userId]
  );

  const createGoal = useCallback(
    (form: GoalFormData): CelebrationResult | null => {
      if (!userId) return null;
      let celebration: CelebrationResult | null = null;

      updateData((d) => {
        const isDone = form.currentAmount >= form.targetAmount;
        const newGoal: Goal = {
          id: uid("g"),
          title: form.title.trim(),
          description: form.description.trim(),
          type: form.type,
          targetAmount: form.targetAmount,
          currentAmount: form.currentAmount,
          unit: form.unit,
          checklist: form.checklist || [],
          deadline: form.deadline,
          category: form.category || null,
          linkedModule: form.linkedModule || null,
          xpReward: form.xpReward,
          status: isDone ? "concluida" : "em_andamento",
          createdBy: userId,
          createdAt: new Date().toISOString(),
          completedAt: isDone ? new Date().toISOString() : null,
        };

        const withGoal = { ...d, goals: [...d.goals, newGoal] };

        if (isDone) {
          // If it was created as already completed, reward now
          const isFinancial = form.type === "financeira";
          const achievementId = isFinancial ? "ach_saver" : undefined;
          const { nextData, result } = rewardUser(withGoal, form.xpReward, achievementId);
          celebration = result;
          return nextData;
        }

        return withGoal;
      });

      return celebration;
    },
    [userId, rewardUser]
  );

  const updateGoal = useCallback((id: string, patch: Partial<Goal>) => {
    updateData((d) => ({
      ...d,
      goals: d.goals.map((g) => {
        if (g.id !== id) return g;
        const merged = { ...g, ...patch };
        const isDone = merged.currentAmount >= merged.targetAmount;
        return {
          ...merged,
          status: isDone ? "concluida" : "em_andamento",
          completedAt: isDone ? (g.completedAt || new Date().toISOString()) : null,
        };
      }),
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    updateData((d) => ({
      ...d,
      goals: d.goals.filter((g) => g.id !== id),
    }));
  }, []);

  const completeGoal = useCallback(
    (id: string): CelebrationResult | null => {
      if (!userId) return null;
      let celebration: CelebrationResult | null = null;

      updateData((d) => {
        const goal = d.goals.find((g) => g.id === id);
        if (!goal || goal.status === "concluida") return d;

        const updatedGoals = d.goals.map((g) =>
          g.id === id
            ? {
                ...g,
                currentAmount: g.targetAmount,
                status: "concluida" as GoalStatus,
                completedAt: new Date().toISOString(),
              }
            : g
        );

        const withCompletion = { ...d, goals: updatedGoals };
        const isFinancial = goal.type === "financeira";
        const achievementId = isFinancial ? "ach_saver" : undefined;

        const { nextData, result } = rewardUser(withCompletion, goal.xpReward, achievementId);
        celebration = result;
        return nextData;
      });

      return celebration;
    },
    [userId, rewardUser]
  );

  const updateProgress = useCallback(
    (id: string, nextValue: number): CelebrationResult | null => {
      if (!userId) return null;
      let celebration: CelebrationResult | null = null;

      updateData((d) => {
        const goal = d.goals.find((g) => g.id === id);
        if (!goal || goal.status === "concluida") return d;

        const clampedValue = Math.min(goal.targetAmount, Math.max(0, nextValue));
        const isDoneNow = clampedValue >= goal.targetAmount;

        const updatedGoals = d.goals.map((g) =>
          g.id === id
            ? {
                ...g,
                currentAmount: clampedValue,
                status: (isDoneNow ? "concluida" : "em_andamento") as GoalStatus,
                completedAt: isDoneNow ? new Date().toISOString() : null,
              }
            : g
        );

        const withProgress = { ...d, goals: updatedGoals };

        if (isDoneNow) {
          const isFinancial = goal.type === "financeira";
          const achievementId = isFinancial ? "ach_saver" : undefined;
          const { nextData, result } = rewardUser(withProgress, goal.xpReward, achievementId);
          celebration = result;
          return nextData;
        }

        return withProgress;
      });

      return celebration;
    },
    [userId, rewardUser]
  );

  const toggleCheckItem = useCallback(
    (goalId: string, itemId: string): CelebrationResult | null => {
      if (!userId) return null;
      let celebration: CelebrationResult | null = null;

      updateData((d) => {
        const goal = d.goals.find((g) => g.id === goalId);
        if (!goal || goal.status === "concluida" || !goal.checklist) return d;

        const nextChecklist = goal.checklist.map((item) =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        );

        const completedCount = nextChecklist.filter((item) => item.completed).length;
        const totalCount = nextChecklist.length;
        const isDoneNow = completedCount === totalCount;

        const updatedGoals = d.goals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                checklist: nextChecklist,
                currentAmount: completedCount,
                targetAmount: totalCount,
                status: (isDoneNow ? "concluida" : "em_andamento") as GoalStatus,
                completedAt: isDoneNow ? new Date().toISOString() : null,
              }
            : g
        );

        const withToggle = { ...d, goals: updatedGoals };

        if (isDoneNow) {
          const isFinancial = goal.type === "financeira";
          const achievementId = isFinancial ? "ach_saver" : undefined;
          const { nextData, result } = rewardUser(withToggle, goal.xpReward, achievementId);
          celebration = result;
          return nextData;
        }

        return withToggle;
      });

      return celebration;
    },
    [userId, rewardUser]
  );

  return {
    goals,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    updateProgress,
    toggleCheckItem,
  };
}
