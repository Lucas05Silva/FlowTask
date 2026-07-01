"use client";

import { useCallback } from "react";
import type { WeddingTask, WeddingBudgetItem, WeddingVendor, FlowTaskData, Achievement } from "@/types";
import { updateData } from "@/lib/data/store";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/components/providers/AuthProvider";
import { levelFromXp, type CelebrationResult } from "@/lib/gamification";
import { uid, pct, daysUntil } from "@/lib/utils";

export interface WeddingTaskFormData {
  title: string;
  description: string;
  deadline: string | null;
  assignee: "lucas" | "thaiane" | "ambos";
  status: "a_fazer" | "fazendo" | "concluida";
  category: string;
}

export interface WeddingVendorFormData {
  name: string;
  service: string;
  contactPhone: string | null;
  contactEmail: string | null;
  quotedValue: number;
  status: "pesquisando" | "orcado" | "contratado" | "pago";
  notes: string;
}

export function useWedding() {
  const data = useData();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const tasks = data.weddingTasks || [];
  const budget = data.weddingBudget || [];
  const vendors = data.weddingVendors || [];
  const weddingDate = data.weddingDate || null;
  const weddingVenueName = data.weddingVenueName || null;
  const weddingVenueAddress = data.weddingVenueAddress || null;

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

  // Configuration getters/setters
  const updateWeddingConfig = useCallback(
    (config: { weddingDate: string | null; venueName?: string | null; venueAddress?: string | null }): CelebrationResult | null => {
      let celebration: CelebrationResult | null = null;
      updateData((d) => {
        const updated = {
          ...d,
          weddingDate: config.weddingDate,
          weddingVenueName: config.venueName ?? d.weddingVenueName,
          weddingVenueAddress: config.venueAddress ?? d.weddingVenueAddress,
        };
        // Award 10 XP for setting up date if not set before
        if (config.weddingDate && !d.weddingDate) {
          const { nextData, result } = rewardUser(updated, 10);
          celebration = result;
          return nextData;
        }
        return updated;
      });
      return celebration;
    },
    [rewardUser]
  );

  // CRUD WeddingTask
  const createWeddingTask = useCallback(
    (form: WeddingTaskFormData): CelebrationResult | null => {
      let celebration: CelebrationResult | null = null;
      updateData((d) => {
        const newTask: WeddingTask = {
          id: uid("wt"),
          title: form.title.trim(),
          description: form.description.trim(),
          deadline: form.deadline,
          assignee: form.assignee,
          status: form.status,
          category: form.category.trim().toLowerCase(),
          createdAt: new Date().toISOString(),
          completedAt: form.status === "concluida" ? new Date().toISOString() : null,
        };

        const withTask = { ...d, weddingTasks: [...(d.weddingTasks || []), newTask] };

        if (newTask.status === "concluida") {
          const allCompleted = withTask.weddingTasks.every((t) => t.status === "concluida");
          const achId = allCompleted ? "ach_iaccept" : undefined;
          const { nextData, result } = rewardUser(withTask, 20, achId);
          celebration = result;
          return nextData;
        }

        return withTask;
      });
      return celebration;
    },
    [rewardUser]
  );

  const updateWeddingTask = useCallback(
    (id: string, patch: Partial<WeddingTask>): CelebrationResult | null => {
      let celebration: CelebrationResult | null = null;
      updateData((d) => {
        const oldTask = (d.weddingTasks || []).find((t) => t.id === id);
        if (!oldTask) return d;

        const updatedTasks = (d.weddingTasks || []).map((t) => {
          if (t.id === id) {
            const nextStatus = patch.status ?? t.status;
            return {
              ...t,
              ...patch,
              completedAt: nextStatus === "concluida" && t.status !== "concluida"
                ? new Date().toISOString()
                : nextStatus !== "concluida"
                ? null
                : t.completedAt,
            };
          }
          return t;
        });

        const withUpdates = { ...d, weddingTasks: updatedTasks };

        const wasCompleted = oldTask.status === "concluida";
        const isCompleted = (patch.status ?? oldTask.status) === "concluida";

        if (isCompleted && !wasCompleted) {
          const allCompleted = updatedTasks.every((t) => t.status === "concluida");
          const achId = allCompleted ? "ach_iaccept" : undefined;
          const { nextData, result } = rewardUser(withUpdates, 20, achId);
          celebration = result;
          return nextData;
        }

        return withUpdates;
      });
      return celebration;
    },
    [rewardUser]
  );

  const deleteWeddingTask = useCallback((id: string) => {
    updateData((d) => ({
      ...d,
      weddingTasks: (d.weddingTasks || []).filter((t) => t.id !== id),
    }));
  }, []);

  // CRUD WeddingBudget
  const createWeddingBudgetCategory = useCallback((category: string, estimatedCost: number) => {
    updateData((d) => {
      const exists = (d.weddingBudget || []).some((b) => b.category === category);
      if (exists) return d;
      const newItem: WeddingBudgetItem = {
        id: uid("wb"),
        category: category.trim().toLowerCase(),
        estimatedCost,
        actualCost: 0,
        notes: "",
      };
      return {
        ...d,
        weddingBudget: [...(d.weddingBudget || []), newItem],
      };
    });
  }, []);

  const updateWeddingBudgetCategory = useCallback((id: string, patch: Partial<WeddingBudgetItem>) => {
    updateData((d) => ({
      ...d,
      weddingBudget: (d.weddingBudget || []).map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }, []);

  const deleteWeddingBudgetCategory = useCallback((id: string) => {
    updateData((d) => ({
      ...d,
      weddingBudget: (d.weddingBudget || []).filter((b) => b.id !== id),
    }));
  }, []);

  // CRUD WeddingVendor
  const createWeddingVendor = useCallback(
    (form: WeddingVendorFormData): CelebrationResult | null => {
      let celebration: CelebrationResult | null = null;
      updateData((d) => {
        const newVendor: WeddingVendor = {
          id: uid("wv"),
          name: form.name.trim(),
          service: form.service.trim(),
          contactPhone: form.contactPhone ? form.contactPhone.trim() : null,
          contactEmail: form.contactEmail ? form.contactEmail.trim() : null,
          quotedValue: form.quotedValue,
          status: form.status,
          notes: form.notes ? form.notes.trim() : "",
        };

        const withVendor = { ...d, weddingVendors: [...(d.weddingVendors || []), newVendor] };

        if (newVendor.status === "contratado") {
          const { nextData, result } = rewardUser(withVendor, 30);
          celebration = result;
          return nextData;
        }

        return withVendor;
      });
      return celebration;
    },
    [rewardUser]
  );

  const updateWeddingVendor = useCallback(
    (id: string, patch: Partial<WeddingVendor>): CelebrationResult | null => {
      let celebration: CelebrationResult | null = null;
      updateData((d) => {
        const oldVendor = (d.weddingVendors || []).find((v) => v.id === id);
        if (!oldVendor) return d;

        const updatedVendors = (d.weddingVendors || []).map((v) =>
          v.id === id ? { ...v, ...patch } : v
        );

        const withUpdates = { ...d, weddingVendors: updatedVendors };

        const wasContratado = oldVendor.status === "contratado";
        const isContratado = (patch.status ?? oldVendor.status) === "contratado";

        if (isContratado && !wasContratado) {
          const { nextData, result } = rewardUser(withUpdates, 30);
          celebration = result;
          return nextData;
        }

        return withUpdates;
      });
      return celebration;
    },
    [rewardUser]
  );

  const deleteWeddingVendor = useCallback((id: string) => {
    updateData((d) => ({
      ...d,
      weddingVendors: (d.weddingVendors || []).filter((v) => v.id !== id),
    }));
  }, []);

  // Aggregations & helper calculations
  const getChecklistProgress = useCallback(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "concluida").length;
    return {
      total,
      completed,
      percentage: pct(completed, total),
    };
  }, [tasks]);

  const getBudgetTotals = useCallback(() => {
    const estimated = budget.reduce((s, b) => s + b.estimatedCost, 0);
    const actual = budget.reduce((s, b) => s + b.actualCost, 0);
    return {
      estimated,
      actual,
      difference: estimated - actual,
    };
  }, [budget]);

  const getDaysUntilWedding = useCallback(() => {
    if (!weddingDate) return null;
    return daysUntil(weddingDate);
  }, [weddingDate]);

  // Builds vertical timeline marcos
  const getTimelineItems = useCallback(() => {
    const list: Array<{
      id: string;
      title: string;
      date: string;
      type: "task" | "wedding_day";
      isCompleted: boolean;
      assignee?: string;
      category?: string;
    }> = [];

    // Add tasks with deadlines
    tasks.forEach((t) => {
      if (t.deadline) {
        list.push({
          id: t.id,
          title: t.title,
          date: t.deadline,
          type: "task",
          isCompleted: t.status === "concluida",
          assignee: t.assignee,
          category: t.category,
        });
      }
    });

    // Add wedding day milestone if defined
    if (weddingDate) {
      const isPast = daysUntil(weddingDate) < 0;
      list.push({
        id: "wedding_day",
        title: "O Grande Dia! 💒",
        date: weddingDate,
        type: "wedding_day",
        isCompleted: isPast,
      });
    }

    // Sort chronologically
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tasks, weddingDate]);

  return {
    tasks,
    budget,
    vendors,
    weddingDate,
    weddingVenueName,
    weddingVenueAddress,
    updateWeddingConfig,
    createWeddingTask,
    updateWeddingTask,
    deleteWeddingTask,
    createWeddingBudgetCategory,
    updateWeddingBudgetCategory,
    deleteWeddingBudgetCategory,
    createWeddingVendor,
    updateWeddingVendor,
    deleteWeddingVendor,
    getChecklistProgress,
    getBudgetTotals,
    getDaysUntilWedding,
    getTimelineItems,
  };
}
