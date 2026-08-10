"use client";

import { useCallback, useMemo } from "react";
import type {
  MonthlyExpense,
  MonthlyExpenseCategory,
  ExpenseRecurrence,
  Achievement,
  FlowTaskData,
} from "@/types";
import { updateData } from "@/lib/data/store";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/components/providers/AuthProvider";
import { levelFromXp, XP, type CelebrationResult } from "@/lib/gamification";
import { uid } from "@/lib/utils";
import { LUCAS_ID } from "@/hooks/useIncomeProfile";

export interface ExpenseFormData {
  name: string;
  category: MonthlyExpenseCategory;
  amount: number;
  recurrence: ExpenseRecurrence;
  installmentsTotal: number | null;
  installmentsPaid: number;
  dueDay: number | null;
  notes: string;
}

/** Whole-day count until the next occurrence of a monthly due day (0 = today). */
export function daysUntilDueDay(dueDay: number | null | undefined): number | null {
  if (!dueDay || dueDay < 1 || dueDay > 31) return null;
  const now = new Date();
  const today = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInThisMonth = new Date(year, month + 1, 0).getDate();
  if (dueDay >= today) return Math.min(dueDay, daysInThisMonth) - today;
  // next month
  const target = Math.min(dueDay, new Date(year, month + 2, 0).getDate());
  return daysInThisMonth - today + target;
}

