import type { Priority } from "@/types";

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

/** XP for completing a task, based on its priority. */
export function taskXp(priority: Priority): number {
  switch (priority) {
    case "urgente":
      return XP.taskUrgentOnTime;
    case "alta":
      return XP.taskHigh;
    default:
      return XP.taskSimple;
  }
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
