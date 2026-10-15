/**
 * Organização — metadata and pure helpers (distribution, projection, dates).
 * Kept free of React so the hook and components share one source of truth.
 */
import type { Goal, MonthlyPlanItem, PlanItemCategory } from "@/types";
import { MONTHS } from "@/lib/finance-filter";

export const PLAN_CATEGORY_META: Record<
  PlanItemCategory,
  { label: string; emoji: string; color: string; group: "comprometido" | "poupado"; payVerb: string }
> = {
  fixa: { label: "Contas Fixas", emoji: "📌", color: "var(--brand-purple)", group: "comprometido", payVerb: "Pagar" },
  variavel: { label: "Variáveis", emoji: "🎲", color: "var(--cat-financeiro)", group: "comprometido", payVerb: "Pagar" },
  divida: { label: "Dívidas", emoji: "💳", color: "var(--danger)", group: "comprometido", payVerb: "Pagar parcela" },
  investimento: { label: "Investimentos", emoji: "📈", color: "var(--success)", group: "poupado", payVerb: "Aportar" },
  meta: { label: "Metas", emoji: "🎯", color: "var(--brand-cyan-dark)", group: "poupado", payVerb: "Depositar" },
  reserva: { label: "Reserva", emoji: "🛡️", color: "var(--info)", group: "poupado", payVerb: "Guardar" },
};

/** Display order of the Distribution groups. */
export const PLAN_CATEGORY_ORDER: PlanItemCategory[] = ["fixa", "variavel", "divida", "investimento", "meta", "reserva"];

export const planId = (userId: string, year: number, month: number) =>
  `mp_${userId}_${year}-${String(month).padStart(2, "0")}`;

export const monthName = (month: number) => MONTHS.find((m) => m.val === month)?.label ?? "";

/** -1 past, 0 current, 1 future — relative to today. */
export function compareToCurrentMonth(month: number, year: number): -1 | 0 | 1 {
  const now = new Date();
  const a = year * 12 + month;
  const b = now.getFullYear() * 12 + now.getMonth() + 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

export function shiftMonth(month: number, year: number, delta: number): { month: number; year: number } {
  const d = new Date(year, month - 1 + delta, 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

/** "Agosto/2028" for N months from now. */
export function monthsFromNowLabel(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return `${monthName(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export interface Distribution {
  income: number;
  comprometido: number;
  poupado: number;
  livre: number;
  pctComprometido: number;
  pctPoupado: number;
  pctLivre: number;
}

/**
 * Comprometido = contas fixas + variáveis + dívidas (dívidas also leave the
 * month's money). Poupado = investimentos + metas + reserva. Livre = o resto.
 */
export function computeDistribution(income: number, items: MonthlyPlanItem[]): Distribution {
  let comprometido = 0;
  let poupado = 0;
  for (const i of items) {
    if (PLAN_CATEGORY_META[i.category].group === "comprometido") comprometido += i.plannedAmount;
    else poupado += i.plannedAmount;
  }
  const livre = income - comprometido - poupado;
  const pctOf = (v: number) => (income > 0 ? Math.round((v / income) * 100) : 0);
  return {
    income,
    comprometido,
    poupado,
    livre,
    pctComprometido: pctOf(comprometido),
    pctPoupado: pctOf(poupado),
    pctLivre: income > 0 ? Math.max(0, 100 - pctOf(comprometido) - pctOf(poupado)) : 0,
  };
}

export interface GoalProjection {
  goal: Goal;
  remaining: number;
  months: number | null; // null = no positive savings rate
  dateLabel: string | null;
  pct: number;
  /** Extra R$/month needed to reach it 3 months earlier. */
  extraFor3MonthsEarlier: number | null;
  /** Months saved by saving R$300/month more. */
  monthsSavedWith300: number | null;
}

export function projectGoal(goal: Goal, avgSavings: number): GoalProjection {
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
  if (avgSavings <= 0 || remaining === 0) {
    return {
      goal, remaining, pct,
      months: remaining === 0 ? 0 : null,
      dateLabel: remaining === 0 ? "Atingida" : null,
      extraFor3MonthsEarlier: null,
      monthsSavedWith300: null,
    };
  }
  const months = Math.ceil(remaining / avgSavings);
  const extraFor3MonthsEarlier = months > 3 ? Math.ceil(remaining / (months - 3) - avgSavings) : null;
  const monthsWith300 = Math.ceil(remaining / (avgSavings + 300));
  return {
    goal, remaining, pct, months,
    dateLabel: monthsFromNowLabel(months),
    extraFor3MonthsEarlier,
    monthsSavedWith300: months - monthsWith300 > 0 ? months - monthsWith300 : null,
  };
}

/** Emoji for a dream card, from the goal's title/category. */
export function dreamEmoji(goal: Goal): string {
  const t = goal.title.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (t.includes("canada")) return "🍁";
  if (t.includes("reserva") || goal.category === "reserva_emergencia") return "🛡️";
  if (t.includes("casa") || t.includes("apart") || goal.category === "apartamento") return "🏠";
  if (t.includes("casamento") || goal.category === "casamento") return "💍";
  if (t.includes("viagem") || goal.category === "viagem") return "✈️";
  if (t.includes("carro")) return "🚗";
  if (t.includes("sofa")) return "🛋️";
  return "🎯";
}
