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

/** Sync a linked goal's progress to an investment's current value (pure). */
function syncLinkedGoal(d: FlowTaskData, inv: Investment): { d: FlowTaskData; completed: Goal | null } {
  if (!inv.goalId) return { d, completed: null };
  let completed: Goal | null = null;
  const goals = d.goals.map((g) => {
    if (g.id !== inv.goalId) return g;
    const nextAmount = Math.min(g.targetAmount, Math.round(inv.currentValue));
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

        const { d: withGoal, completed } = syncLinkedGoal(next, investment);
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
    updateData((d) => ({
      ...d,
      investments: d.investments.filter((inv) => inv.id !== id),
      // No DB FK cascade (text ids) — remove contributions in-app.
      investmentContributions: d.investmentContributions.filter((c) => c.investmentId !== id),
    }));
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

        const { d: withGoal, completed } = syncLinkedGoal(next, updatedInvestment);
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

  /* ---- seed (Lucas, first access only — guarded by a localStorage flag) ---- */
  const seedIfEmpty = useCallback(() => {
    if (!userId || userId !== LUCAS_ID) return;
    if (typeof window === "undefined") return;
    const flagKey = `flowtask_investments_seeded_${userId}`;
    if (window.localStorage.getItem(flagKey)) return;
    // Only seed a truly empty portfolio.
    const hasAny = data.investments.some((i) => i.userId === userId);
    if (hasAny) {
      window.localStorage.setItem(flagKey, "1");
      return;
    }
    window.localStorage.setItem(flagKey, "1");

    const nowIso = new Date().toISOString();
    const seeds: { inv: Omit<Investment, "currentValue">; }[] = [
      {
        inv: {
          id: uid("inv"), userId, name: "Tesouro Selic 2027", type: "tesouro_selic", index: "selic",
          rate: 0, investedAmount: 194, purchaseDate: "2026-06-01", maturityDate: "2027-03-01",
          liquidity: "diaria", liquidityDays: null, isEmergencyFund: true, goalId: null,
          notes: undefined, createdAt: nowIso, updatedAt: nowIso,
        },
      },
      {
        inv: {
          id: uid("inv"), userId, name: "CDB Diário Nubank", type: "cdb", index: "cdi",
          rate: 100, investedAmount: 96, purchaseDate: "2026-06-01", maturityDate: null,
          liquidity: "diaria", liquidityDays: null, isEmergencyFund: true, goalId: null,
          notes: undefined, createdAt: nowIso, updatedAt: nowIso,
        },
      },
      {
        inv: {
          id: uid("inv"), userId, name: "Tesouro IPCA+ 2035", type: "tesouro_ipca", index: "ipca",
          rate: 6.5, investedAmount: 87, purchaseDate: "2026-07-01", maturityDate: "2035-05-15",
          liquidity: "no_vencimento", liquidityDays: null, isEmergencyFund: false, goalId: null,
          notes: undefined, createdAt: nowIso, updatedAt: nowIso,
        },
      },
    ];

    updateData((d) => {
      const newInvestments: Investment[] = [];
      const newContributions: InvestmentContribution[] = [];
      for (const { inv } of seeds) {
        const firstContribution: InvestmentContribution = {
          id: uid("ic"), investmentId: inv.id, userId, amount: inv.investedAmount,
          date: inv.purchaseDate, notes: "Aporte inicial", createdAt: nowIso,
        };
        const currentValue = calculateCurrentValue(inv, [
          { amount: firstContribution.amount, date: firstContribution.date },
        ]);
        newInvestments.push({ ...inv, currentValue });
        newContributions.push(firstContribution);
      }
      return {
        ...d,
        investments: [...d.investments, ...newInvestments],
        investmentContributions: [...d.investmentContributions, ...newContributions],
      };
    });
  }, [userId, data.investments]);

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
