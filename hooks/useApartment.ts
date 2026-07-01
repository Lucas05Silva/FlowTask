"use client";

import { useCallback } from "react";
import type { ApartmentItem, ItemPriority, ItemStatus, FlowTaskData, Achievement } from "@/types";
import { updateData } from "@/lib/data/store";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/components/providers/AuthProvider";
import { levelFromXp, type CelebrationResult } from "@/lib/gamification";
import { uid, pct } from "@/lib/utils";

export interface ApartmentItemFormData {
  room: string;
  name: string;
  estimatedCost: number;
  actualCost: number | null;
  priority: ItemPriority;
  status: ItemStatus;
  purchaseDeadline: string | null;
  storeLink: string | null;
  notes: string;
}

export function useApartment() {
  const data = useData();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const items = data.apartmentItems || [];

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

  const createItem = useCallback(
    (form: ApartmentItemFormData): CelebrationResult | null => {
      if (!userId) return null;
      let celebration: CelebrationResult | null = null;

      updateData((d) => {
        const newItem: ApartmentItem = {
          id: uid("ai"),
          room: form.room.trim(),
          name: form.name.trim(),
          estimatedCost: form.estimatedCost,
          actualCost: form.actualCost,
          priority: form.priority,
          status: form.status,
          purchaseDeadline: form.purchaseDeadline,
          storeLink: form.storeLink ? form.storeLink.trim() : null,
          notes: form.notes ? form.notes.trim() : "",
          createdBy: userId,
          createdAt: new Date().toISOString(),
        };

        const withItem = { ...d, apartmentItems: [...(d.apartmentItems || []), newItem] };

        // If it starts as comprado/entregue, reward XP!
        const isCompleted = newItem.status === "comprado" || newItem.status === "entregue";
        if (isCompleted) {
          // Check for ach_nest (Ninho pronto)
          const allCompleted = withItem.apartmentItems.every(
            (i) => i.status === "comprado" || i.status === "entregue"
          );
          const achId = allCompleted ? "ach_nest" : undefined;
          
          const { nextData, result } = rewardUser(withItem, 20, achId);
          celebration = result;
          return nextData;
        }

        return withItem;
      });

      return celebration;
    },
    [userId, rewardUser]
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<ApartmentItem>): CelebrationResult | null => {
      if (!userId) return null;
      let celebration: CelebrationResult | null = null;

      updateData((d) => {
        const oldItem = (d.apartmentItems || []).find((i) => i.id === id);
        if (!oldItem) return d;

        const updatedItems = (d.apartmentItems || []).map((i) =>
          i.id === id ? { ...i, ...patch } : i
        );

        const withUpdates = { ...d, apartmentItems: updatedItems };

        const wasCompleted = oldItem.status === "comprado" || oldItem.status === "entregue";
        const isCompleted = patch.status === "comprado" || patch.status === "entregue";

        if (isCompleted && !wasCompleted) {
          // Check for ach_nest (Ninho pronto)
          const allCompleted = updatedItems.every(
            (i) => i.status === "comprado" || i.status === "entregue"
          );
          const achId = allCompleted ? "ach_nest" : undefined;

          const { nextData, result } = rewardUser(withUpdates, 20, achId);
          celebration = result;
          return nextData;
        }

        return withUpdates;
      });

      return celebration;
    },
    [userId, rewardUser]
  );

  const deleteItem = useCallback((id: string) => {
    updateData((d) => ({
      ...d,
      apartmentItems: (d.apartmentItems || []).filter((i) => i.id !== id),
    }));
  }, []);

  const getTotalEstimated = useCallback(() => {
    return items.reduce((sum, i) => sum + i.estimatedCost, 0);
  }, [items]);

  const getTotalSpent = useCallback(() => {
    return items
      .filter((i) => i.status === "comprado" || i.status === "entregue")
      .reduce((sum, i) => sum + (i.actualCost ?? i.estimatedCost), 0);
  }, [items]);

  const getProgress = useCallback(() => {
    const total = items.length;
    const completed = items.filter((i) => i.status === "comprado" || i.status === "entregue").length;
    return {
      total,
      completed,
      percentage: pct(completed, total),
    };
  }, [items]);

  const getProgressByPriority = useCallback(() => {
    const priorities: ItemPriority[] = ["essencial", "importante", "desejavel"];
    const breakdown = priorities.reduce((acc, p) => {
      const subItems = items.filter((i) => i.priority === p);
      const total = subItems.length;
      const completed = subItems.filter((i) => i.status === "comprado" || i.status === "entregue").length;
      acc[p] = {
        total,
        completed,
        percentage: pct(completed, total),
      };
      return acc;
    }, {} as Record<ItemPriority, { total: number; completed: number; percentage: number }>);

    return breakdown;
  }, [items]);

  const getProgressByRoom = useCallback(
    (roomName: string) => {
      const subItems = items.filter((i) => i.room.toLowerCase() === roomName.toLowerCase());
      const total = subItems.length;
      const completed = subItems.filter((i) => i.status === "comprado" || i.status === "entregue").length;
      return {
        total,
        completed,
        percentage: pct(completed, total),
      };
    },
    [items]
  );

  const getRooms = useCallback(() => {
    const defaults = ["sala", "quarto", "cozinha", "banheiro", "lavanderia", "escritório"];
    const list = items.map((i) => i.room.trim().toLowerCase());
    const merged = Array.from(new Set([...defaults, ...list]));
    
    // Sort room names so defaults come first or they are sorted alphabetically
    return merged.sort((a, b) => {
      const idxA = defaults.indexOf(a);
      const idxB = defaults.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [items]);

  return {
    items,
    createItem,
    updateItem,
    deleteItem,
    getTotalEstimated,
    getTotalSpent,
    getProgress,
    getProgressByPriority,
    getProgressByRoom,
    getRooms,
  };
}
