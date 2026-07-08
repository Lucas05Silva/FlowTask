import type { Task, Goal } from "@/types";

export interface GoalUpdateResult {
  newValue: number;
  shouldComplete: boolean;
}

/**
 * Computes the new current amount for a goal when a specific task is completed.
 */
export function computeTaskGoalContribution(
  task: Task,
  goal: Goal,
  allTasksOfGoal: Task[]
): GoalUpdateResult {
  const type = task.goalContributionType || goal.contributionType || "count";
  let newAmount = goal.currentAmount;

  if (type === "count") {
    newAmount += task.goalContributionValue ?? 1;
  } else if (type === "value") {
    newAmount += task.goalContributionValue ?? goal.contributionValuePerTask ?? 0;
  } else if (type === "checklist") {
    // Recalculate completed tasks checklist items to prevent inconsistencies
    const completedTasksCount = allTasksOfGoal.filter(
      (t) => (t.id === task.id ? true : t.status === "concluida")
    ).length;
    newAmount = completedTasksCount;
  }

  const clamped = Math.min(goal.targetAmount, Math.max(0, newAmount));
  return {
    newValue: clamped,
    shouldComplete: clamped >= goal.targetAmount,
  };
}

/**
 * Recalculates from scratch the progress value of a goal based on its current linked tasks.
 * Typically used during status reversals (i.e. task uncomplete).
 */
export function computeGoalProgressRecalculation(
  goal: Goal,
  allGoalTasks: Task[]
): GoalUpdateResult {
  const completedTasks = allGoalTasks.filter((t) => t.status === "concluida");
  const type = goal.contributionType || "count";
  let newValue = 0;

  if (type === "count") {
    newValue = completedTasks.reduce((sum, t) => sum + (t.goalContributionValue ?? 1), 0);
  } else if (type === "value") {
    newValue = completedTasks.reduce((sum, t) => sum + (t.goalContributionValue ?? goal.contributionValuePerTask ?? 0), 0);
  } else if (type === "checklist") {
    newValue = completedTasks.length;
  }

  const clamped = Math.min(goal.targetAmount, Math.max(0, newValue));
  return {
    newValue: clamped,
    shouldComplete: clamped >= goal.targetAmount,
  };
}
