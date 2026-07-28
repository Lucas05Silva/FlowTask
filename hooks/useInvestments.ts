"use client";

import { useCallback, useMemo } from "react";
import type {
  Investment,
  InvestmentContribution,
  InvestmentType,
  IndexType,
  InvestmentLiquidity,
  FinanceEntry,
  Achievement,
  Goal,
  FlowTaskData,
} from "@/types";
import { updateData } from "@/lib/data/store";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/components/providers/AuthProvider";
import { levelFromXp, XP, type CelebrationResult } from "@/lib/gamification";
import { uid, todayISO } from "@/lib/utils";
import { KNOWN_USERS } from "@/lib/data/initialState";
import {
  calculateCurrentValue,
  effectiveAnnualRate,
  estimateMonthlyPassiveIncome,
  projectFutureValue,
  REFERENCE_RATES,
} from "@/lib/investment-calculator";

const LUCAS_ID = KNOWN_USERS[0].id;
const monthKey = (iso: string) => iso.slice(0, 7); // YYYY-MM

/** Achievement ids the user newly qualifies for after a mutation (pure). */
function extraAchievementsFor(
  d: FlowTaskData,
  userId: string,
  monthlyExpense: number,
): string[] {
  const have = new Set(
    d.userAchievements.filter((ua) => ua.userId === userId).map((ua) => ua.achievementId),
  );
  const mine = d.investments.filter((i) => i.userId === userId);
  const out: string[] = [];

  // Patrimônio milestones — one-time reward each (R$ 10k / 50k / 100k)
  const totalCurrent = mine.reduce((s, i) => s + i.currentValue, 0);
  if (totalCurrent >= 10000 && !have.has("ach_patrimony_10k")) out.push("ach_patrimony_10k");
  if (totalCurrent >= 50000 && !have.has("ach_patrimony_50k")) out.push("ach_patrimony_50k");
  if (totalCurrent >= 100000 && !have.has("ach_patrimony_100k")) out.push("ach_patrimony_100k");

  // Reserva Completa — emergency fund ≥ target (4× monthly expenses, when known)
  const reserveTarget = monthlyExpense * 4;
  if (reserveTarget > 0) {
    const reserve = mine.filter((i) => i.isEmergencyFund).reduce((s, i) => s + i.currentValue, 0);
    if (reserve >= reserveTarget && !have.has("ach_reserve_complete")) out.push("ach_reserve_complete");
  }

  // Consistência — contributions in 3 consecutive months (incl. current)
  if (!have.has("ach_consistency")) {
    const months = new Set(
      d.investmentContributions.filter((c) => c.userId === userId).map((c) => monthKey(c.date)),
    );
    const now = new Date();
    let streak = 0;
    for (let i = 0; i < 12; i++) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (months.has(key)) streak++;
      else if (streak > 0) break;
    }
    if (streak >= 3) out.push("ach_consistency");
  }

  return out;
}

/**
 * Recompute a linked goal's progress from the SUM of every investment tied to
 * it (a goal like "Reserva de Emergência" can aggregate several positions).
 * Pure — expects `d.investments` to already contain the mutated investment.
 */
function recomputeLinkedGoal(
  d: FlowTaskData,
  goalId: string | null | undefined,
): { d: FlowTaskData; completed: Goal | null } {
  if (!goalId) return { d, completed: null };
  const linkedSum = d.investments
    .filter((i) => i.goalId === goalId)
    .reduce((s, i) => s + i.currentValue, 0);
  let completed: Goal | null = null;
  const goals = d.goals.map((g) => {
    if (g.id !== goalId) return g;
    const nextAmount = Math.min(g.targetAmount, Math.round(linkedSum));
    const isDone = nextAmount >= g.targetAmount && g.targetAmount > 0;
    const wasDone = g.status === "concluida";
    const updated: Goal = {
      ...g,
      currentAmount: nextAmount,
      status: isDone ? "concluida" : "em_andamento",
      completedAt: isDone ? g.completedAt || new Date().toISOString() : null,
    };
    if (isDone && !wasDone) completed = updated;
    return updated;
  });
  return { d: { ...d, goals }, completed };
}

