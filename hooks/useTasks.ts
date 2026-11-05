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
  GoalContributionType,
} from "@/types";
import { updateData } from "@/lib/data/store";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/components/providers/AuthProvider";
import { uid, nextRecurrence } from "@/lib/utils";
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

  /** Change status manually or via modal — manages linked goals and recurrence (spawned only on the first completion). */
  const updateTaskStatus = useCallback(
    (id: string, newStatus: TaskStatus) => {
      if (!userId) return;

      updateData((d) => {
        const task = d.tasks.find((t) => t.id === id);
        if (!task || task.status === newStatus) return d;

        const nowIso = new Date().toISOString();

        // 1. Update task list status and completedAt (retain if already set, reset to null if not completed)
        let tasks = d.tasks.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              status: newStatus,
              completedAt: newStatus === "concluida" ? (t.completedAt || nowIso) : null,
            };
          }
          return t;
        });

        // 2. Compute Linked Goal Progress
        const goals = d.goals.map((g) => ({ ...g }));

        if (task.goalId) {
          const targetGoal = goals.find((g) => g.id === task.goalId);
          if (targetGoal) {
            if (newStatus === "concluida" && targetGoal.status !== "concluida") {
              const allTasksOfGoal = d.tasks.filter((t) => t.goalId === task.goalId);
              const progress = computeTaskGoalContribution(task, targetGoal, allTasksOfGoal);

              targetGoal.currentAmount = progress.newValue;
              if (progress.shouldComplete) {
                targetGoal.status = "concluida";
                targetGoal.completedAt = nowIso;
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

        // 3. Recurrence -> spawn next occurrence (first completion only)
        if (newStatus === "concluida" && !task.completedAt && task.isRecurring) {
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

        return { ...d, tasks, goals };
      });
    },
    [userId]
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      // If status is changing, route through the status updates engine to trigger goal/recurrence logic
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

  /** Toggle completion for checkbox clicks. */
  const completeTask = useCallback(
    (id: string) => {
      const task = data.tasks.find((t) => t.id === id);
      if (!task) return;
      const nextStatus: TaskStatus = task.status === "concluida" ? "a_fazer" : "concluida";
      updateTaskStatus(id, nextStatus);
    },
    [data.tasks, updateTaskStatus],
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
