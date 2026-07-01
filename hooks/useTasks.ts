"use client";

import { useCallback } from "react";
import type {
  Assignee,
  Category,
  Priority,
  RecurrenceRule,
  Subtask,
  Task,
  TaskStatus,
  FlowTaskData,
  Achievement,
} from "@/types";
import { updateData } from "@/lib/data/store";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  XP,
  taskXp,
  levelFromXp,
  nextRecurrence,
  evaluateAchievements,
  type CelebrationResult,
} from "@/lib/gamification";
import { uid, todayISO } from "@/lib/utils";

export interface TaskFormData {
  title: string;
  description: string;
  dueDate: string | null;
  priority: Priority;
  category: Category;
  assignee: Assignee;
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  subtasks: Subtask[];
  goalId: string | null;
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function buildTask(form: TaskFormData, assignee: Assignee, order: number, userId: string): Task {
  return {
    id: uid("t"),
    title: form.title.trim(),
    description: form.description.trim(),
    dueDate: form.dueDate || null,
    priority: form.priority,
    category: form.category,
    status: "a_fazer",
    assignee,
    subtasks: form.subtasks,
    isRecurring: form.isRecurring,
    recurrenceRule: form.isRecurring ? form.recurrenceRule : null,
    parentTaskId: null,
    goalId: form.goalId,
    xpReward: taskXp(form.priority),
    order,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}

export function useTasks() {
  const data = useData();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const createTask = useCallback(
    (form: TaskFormData) => {
      if (!userId) return;
      updateData((d) => {
        const baseOrder = d.tasks.reduce((m, t) => Math.max(m, t.order), 0) + 1;
        const newTasks: Task[] =
          form.assignee === "ambos"
            ? [
                buildTask(form, "lucas", baseOrder, userId),
                buildTask({ ...form, subtasks: form.subtasks.map((s) => ({ ...s, id: uid("s") })) }, "thaiane", baseOrder + 1, userId),
              ]
            : [buildTask(form, form.assignee, baseOrder, userId)];
        return { ...d, tasks: [...d.tasks, ...newTasks] };
      });
    },
    [userId],
  );

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    updateData((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === id
          ? { ...t, ...patch, xpReward: patch.priority ? taskXp(patch.priority) : t.xpReward }
          : t,
      ),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    updateData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
  }, []);

  /** Complete a task: awards XP/streak/achievements to the logged user, handles recurrence + goals. */
  const completeTask = useCallback(
    (id: string): CelebrationResult | null => {
      if (!userId) return null;
      let result: CelebrationResult | null = null;

      updateData((d) => {
        const task = d.tasks.find((t) => t.id === id);
        if (!task || task.status === "concluida") return d;

        const today = todayISO();
        const nowIso = new Date().toISOString();

        // 1. mark complete
        let tasks = d.tasks.map((t) =>
          t.id === id ? { ...t, status: "concluida" as TaskStatus, completedAt: nowIso } : t,
        );

        // 2. recurrence → spawn next occurrence
        if (task.isRecurring) {
          tasks = [
            ...tasks,
            {
              ...task,
              id: uid("t"),
              status: "a_fazer",
              completedAt: null,
              dueDate: nextRecurrence(task.dueDate, task.recurrenceRule),
              subtasks: task.subtasks.map((s) => ({ ...s, id: uid("s"), done: false })),
              order: tasks.reduce((m, t) => Math.max(m, t.order), 0) + 1,
              createdAt: nowIso,
            },
          ];
        }

        // 3. linked goal progress
        let goals = d.goals;
        if (task.goalId) {
          goals = goals.map((g) => {
            if (g.id !== task.goalId) return g;
            const next = Math.min(g.targetAmount, g.currentAmount + 1);
            return { ...g, currentAmount: next, status: next >= g.targetAmount ? "concluida" : g.status };
          });
        }

        // 4. streak + XP for the logged user
        const users = d.users.map((u) => ({ ...u }));
        const me = users.find((u) => u.id === userId);
        if (!me) return d;

        const xpBefore = me.xp;
        const levelBefore = levelFromXp(xpBefore).level;
        let bonus = 0;

        if (me.streakLastDate !== today) {
          me.streakCount = me.streakLastDate === yesterdayISO() ? me.streakCount + 1 : 1;
          me.streakRecord = Math.max(me.streakRecord || 0, me.streakCount);
          me.streakLastDate = today;
          if (me.streakCount === 7) bonus += XP.streak7;
          if (me.streakCount === 30) bonus += XP.streak30;
        }
        me.xp += task.xpReward + bonus;

        // 5. achievements (evaluate against the updated snapshot)
        const snapshot: FlowTaskData = { ...d, tasks, users, goals };
        const unlockedIds = evaluateAchievements(snapshot, userId);
        let userAchievements = d.userAchievements;
        const unlocked: Achievement[] = [];
        for (const aid of unlockedIds) {
          const ach = d.achievements.find((a) => a.id === aid);
          if (!ach) continue;
          userAchievements = [...userAchievements, { id: uid("ua"), userId, achievementId: aid, unlockedAt: nowIso }];
          me.xp += ach.xpReward;
          unlocked.push(ach);
        }

        // 6. level
        const after = levelFromXp(me.xp);
        me.level = after.level;

        result = {
          xpGained: me.xp - xpBefore,
          leveledUp: after.level > levelBefore,
          newLevel: after.level,
          newTitle: after.title,
          achievements: unlocked,
          streakCount: me.streakCount,
        };

        return { ...d, tasks, users, goals, userAchievements };
      });

      return result;
    },
    [userId],
  );

  /** Change status; routing through completeTask when moving to concluída. */
  const setStatus = useCallback(
    (id: string, status: TaskStatus): CelebrationResult | null => {
      if (status === "concluida") return completeTask(id);
      updateData((d) => ({
        ...d,
        tasks: d.tasks.map((t) => (t.id === id ? { ...t, status, completedAt: null } : t)),
      }));
      return null;
    },
    [completeTask],
  );

  return { tasks: data.tasks, createTask, updateTask, deleteTask, completeTask, setStatus };
}
