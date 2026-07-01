import type { Priority, RecurrenceRule, FlowTaskData, Achievement } from "@/types";
import { uid } from "@/lib/utils";

/** Side effects of an XP-earning action, surfaced to the UI for toasts/modals. */
export interface CelebrationResult {
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  newTitle: string;
  achievements: Achievement[];
  streakCount: number;
}

/** Level thresholds & titles (prompt §7.2). */
export interface LevelInfo {
  level: number;
  xpRequired: number;
  title: string;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, xpRequired: 0, title: "Novato" },
  { level: 2, xpRequired: 100, title: "Iniciante" },
  { level: 3, xpRequired: 300, title: "Focado" },
  { level: 4, xpRequired: 600, title: "Produtivo" },
  { level: 5, xpRequired: 1000, title: "Eficiente" },
  { level: 6, xpRequired: 1500, title: "Mestre" },
  { level: 7, xpRequired: 2500, title: "Lenda" },
  { level: 8, xpRequired: 4000, title: "Imparável" },
  { level: 9, xpRequired: 6000, title: "Visionário" },
  { level: 10, xpRequired: 10000, title: "FlowMaster" },
];

/** XP awarded per action (prompt §7.1). */
export const XP = {
  taskSimple: 10,
  taskHigh: 25,
  taskUrgentOnTime: 50,
  projectStep: 30,
  projectComplete: 200,
  financeEntry: 5,
  debtPaid: 100,
  financialGoal: 150,
  apartmentItem: 20,
  weddingTask: 20,
  weddingVendor: 30,
  streak7: 50,
  streak30: 200,
} as const;

/** XP for completing a task, based on its priority (prompt Fase 2 §2). */
export function taskXp(priority: Priority): number {
  switch (priority) {
    case "urgente":
      return 50;
    case "alta":
      return 25;
    case "media":
      return 15;
    case "baixa":
    default:
      return 10;
  }
}

/** Next due date (yyyy-mm-dd) for a recurring task after completion. */
export function nextRecurrence(
  dateISO: string | null,
  rule: RecurrenceRule | null,
): string | null {
  const base = dateISO ? new Date(dateISO) : new Date();
  switch (rule) {
    case "diaria":
      base.setDate(base.getDate() + 1);
      break;
    case "mensal":
      base.setMonth(base.getMonth() + 1);
      break;
    case "semanal":
    case "personalizada":
    default:
      base.setDate(base.getDate() + 7);
      break;
  }
  const tz = base.getTimezoneOffset() * 60000;
  return new Date(base.getTime() - tz).toISOString().slice(0, 10);
}

/** Achievement keys (ids) the user qualifies for but hasn't unlocked yet. */
export function evaluateAchievements(data: FlowTaskData, userId: string): string[] {
  const have = new Set(
    data.userAchievements.filter((u) => u.userId === userId).map((u) => u.achievementId),
  );
  const user = data.users.find((u) => u.id === userId);
  if (!user) return [];
  const completed = data.tasks.filter((t) => t.status === "concluida").length;
  const completedProjects = data.projects.filter((p) => p.status === "feito").length;
  const toUnlock: string[] = [];
  const check = (id: string, cond: boolean) => {
    if (cond && !have.has(id)) toUnlock.push(id);
  };
  check("ach_first_step", completed >= 1);
  check("ach_week", user.streakCount >= 7);
  check("ach_month", user.streakCount >= 30);
  check("ach_client", completedProjects >= 1);
  check("ach_machine", completedProjects >= 10);
  check("ach_nest", data.apartmentItems.length > 0 && data.apartmentItems.every((i) => i.status === "comprado" || i.status === "entregue"));
  check("ach_iaccept", data.weddingTasks.length > 0 && data.weddingTasks.every((t) => t.status === "concluida"));
  // "Casal produtivo" — both users at the same level
  const [a, b] = data.users;
  if (a && b) check("ach_couple", a.level === b.level && a.level > 1);
  // "Dupla dinâmica" — both with active 7+ day streaks
  if (a && b) check("ach_duo", a.streakCount >= 7 && b.streakCount >= 7);
  return toUnlock;
}

/** Resolve level info from a total XP amount. */
export function levelFromXp(xp: number): LevelInfo {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xpRequired) current = l;
    else break;
  }
  return current;
}

/** Progress within the current level toward the next one. */
export function levelProgress(xp: number): {
  current: LevelInfo;
  next: LevelInfo | null;
  pct: number;
  intoLevel: number;
  span: number;
} {
  const current = levelFromXp(xp);
  const next = LEVELS.find((l) => l.level === current.level + 1) ?? null;
  if (!next) {
    return { current, next: null, pct: 100, intoLevel: 0, span: 0 };
  }
  const span = next.xpRequired - current.xpRequired;
  const intoLevel = xp - current.xpRequired;
  return {
    current,
    next,
    span,
    intoLevel,
    pct: Math.min(100, Math.round((intoLevel / span) * 100)),
  };
}

/**
 * Award base XP to a user, unlock any newly-earned achievements (which add their
 * own XP), recompute level, and return the updated data plus a CelebrationResult.
 * Pure: returns new users/userAchievements arrays (does not mutate input).
 */
export function applyReward(
  data: FlowTaskData,
  userId: string,
  baseXp: number,
): { data: FlowTaskData; result: CelebrationResult } {
  const empty: CelebrationResult = {
    xpGained: 0,
    leveledUp: false,
    newLevel: 1,
    newTitle: "",
    achievements: [],
    streakCount: 0,
  };
  const users = data.users.map((u) => ({ ...u }));
  const me = users.find((u) => u.id === userId);
  if (!me) return { data, result: empty };

  const before = me.xp;
  const levelBefore = levelFromXp(before).level;
  me.xp += baseXp;

  const snapshot: FlowTaskData = { ...data, users };
  const ids = evaluateAchievements(snapshot, userId);
  let userAchievements = data.userAchievements;
  const unlocked: Achievement[] = [];
  const now = new Date().toISOString();
  for (const aid of ids) {
    const ach = data.achievements.find((a) => a.id === aid);
    if (!ach) continue;
    userAchievements = [...userAchievements, { id: uid("ua"), userId, achievementId: aid, unlockedAt: now }];
    me.xp += ach.xpReward;
    unlocked.push(ach);
  }

  const after = levelFromXp(me.xp);
  me.level = after.level;

  return {
    data: { ...data, users, userAchievements },
    result: {
      xpGained: me.xp - before,
      leveledUp: after.level > levelBefore,
      newLevel: after.level,
      newTitle: after.title,
      achievements: unlocked,
      streakCount: me.streakCount,
    },
  };
}
