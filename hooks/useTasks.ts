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
  GoalContributionType,
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
import { computeTaskGoalContribution, computeGoalProgressRecalculation } from "@/lib/goal-progress";

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
  status: TaskStatus;
  goalContributionType?: GoalContributionType;
  goalContributionValue?: number;
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
    status: form.status || "a_fazer",
    assignee,
    subtasks: form.subtasks,
    isRecurring: form.isRecurring,
    recurrenceRule: form.isRecurring ? form.recurrenceRule : null,
    parentTaskId: null,
    goalId: form.goalId,
    goalContributionType: form.goalContributionType,
    goalContributionValue: form.goalContributionValue,
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

  const deleteTask = useCallback((id: string) => {
    updateData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
  }, []);

  /** Change status manually or via modal — manages goals, recurrence, and awards XP ONLY on the first completion. */
  const updateTaskStatus = useCallback(
    (id: string, newStatus: TaskStatus): CelebrationResult | null => {
      if (!userId) return null;
      let result: CelebrationResult | null = null;

      updateData((d) => {
        const task = d.tasks.find((t) => t.id === id);
        if (!task || task.status === newStatus) return d;

        const nowIso = new Date().toISOString();

        // 1. Update task list status and completedAt (retain if already set)
        let tasks = d.tasks.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              status: newStatus,
              completedAt: newStatus === "concluida" ? (t.completedAt || nowIso) : t.completedAt,
            };
          }
          return t;
        });

        // 2. Compute Linked Goal Progress
        let goals = d.goals.map((g) => ({ ...g }));
        let completedGoalDirectly: any = null;
        let goalProgressInfo: any = null;

        if (task.goalId) {
          const targetGoal = goals.find((g) => g.id === task.goalId);
          if (targetGoal) {
            if (newStatus === "concluida" && targetGoal.status !== "concluida") {
              const allTasksOfGoal = d.tasks.filter((t) => t.goalId === task.goalId);
              const progress = computeTaskGoalContribution(task, targetGoal, allTasksOfGoal);

              if (progress.shouldComplete) {
                targetGoal.currentAmount = progress.newValue;
                targetGoal.status = "concluida";
                targetGoal.completedAt = nowIso;
                completedGoalDirectly = { ...targetGoal };
              } else {
                goalProgressInfo = {
                  goal: { ...targetGoal },
                  previousValue: targetGoal.currentAmount,
                  newValue: progress.newValue,
                };
                targetGoal.currentAmount = progress.newValue;
              }
            } else if (task.status === "concluida" && newStatus !== "concluida") {
              // Reopening task: recalculate progress of the goal from scratch
              const allTasksOfGoal = tasks.filter((t) => t.goalId === task.goalId);
              const progress = computeGoalProgressRecalculation(targetGoal, allTasksOfGoal);

              targetGoal.currentAmount = progress.newValue;
              targetGoal.status = progress.shouldComplete ? "concluida" : "em_andamento";
              targetGoal.completedAt = progress.shouldComplete ? targetGoal.completedAt : null;
            }
          }
        }

        // 3. Award XP ONLY if completed for the FIRST time
        if (newStatus === "concluida" && !task.completedAt) {
          const today = todayISO();
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

          // Cumulate Task XP + Streak bonus + Goal XP (if completed directly)
          let totalXpGained = task.xpReward + bonus;
          if (completedGoalDirectly) {
            totalXpGained += completedGoalDirectly.xpReward;
          }
          me.xp += totalXpGained;

          // Evaluate Achievements
          const snapshot: FlowTaskData = { ...d, tasks, users, goals };
          const unlockedIds = evaluateAchievements(snapshot, userId);

          // Specific Goal completed achievement (e.g. ach_saver if financial type goal is completed)
          if (completedGoalDirectly && completedGoalDirectly.type === "financeira") {
            if (!unlockedIds.includes("ach_saver")) {
              unlockedIds.push("ach_saver");
            }
          }

          let userAchievements = d.userAchievements;
          const unlocked: Achievement[] = [];
          for (const aid of unlockedIds) {
            const alreadyUnlocked = d.userAchievements.some((ua) => ua.userId === userId && ua.achievementId === aid);
            if (alreadyUnlocked) continue;

            const ach = d.achievements.find((a) => a.id === aid);
            if (!ach) continue;
            userAchievements = [...userAchievements, { id: uid("ua"), userId, achievementId: aid, unlockedAt: nowIso }];
            me.xp += ach.xpReward;
            totalXpGained += ach.xpReward;
            unlocked.push(ach);
          }

          const after = levelFromXp(me.xp);
          me.level = after.level;

          result = {
            xpGained: totalXpGained,
            leveledUp: after.level > levelBefore,
            newLevel: after.level,
            newTitle: after.title,
            achievements: unlocked,
            streakCount: me.streakCount,
            completedGoal: completedGoalDirectly ?? undefined,
            goalProgress: goalProgressInfo ?? undefined,
          };

          // 4. Recurrence -> spawn next occurrence
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

          return { ...d, tasks, users, goals, userAchievements };
        }

        // If goal progress changed but task was already completed once (no new XP)
        if (completedGoalDirectly || goalProgressInfo) {
          result = {
            xpGained: 0,
            leveledUp: false,
            newLevel: 0,
            newTitle: "",
            achievements: [],
            streakCount: 0,
            completedGoal: completedGoalDirectly ?? undefined,
            goalProgress: goalProgressInfo ?? undefined,
          };
        }

        return { ...d, tasks, goals };
      });

      return result;
    },
    [userId]
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      // If status is changing, route through the status updates engine to trigger XP/Goal logic
      const currentTask = data.tasks.find((t) => t.id === id);
      if (currentTask && patch.status && patch.status !== currentTask.status) {
        updateTaskStatus(id, patch.status);
      }

      updateData((d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                ...patch,
                xpReward: patch.priority ? taskXp(patch.priority) : t.xpReward,
                completedAt: patch.status === "concluida"
                  ? (t.completedAt || new Date().toISOString())
                  : (patch.status ? t.completedAt : t.completedAt)
              }
            : t,
        ),
      }));
    },
    [data.tasks, updateTaskStatus],
  );

  /** Complete task helper for checkbox clicks (with confetti trigger). */
  const completeTask = useCallback(
    (id: string): CelebrationResult | null => {
      return updateTaskStatus(id, "concluida");
    },
    [updateTaskStatus],
  );

  return {
    tasks: data.tasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    setStatus: updateTaskStatus,
    updateTaskStatus,
  };
}