export interface InvestmentFormData {
  name: string;
  type: InvestmentType;
  index: IndexType;
  rate: number;
  initialAmount: number;
  purchaseDate: string;
  maturityDate: string | null;
  liquidity: InvestmentLiquidity;
  liquidityDays: number | null;
  isEmergencyFund: boolean;
  goalId: string | null;
  notes: string;
}

export interface ContributionFormData {
  amount: number;
  date: string;
  notes: string;
  registerAsExpense: boolean;
}

export function useInvestments() {
  const data = useData();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  /* ---- slices scoped to the current user ---------------------------------- */
  const contributions = useMemo(
    () => (data.investmentContributions || []).filter((c) => c.userId === userId),
    [data.investmentContributions, userId],
  );

  const contributionsByInvestment = useMemo(() => {
    const map = new Map<string, InvestmentContribution[]>();
    for (const c of contributions) {
      const list = map.get(c.investmentId) ?? [];
      list.push(c);
      map.set(c.investmentId, list);
    }
    return map;
  }, [contributions]);

  /** Investments with a freshly recomputed currentValue (interest accrues over time). */
  const investments = useMemo<Investment[]>(() => {
    return (data.investments || [])
      .filter((inv) => inv.userId === userId)
      .map((inv) => {
        const invContribs = contributionsByInvestment.get(inv.id);
        const live = calculateCurrentValue(inv, invContribs?.map((c) => ({ amount: c.amount, date: c.date })));
        return { ...inv, currentValue: live };
      });
  }, [data.investments, userId, contributionsByInvestment]);

  /* ---- gamification helper (mirror of useFinance.rewardUser) --------------- */
  const rewardUser = useCallback(
    (
      d: FlowTaskData,
      xpReward: number,
      manualAchievementIds: string[] = [],
    ): { nextData: FlowTaskData; result: CelebrationResult | null } => {
      if (!userId) return { nextData: d, result: null };
      const users = d.users.map((u) => ({ ...u }));
      const me = users.find((u) => u.id === userId);
      if (!me) return { nextData: d, result: null };

      const levelBefore = levelFromXp(me.xp).level;
      let totalXpGained = xpReward;
      me.xp += xpReward;

      let userAchievements = d.userAchievements;
      const unlocked: Achievement[] = [];

      for (const achId of manualAchievementIds) {
        const alreadyHas = userAchievements.some(
          (ua) => ua.userId === userId && ua.achievementId === achId,
        );
        if (alreadyHas) continue;
        const ach = d.achievements.find((a) => a.id === achId);
        if (!ach) continue;
        userAchievements = [
          ...userAchievements,
          { id: uid("ua"), userId, achievementId: achId, unlockedAt: new Date().toISOString() },
        ];
        me.xp += ach.xpReward;
        totalXpGained += ach.xpReward;
        unlocked.push(ach);
      }

      const after = levelFromXp(me.xp);
      me.level = after.level;

      return {
        nextData: { ...d, users, userAchievements },
        result: {
          xpGained: totalXpGained,
          leveledUp: after.level > levelBefore,
          newLevel: after.level,
          newTitle: after.title,
          achievements: unlocked,
          streakCount: me.streakCount,
        },
      };
    },
    [userId],
  );

  /* ---- helpers ------------------------------------------------------------- */

  /** Average monthly expense from the finance module (last 3 months). */
  const monthlyExpenseEstimate = useMemo(() => {
    const now = new Date();
    let total = 0;
    let monthsWithData = 0;
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthTotal = data.finances
        .filter((f) => f.type === "expense" && f.date.slice(0, 7) === key)
        .reduce((s, f) => s + f.amount, 0);
      if (monthTotal > 0) {
        total += monthTotal;
        monthsWithData++;
      }
    }
    return monthsWithData > 0 ? Math.round(total / monthsWithData) : 0;
  }, [data.finances]);

  const getTotalInvested = useCallback(
    () => investments.reduce((s, i) => s + i.investedAmount, 0),
    [investments],
  );
  const getTotalCurrentValue = useCallback(
    () => investments.reduce((s, i) => s + i.currentValue, 0),
    [investments],
  );
  const getTotalReturn = useCallback(
    () => getTotalCurrentValue() - getTotalInvested(),
    [getTotalCurrentValue, getTotalInvested],
  );
  const getTotalReturnPercent = useCallback(() => {
    const inv = getTotalInvested();
    return inv > 0 ? (getTotalReturn() / inv) * 100 : 0;
  }, [getTotalInvested, getTotalReturn]);
  const getEmergencyFundTotal = useCallback(
    () => investments.filter((i) => i.isEmergencyFund).reduce((s, i) => s + i.currentValue, 0),
    [investments],
  );
  const getMonthlyPassiveIncome = useCallback(
    () => estimateMonthlyPassiveIncome(getTotalCurrentValue()),
    [getTotalCurrentValue],
  );

  const getInvestmentsByType = useCallback(() => {
    const map = {} as Record<InvestmentType, Investment[]>;
    for (const inv of investments) {
      (map[inv.type] ??= []).push(inv);
    }
    return map;
  }, [investments]);

  /** Weighted average annual rate across the portfolio (for default projection). */
  const getPortfolioAverageRate = useCallback(() => {
    const total = getTotalCurrentValue();
    if (total <= 0) return REFERENCE_RATES.selic;
    const weighted = investments.reduce(
      (s, i) => s + effectiveAnnualRate(i.index, i.rate) * i.currentValue,
      0,
    );
    return weighted / total;
  }, [investments, getTotalCurrentValue]);

  const getProjection = useCallback(
    (years: number, monthlyContribution: number, annualRate?: number) => {
      const rate = annualRate ?? getPortfolioAverageRate();
      const start = getTotalCurrentValue();
      const future = projectFutureValue(start, monthlyContribution, rate, years);
      const totalContributed = start + monthlyContribution * years * 12;
      const returnValue = future - totalContributed;
      return {
        futureValue: future,
        totalContributed,
        returnValue,
        returnPercent: totalContributed > 0 ? (returnValue / totalContributed) * 100 : 0,
        passiveIncome: estimateMonthlyPassiveIncome(future),
      };
    },
    [getTotalCurrentValue, getPortfolioAverageRate],
  );

  /** All contributions (current user), newest first. */
  const allContributions = useMemo(
    () => [...contributions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [contributions],
  );

  /* ---- CRUD: investments --------------------------------------------------- */

  const createInvestment = useCallback(
    (form: InvestmentFormData): CelebrationResult | null => {
      if (!userId) return null;
      let celebration: CelebrationResult | null = null;

      updateData((d) => {
        const nowIso = new Date().toISOString();
        const id = uid("inv");
        const contribId = uid("ic");

        const baseInvestment: Investment = {
          id,
          userId,
          name: form.name.trim(),
          type: form.type,
          index: form.index,
          rate: form.rate,
          investedAmount: form.initialAmount,
          currentValue: form.initialAmount,
          purchaseDate: form.purchaseDate,
          maturityDate: form.maturityDate,
          liquidity: form.liquidity,
          liquidityDays: form.liquidity === "carencia" ? form.liquidityDays : null,
          isEmergencyFund: form.isEmergencyFund,
          goalId: form.goalId,
          notes: form.notes.trim() || undefined,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        const firstContribution: InvestmentContribution = {
          id: contribId,
          investmentId: id,
          userId,
          amount: form.initialAmount,
          date: form.purchaseDate,
          notes: "Aporte inicial",
          createdAt: nowIso,
        };
        const currentValue = calculateCurrentValue(baseInvestment, [
          { amount: firstContribution.amount, date: firstContribution.date },
        ]);
        const investment = { ...baseInvestment, currentValue };

        let next: FlowTaskData = {
          ...d,
          investments: [...d.investments, investment],
          investmentContributions: [...d.investmentContributions, firstContribution],
        };

        const { d: withGoal, completed } = recomputeLinkedGoal(next, investment.goalId);
        next = withGoal;

        const extra = extraAchievementsFor(next, userId, monthlyExpenseEstimate);
        const { nextData, result } = rewardUser(next, XP.investmentContribution, [
          "ach_first_investment",
          ...extra,
        ]);
        if (result && completed) result.completedGoal = completed;
        celebration = result;
        return nextData;
      });

      return celebration;
    },
    [userId, rewardUser, monthlyExpenseEstimate],
  );

  const updateInvestment = useCallback((id: string, patch: Partial<Investment>) => {
    updateData((d) => ({
      ...d,
      investments: d.investments.map((inv) =>
        inv.id === id ? { ...inv, ...patch, updatedAt: new Date().toISOString() } : inv,
      ),
    }));
  }, []);

  const deleteInvestment = useCallback((id: string) => {
    updateData((d) => {
      const removed = d.investments.find((inv) => inv.id === id);
      const next: FlowTaskData = {
        ...d,
        investments: d.investments.filter((inv) => inv.id !== id),
        // No DB FK cascade (text ids) — remove contributions in-app.
        investmentContributions: d.investmentContributions.filter((c) => c.investmentId !== id),
      };
      // Keep any linked goal's progress in sync after removal.
      return recomputeLinkedGoal(next, removed?.goalId).d;
    });
  }, []);

  /* ---- contributions ------------------------------------------------------- */

  const addContribution = useCallback(
    (investmentId: string, form: ContributionFormData): CelebrationResult | null => {
      if (!userId) return null;
      let celebration: CelebrationResult | null = null;

      updateData((d) => {
        const inv = d.investments.find((i) => i.id === investmentId);
        if (!inv) return d;

        const nowIso = new Date().toISOString();
        const contribution: InvestmentContribution = {
          id: uid("ic"),
          investmentId,
          userId,
          amount: form.amount,
          date: form.date,
          notes: form.notes.trim() || undefined,
          createdAt: nowIso,
        };

        const nextContributions = [...d.investmentContributions, contribution];
        const invContribs = nextContributions
          .filter((c) => c.investmentId === investmentId)
          .map((c) => ({ amount: c.amount, date: c.date }));
        const nextInvestedAmount = inv.investedAmount + form.amount;
        const nextCurrentValue = calculateCurrentValue(
          { ...inv, investedAmount: nextInvestedAmount },
          invContribs,
        );

        const updatedInvestment: Investment = {
          ...inv,
          investedAmount: nextInvestedAmount,
          currentValue: nextCurrentValue,
          updatedAt: nowIso,
        };

        let next: FlowTaskData = {
          ...d,
          investments: d.investments.map((i) => (i.id === investmentId ? updatedInvestment : i)),
          investmentContributions: nextContributions,
        };

        // Optionally register the contribution as a finance expense.
        if (form.registerAsExpense) {
          const expense: FinanceEntry = {
            id: uid("f"),
            type: "expense",
            amount: form.amount,
            description: `Aporte - ${inv.name}`,
            date: form.date,
            category: "outros",
            tags: ["investimento"],
            isRecurring: false,
            recurrenceRule: null,
            createdBy: userId,
            createdAt: nowIso,
          };
          next = { ...next, finances: [...next.finances, expense] };
        }

        const { d: withGoal, completed } = recomputeLinkedGoal(next, updatedInvestment.goalId);
        next = withGoal;

        const extra = extraAchievementsFor(next, userId, monthlyExpenseEstimate);
        const { nextData, result } = rewardUser(next, XP.investmentContribution, extra);
        if (result && completed) result.completedGoal = completed;
        celebration = result;
        return nextData;
      });

      return celebration;
    },
    [userId, rewardUser, monthlyExpenseEstimate],
  );

  const deleteContribution = useCallback((id: string) => {
    updateData((d) => {
      const contribution = d.investmentContributions.find((c) => c.id === id);
      if (!contribution) return d;
      const nextContributions = d.investmentContributions.filter((c) => c.id !== id);
      const investments = d.investments.map((inv) => {
        if (inv.id !== contribution.investmentId) return inv;
        const invContribs = nextContributions
          .filter((c) => c.investmentId === inv.id)
          .map((c) => ({ amount: c.amount, date: c.date }));
        const nextInvested = Math.max(0, inv.investedAmount - contribution.amount);
        return {
          ...inv,
          investedAmount: nextInvested,
          currentValue: calculateCurrentValue({ ...inv, investedAmount: nextInvested }, invContribs),
          updatedAt: new Date().toISOString(),
        };
      });
      return { ...d, investments, investmentContributions: nextContributions };
    });
  }, []);

  /* ---- monthly snapshot ---------------------------------------------------- */
  const saveMonthlySnapshot = useCallback(() => {
    if (!userId) return;
    updateData((d) => {
      const mine = d.investments.filter((i) => i.userId === userId);
      if (mine.length === 0) return d;
      const key = todayISO().slice(0, 7);
      const exists = d.patrimonySnapshots.some((s) => s.userId === userId && s.month === key);
      if (exists) return d;

      const cById = new Map<string, { amount: number; date: string }[]>();
      d.investmentContributions
        .filter((c) => c.userId === userId)
        .forEach((c) => {
          const list = cById.get(c.investmentId) ?? [];
          list.push({ amount: c.amount, date: c.date });
          cById.set(c.investmentId, list);
        });

      const totalInvested = mine.reduce((s, i) => s + i.investedAmount, 0);
      const totalCurrent = mine.reduce((s, i) => s + calculateCurrentValue(i, cById.get(i.id)), 0);

      const snapshot = {
        id: uid("ps"),
        userId,
        month: key,
        totalInvested: Math.round(totalInvested * 100) / 100,
        totalCurrent: Math.round(totalCurrent * 100) / 100,
        snapshotAt: new Date().toISOString(),
      };
      return { ...d, patrimonySnapshots: [...d.patrimonySnapshots, snapshot] };
    });
  }, [userId]);

  const snapshots = useMemo(
    () =>
      (data.patrimonySnapshots || [])
        .filter((s) => s.userId === userId)
        .sort((a, b) => a.month.localeCompare(b.month)),
    [data.patrimonySnapshots, userId],
  );

  /* ---- seed (Lucas's real portfolio — runs once, upgrades v1 data) --------- */
  const seedIfEmpty = useCallback(() => {
    if (!userId || userId !== LUCAS_ID) return;
    if (typeof window === "undefined") return;
    // Versioned flag: v2 adds the "Reserva de Emergência" goal + links + notes,
    // so it runs once even for browsers that already ran the original seed.
    const flagKey = `flowtask_investments_seed_v2_${userId}`;
    if (window.localStorage.getItem(flagKey)) return;
    window.localStorage.setItem(flagKey, "1");

    const nowIso = new Date().toISOString();
    const RESERVE_TARGET = 6000;
    const GOAL_TITLE = "Reserva de Emergência";

    const specs = [
      {
        name: "Tesouro Selic 2027", type: "tesouro_selic" as const, index: "selic" as const,
        rate: 0, amount: 194, purchase: "2026-06-01", maturity: "2027-03-01" as string | null,
        liquidity: "diaria" as const, reserve: true,
        notes: "Primeiro investimento — reserva de emergência", contribNote: "Aporte inicial",
      },
      {
        name: "CDB Diário Nubank", type: "cdb" as const, index: "cdi" as const,
        rate: 100, amount: 96, purchase: "2026-06-01", maturity: null as string | null,
        liquidity: "diaria" as const, reserve: true,
        notes: "Sobra do mês — liquidez diária", contribNote: "Aporte inicial",
      },
      {
        name: "Tesouro IPCA+ 2035", type: "tesouro_ipca" as const, index: "ipca" as const,
        rate: 6.5, amount: 87, purchase: "2026-07-01", maturity: "2035-05-15" as string | null,
        liquidity: "no_vencimento" as const, reserve: false,
        notes: "Longo prazo — não resgatar antes do vencimento", contribNote: "Aporte inicial — longo prazo",
      },
    ];

    updateData((d) => {
      // 1. Ensure the "Reserva de Emergência" goal (R$ 6.000).
      const existingGoal = d.goals.find((g) => g.createdBy === userId && g.title === GOAL_TITLE);
      const goalId = existingGoal?.id ?? uid("g");
      let goals = existingGoal
        ? d.goals.map((g) =>
            g.id === goalId ? { ...g, type: "financeira" as const, targetAmount: RESERVE_TARGET, category: "reserva_emergencia", linkedModule: "investimentos" } : g,
          )
        : [
            ...d.goals,
            {
              id: goalId, title: GOAL_TITLE,
              description: "Segurança financeira — formada pelos investimentos marcados como reserva.",
              type: "financeira" as const, targetAmount: RESERVE_TARGET, currentAmount: 0,
              deadline: null, category: "reserva_emergencia", linkedModule: "investimentos",
              xpReward: XP.financialGoal, status: "em_andamento" as const,
              createdBy: userId, createdAt: nowIso, completedAt: null,
            },
          ];

      // 2. Create (or upgrade in place) each investment + its first contribution.
      let investments = [...d.investments];
      let contributions = [...d.investmentContributions];

      for (const s of specs) {
        const linkGoal = s.reserve ? goalId : null;
        const existing = investments.find((i) => i.userId === userId && i.name === s.name);
        if (existing) {
          investments = investments.map((i) =>
            i.id === existing.id
              ? { ...i, isEmergencyFund: s.reserve, goalId: linkGoal, notes: s.notes, updatedAt: nowIso }
              : i,
          );
        } else {
          const id = uid("inv");
          const base: Investment = {
            id, userId, name: s.name, type: s.type, index: s.index, rate: s.rate,
            investedAmount: s.amount, currentValue: s.amount, purchaseDate: s.purchase,
            maturityDate: s.maturity, liquidity: s.liquidity, liquidityDays: null,
            isEmergencyFund: s.reserve, goalId: linkGoal, notes: s.notes,
            createdAt: nowIso, updatedAt: nowIso,
          };
          const currentValue = calculateCurrentValue(base, [{ amount: s.amount, date: s.purchase }]);
          investments.push({ ...base, currentValue });
          contributions.push({
            id: uid("ic"), investmentId: id, userId, amount: s.amount,
            date: s.purchase, notes: s.contribNote, createdAt: nowIso,
          });
        }
      }

      // 3. Goal progress = sum of the linked (reserve) investments' current value.
      const contribsById = new Map<string, { amount: number; date: string }[]>();
      contributions.forEach((c) => {
        const list = contribsById.get(c.investmentId) ?? [];
        list.push({ amount: c.amount, date: c.date });
        contribsById.set(c.investmentId, list);
      });
      const reserveSum = investments
        .filter((i) => i.goalId === goalId)
        .reduce((sum, i) => sum + calculateCurrentValue(i, contribsById.get(i.id)), 0);
      goals = goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              currentAmount: Math.min(RESERVE_TARGET, Math.round(reserveSum)),
              status: reserveSum >= RESERVE_TARGET ? ("concluida" as const) : ("em_andamento" as const),
              completedAt: reserveSum >= RESERVE_TARGET ? g.completedAt || nowIso : null,
            }
          : g,
      );

      // 4. Retroactively unlock the "Primeiro Investimento" achievement for Lucas.
      let userAchievements = d.userAchievements;
      let users = d.users;
      const hasFirst = userAchievements.some(
        (ua) => ua.userId === userId && ua.achievementId === "ach_first_investment",
      );
      if (!hasFirst) {
        userAchievements = [
          ...userAchievements,
          { id: uid("ua"), userId, achievementId: "ach_first_investment", unlockedAt: nowIso },
        ];
        const ach = d.achievements.find((a) => a.id === "ach_first_investment");
        if (ach) {
          users = users.map((u) => {
            if (u.id !== userId) return u;
            const nextXp = u.xp + ach.xpReward;
            return { ...u, xp: nextXp, level: levelFromXp(nextXp).level };
          });
        }
      }

      return { ...d, goals, investments, investmentContributions: contributions, userAchievements, users };
    });
  }, [userId]);

  return {
    investments,
    contributions: allContributions,
    contributionsByInvestment,
    snapshots,
    goals: data.goals,
    monthlyExpenseEstimate,
    // calculations
    getTotalInvested,
    getTotalCurrentValue,
    getTotalReturn,
    getTotalReturnPercent,
    getEmergencyFundTotal,
    getMonthlyPassiveIncome,
    getInvestmentsByType,
    getPortfolioAverageRate,
    getProjection,
    // mutations
    createInvestment,
    updateInvestment,
    deleteInvestment,
    addContribution,
    deleteContribution,
    saveMonthlySnapshot,
    seedIfEmpty,
  };
}