export function useMonthlyExpenses() {
  const data = useData();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const expenses = useMemo<MonthlyExpense[]>(
    () => (data.monthlyExpenses || []).filter((e) => e.userId === userId),
    [data.monthlyExpenses, userId],
  );
  const activeExpenses = useMemo(() => expenses.filter((e) => e.isActive), [expenses]);
  /** Recurring (counts toward the monthly total — excludes 'eventual'). */
  const recurringExpenses = useMemo(
    () => activeExpenses.filter((e) => e.recurrence !== "eventual"),
    [activeExpenses],
  );
  const eventualExpenses = useMemo(
    () => activeExpenses.filter((e) => e.recurrence === "eventual"),
    [activeExpenses],
  );

  const getTotalExpenses = useCallback(
    () => recurringExpenses.reduce((s, e) => s + e.amount, 0),
    [recurringExpenses],
  );
  const getEventualTotal = useCallback(
    () => eventualExpenses.reduce((s, e) => s + e.amount, 0),
    [eventualExpenses],
  );

  const getExpensesByCategory = useCallback(() => {
    const total = getTotalExpenses();
    const map = new Map<MonthlyExpenseCategory, number>();
    for (const e of recurringExpenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [recurringExpenses, getTotalExpenses]);

  const getExpensesDueThisWeek = useCallback(
    () =>
      recurringExpenses.filter((e) => {
        const d = daysUntilDueDay(e.dueDay);
        return d !== null && d >= 0 && d <= 7;
      }),
    [recurringExpenses],
  );
  const getExpensesDueToday = useCallback(
    () => recurringExpenses.filter((e) => daysUntilDueDay(e.dueDay) === 0),
    [recurringExpenses],
  );

  /* ---- gamification helper ------------------------------------------------- */
  const rewardUser = useCallback(
    (d: FlowTaskData, xpReward: number, manualAchievementIds: string[] = []) => {
      if (!userId) return { nextData: d, result: null as CelebrationResult | null };
      const users = d.users.map((u) => ({ ...u }));
      const me = users.find((u) => u.id === userId);
      if (!me) return { nextData: d, result: null };

      const levelBefore = levelFromXp(me.xp).level;
      let totalXpGained = xpReward;
      me.xp += xpReward;

      let userAchievements = d.userAchievements;
      const unlocked: Achievement[] = [];
      for (const achId of manualAchievementIds) {
        if (userAchievements.some((ua) => ua.userId === userId && ua.achievementId === achId)) continue;
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
        } as CelebrationResult,
      };
    },
    [userId],
  );

  /* ---- CRUD ---------------------------------------------------------------- */
  const addExpense = useCallback(
    (form: ExpenseFormData): CelebrationResult | null => {
      if (!userId) return null;
      let celebration: CelebrationResult | null = null;
      updateData((d) => {
        const nowIso = new Date().toISOString();
        const parceled = form.recurrence === "parcelado";
        const expense: MonthlyExpense = {
          id: uid("exp"),
          userId,
          name: form.name.trim(),
          category: form.category,
          amount: form.amount,
          recurrence: form.recurrence,
          installmentsTotal: parceled ? form.installmentsTotal : null,
          installmentsPaid: parceled ? form.installmentsPaid : 0,
          dueDay: form.dueDay,
          isActive: true,
          notes: form.notes.trim() || undefined,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        const next = { ...d, monthlyExpenses: [...d.monthlyExpenses, expense] };
        const activeCount = next.monthlyExpenses.filter((e) => e.userId === userId && e.isActive).length;
        const manual = activeCount >= 5 ? ["ach_organized"] : [];
        const { nextData, result } = rewardUser(next, XP.expenseAdd, manual);
        celebration = result;
        return nextData;
      });
      return celebration;
    },
    [userId, rewardUser],
  );

  const updateExpense = useCallback((id: string, patch: Partial<MonthlyExpense>) => {
    updateData((d) => ({
      ...d,
      monthlyExpenses: d.monthlyExpenses.map((e) =>
        e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e,
      ),
    }));
  }, []);

  const removeExpense = useCallback((id: string) => {
    updateData((d) => ({
      ...d,
      monthlyExpenses: d.monthlyExpenses.filter((e) => e.id !== id),
    }));
  }, []);

  /** Advance a parcel; if it clears the debt, mark inactive + reward (+30 XP, Dívida zero). */
  const advanceInstallment = useCallback(
    (id: string): { celebration: CelebrationResult | null; quitadoName: string | null } => {
      if (!userId) return { celebration: null, quitadoName: null };
      let celebration: CelebrationResult | null = null;
      let quitadoName: string | null = null;

      updateData((d) => {
        const exp = d.monthlyExpenses.find((e) => e.id === id);
        if (!exp || exp.recurrence !== "parcelado" || !exp.installmentsTotal) return d;

        const nextPaid = Math.min(exp.installmentsTotal, exp.installmentsPaid + 1);
        const cleared = nextPaid >= exp.installmentsTotal;
        const updated: MonthlyExpense = {
          ...exp,
          installmentsPaid: nextPaid,
          isActive: cleared ? false : exp.isActive,
          updatedAt: new Date().toISOString(),
        };
        const next = {
          ...d,
          monthlyExpenses: d.monthlyExpenses.map((e) => (e.id === id ? updated : e)),
        };

        if (cleared) {
          quitadoName = exp.name;
          const { nextData, result } = rewardUser(next, XP.installmentPaid, ["ach_debt_zero"]);
          celebration = result;
          return nextData;
        }
        return next;
      });

      return { celebration, quitadoName };
    },
    [userId, rewardUser],
  );

  /* ---- seed (Lucas, once) -------------------------------------------------- */
  const seedIfEmpty = useCallback(() => {
    if (!userId || userId !== LUCAS_ID) return;
    if (typeof window === "undefined") return;
    const flagKey = `flowtask_expenses_seed_${userId}`;
    if (window.localStorage.getItem(flagKey)) return;
    window.localStorage.setItem(flagKey, "1");

    updateData((d) => {
      if ((d.monthlyExpenses || []).some((e) => e.userId === userId)) return d;
      const nowIso = new Date().toISOString();
      const mk = (
        name: string,
        category: MonthlyExpenseCategory,
        amount: number,
        dueDay: number,
        opts?: { recurrence?: ExpenseRecurrence; installmentsTotal?: number; installmentsPaid?: number; notes?: string },
      ): MonthlyExpense => ({
        id: uid("exp"),
        userId,
        name,
        category,
        amount,
        recurrence: opts?.recurrence ?? "mensal",
        installmentsTotal: opts?.installmentsTotal ?? null,
        installmentsPaid: opts?.installmentsPaid ?? 0,
        dueDay,
        isActive: true,
        notes: opts?.notes,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      const seeds: MonthlyExpense[] = [
        mk("Condomínio", "moradia", 338.67, 10, { notes: "Dezainy A Cobrança Ltda" }),
        mk("Fatura Nubank", "cartao", 366.03, 14, { notes: "Fatura mensal Nubank" }),
        mk("Banco Santander", "financiamento", 105.52, 17, { notes: "Boleto Santander" }),
        mk("Banco do Brasil", "financiamento", 150.34, 24, { notes: "Boleto Banco do Brasil" }),
        mk("Cartão Caixa", "cartao", 500, 5, { recurrence: "parcelado", installmentsTotal: 4, installmentsPaid: 1, notes: "4x parcela cartão Caixa" }),
        mk("UNIFIL - Faculdade", "educacao", 200, 10, { notes: "Mensalidade faculdade" }),
        mk("Totalpass", "saude", 50, 1, { notes: "Academia via benefício — co-participação R$50" }),
      ];
      return { ...d, monthlyExpenses: [...d.monthlyExpenses, ...seeds] };
    });
  }, [userId]);

  return {
    expenses,
    activeExpenses,
    recurringExpenses,
    eventualExpenses,
    getTotalExpenses,
    getEventualTotal,
    getExpensesByCategory,
    getExpensesDueThisWeek,
    getExpensesDueToday,
    addExpense,
    updateExpense,
    removeExpense,
    advanceInstallment,
    seedIfEmpty,
  };
}
