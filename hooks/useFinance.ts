"use client";

import { useCallback, useMemo } from "react";
import type {
  FinanceEntry,
  Debt,
  Goal,
  FinanceType,
  FinanceCategory,
  FinanceRecurrenceRule,
  FinancialGoalCategory,
  Achievement,
  FlowTaskData,
} from "@/types";
import { updateData } from "@/lib/data/store";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/components/providers/AuthProvider";
import { levelFromXp, XP, type CelebrationResult } from "@/lib/gamification";
import { uid, todayISO, daysUntil } from "@/lib/utils";

export interface EntryFormData {
  type: FinanceType;
  amount: number;
  description: string;
  date: string;
  category: FinanceCategory;
  tags: string[];
  isRecurring: boolean;
  recurrenceRule: FinanceRecurrenceRule | null;
}

export interface DebtFormData {
  name: string;
  totalAmount: number;
  paidAmount: number;
  installmentsTotal: number;
  installmentsPaid: number;
  dueDay: number;
  interestRate: number | null;
  notes: string;
}

export interface GoalFormData {
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  category: FinancialGoalCategory;
  linkedModule: "apartamento" | "casamento" | null;
}

export function useFinance() {
  const data = useData();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // Virtual wedding expense entries mapping actual costs
  const allFinances = useMemo(() => {
    const list = [...data.finances];
    const budgetList = data.weddingBudget || [];
    budgetList.forEach((b) => {
      if (b.actualCost > 0) {
        list.push({
          id: `virtual-wedding-${b.id}`,
          type: "expense",
          amount: b.actualCost,
          description: `Casamento: ${b.category}`,
          date: todayISO(),
          category: "casamento",
          tags: ["casamento"],
          isRecurring: false,
          recurrenceRule: null,
          createdBy: userId || "lucas",
          createdAt: new Date().toISOString(),
        });
      }
    });
    return list;
  }, [data.finances, data.weddingBudget, userId]);

  // Helper to apply XP reward and check achievements manually
  const rewardUser = useCallback(
    (d: FlowTaskData, xpReward: number, manualAchievementId?: string): { nextData: FlowTaskData; result: CelebrationResult | null } => {
      if (!userId) return { nextData: d, result: null };

      const users = d.users.map((u) => ({ ...u }));
      const me = users.find((u) => u.id === userId);
      if (!me) return { nextData: d, result: null };

      const xpBefore = me.xp;
      const levelBefore = levelFromXp(xpBefore).level;
      let totalXpGained = xpReward;

      me.xp += xpReward;

      let userAchievements = d.userAchievements;
      const unlocked: Achievement[] = [];

      if (manualAchievementId) {
        const alreadyHas = userAchievements.some(
          (ua) => ua.userId === userId && ua.achievementId === manualAchievementId
        );
        if (!alreadyHas) {
          const ach = d.achievements.find((a) => a.id === manualAchievementId);
          if (ach) {
            userAchievements = [
              ...userAchievements,
              {
                id: uid("ua"),
                userId,
                achievementId: manualAchievementId,
                unlockedAt: new Date().toISOString(),
              },
            ];
            me.xp += ach.xpReward;
            totalXpGained += ach.xpReward;
            unlocked.push(ach);
          }
        }
      }

      const after = levelFromXp(me.xp);
      me.level = after.level;

      const result: CelebrationResult = {
        xpGained: totalXpGained,
        leveledUp: after.level > levelBefore,
        newLevel: after.level,
        newTitle: after.title,
        achievements: unlocked,
        streakCount: me.streakCount,
      };

      return {
        nextData: { ...d, users, userAchievements },
        result,
      };
    },
    [userId]
  );

  // ----------------------------------------------------
  // FINANCE ENTRIES (INCOME / EXPENSE) CRUD
  // ----------------------------------------------------

  const createEntry = useCallback(
    (form: EntryFormData): CelebrationResult | null => {
      if (!userId) return null;
      let celebration: CelebrationResult | null = null;

      updateData((d) => {
        const newEntry: FinanceEntry = {
          id: uid("f"),
          type: form.type,
          amount: form.amount,
          description: form.description.trim(),
          date: form.date,
          category: form.category,
          tags: form.tags,
          isRecurring: form.isRecurring,
          recurrenceRule: form.isRecurring ? form.recurrenceRule : null,
          createdBy: userId,
          createdAt: new Date().toISOString(),
        };

        const withEntry = { ...d, finances: [...d.finances, newEntry] };
        const { nextData, result } = rewardUser(withEntry, XP.financeEntry);
        celebration = result;
        return nextData;
      });

      return celebration;
    },
    [userId, rewardUser]
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<FinanceEntry>) => {
      updateData((d) => ({
        ...d,
        finances: d.finances.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      }));
    },
    []
  );

  const deleteEntry = useCallback((id: string) => {
    updateData((d) => ({
      ...d,
      finances: d.finances.filter((f) => f.id !== id),
    }));
  }, []);

  // ----------------------------------------------------
  // DEBTS CRUD & PAYMENT
  // ----------------------------------------------------

  const createDebt = useCallback(
    (form: DebtFormData) => {
      if (!userId) return;
      updateData((d) => {
        const isPaid = form.paidAmount >= form.totalAmount || form.installmentsPaid >= form.installmentsTotal;
        const newDebt: Debt = {
          id: uid("d"),
          name: form.name.trim(),
          totalAmount: form.totalAmount,
          paidAmount: form.paidAmount,
          installmentsTotal: form.installmentsTotal,
          installmentsPaid: form.installmentsPaid,
          dueDay: form.dueDay,
          interestRate: form.interestRate,
          status: isPaid ? "quitada" : "ativa",
          notes: form.notes.trim(),
          createdBy: userId,
          createdAt: new Date().toISOString(),
          paidAt: isPaid ? new Date().toISOString() : null,
        };
        return { ...d, debts: [...d.debts, newDebt] };
      });
    },
    [userId]
  );

  const updateDebt = useCallback(
    (id: string, patch: Partial<Debt>) => {
      updateData((d) => ({
        ...d,
        debts: d.debts.map((debt) => {
          if (debt.id !== id) return debt;
          const merged = { ...debt, ...patch };
          const isPaid = merged.paidAmount >= merged.totalAmount || merged.installmentsPaid >= merged.installmentsTotal;
          return {
            ...merged,
            status: isPaid ? "quitada" : "ativa",
            paidAt: isPaid ? (debt.paidAt || new Date().toISOString()) : null,
          };
        }),
      }));
    },
    []
  );

  const deleteDebt = useCallback((id: string) => {
    updateData((d) => ({
      ...d,
      debts: d.debts.filter((debt) => debt.id !== id),
    }));
  }, []);

  const payDebtInstallment = useCallback(
    (id: string): CelebrationResult | null => {
      if (!userId) return null;
      let celebration: CelebrationResult | null = null;

      updateData((d) => {
        const debt = d.debts.find((db) => db.id === id);
        if (!debt || debt.status === "quitada") return d;

        const nextInstallmentsPaid = Math.min(debt.installmentsTotal, debt.installmentsPaid + 1);
        const singleInstallmentValue = debt.totalAmount / debt.installmentsTotal;
        const nextPaidAmount = Math.min(debt.totalAmount, debt.paidAmount + singleInstallmentValue);
        const isPaidNow = nextInstallmentsPaid === debt.installmentsTotal || nextPaidAmount >= debt.totalAmount;

        // Also register an expense entry automatically!
        const paymentExpense: FinanceEntry = {
          id: uid("f"),
          type: "expense",
          amount: singleInstallmentValue,
          description: `Pagto ${nextInstallmentsPaid}/${debt.installmentsTotal} - ${debt.name}`,
          date: todayISO(),
          category: "outros",
          tags: ["divida"],
          isRecurring: false,
          recurrenceRule: null,
          createdBy: userId,
          createdAt: new Date().toISOString(),
        };

        const updatedDebts = d.debts.map((db) =>
          db.id === id
            ? {
                ...db,
                installmentsPaid: nextInstallmentsPaid,
                paidAmount: nextPaidAmount,
                status: (isPaidNow ? "quitada" : "ativa") as Debt["status"],
                paidAt: isPaidNow ? new Date().toISOString() : null,
              }
            : db
        );

        const withPayment = {
          ...d,
          debts: updatedDebts,
          finances: [...d.finances, paymentExpense],
        };

        if (isPaidNow) {
          const { nextData, result } = rewardUser(withPayment, XP.debtPaid, "ach_debt_zero");
          celebration = result;
          return nextData;
        } else {
          // Just standard entry XP (5 XP) for register expense
          const { nextData, result } = rewardUser(withPayment, XP.financeEntry);
          celebration = result;
          return nextData;
        }
      });

      return celebration;
    },
    [userId, rewardUser]
  );

  // ----------------------------------------------------
  // GOALS CRUD & DEPOSIT
  // ----------------------------------------------------

  const createGoal = useCallback(
    (form: GoalFormData) => {
      if (!userId) return;
      updateData((d) => {
        const isDone = form.currentAmount >= form.targetAmount;
        const newGoal: Goal = {
          id: uid("g"),
          title: form.title.trim(),
          description: form.description.trim(),
          type: "financeira",
          targetAmount: form.targetAmount,
          currentAmount: form.currentAmount,
          deadline: form.deadline,
          category: form.category,
          linkedModule: form.linkedModule,
          xpReward: XP.financialGoal,
          status: isDone ? "concluida" : "em_andamento",
          createdBy: userId,
          createdAt: new Date().toISOString(),
          completedAt: isDone ? new Date().toISOString() : null,
        };
        return { ...d, goals: [...d.goals, newGoal] };
      });
    },
    [userId]
  );

  const updateGoal = useCallback(
    (id: string, patch: Partial<Goal>) => {
      updateData((d) => ({
        ...d,
        goals: d.goals.map((g) => {
          if (g.id !== id) return g;
          const merged = { ...g, ...patch };
          const isDone = merged.currentAmount >= merged.targetAmount;
          return {
            ...merged,
            status: isDone ? "concluida" : "em_andamento",
            completedAt: isDone ? (g.completedAt || new Date().toISOString()) : null,
          };
        }),
      }));
    },
    []
  );

  const deleteGoal = useCallback((id: string) => {
    updateData((d) => ({
      ...d,
      goals: d.goals.filter((g) => g.id !== id),
    }));
  }, []);

  const depositToGoal = useCallback(
    (id: string, amount: number): CelebrationResult | null => {
      if (!userId) return null;
      let celebration: CelebrationResult | null = null;

      updateData((d) => {
        const goal = d.goals.find((g) => g.id === id);
        if (!goal || goal.status === "concluida") return d;

        const nextCurrentAmount = Math.min(goal.targetAmount, goal.currentAmount + amount);
        const isDoneNow = nextCurrentAmount >= goal.targetAmount;

        // Also register an expense entry automatically p/ registrar a saída!
        const depositExpense: FinanceEntry = {
          id: uid("f"),
          type: "expense",
          amount: amount,
          description: `Depósito Meta - ${goal.title}`,
          date: todayISO(),
          category: goal.category === "casamento" ? "casamento" : goal.category === "apartamento" ? "apartamento" : "outros",
          tags: ["meta"],
          isRecurring: false,
          recurrenceRule: null,
          createdBy: userId,
          createdAt: new Date().toISOString(),
        };

        const updatedGoals = d.goals.map((g) =>
          g.id === id
            ? {
                ...g,
                currentAmount: nextCurrentAmount,
                status: (isDoneNow ? "concluida" : "em_andamento") as Goal["status"],
                completedAt: isDoneNow ? new Date().toISOString() : null,
              }
            : g
        );

        const withDeposit = {
          ...d,
          goals: updatedGoals,
          finances: [...d.finances, depositExpense],
        };

        if (isDoneNow) {
          const { nextData, result } = rewardUser(withDeposit, XP.financialGoal, "ach_saver");
          celebration = result;
          return nextData;
        } else {
          // Just standard entry XP (5 XP) for expense register
          const { nextData, result } = rewardUser(withDeposit, XP.financeEntry);
          celebration = result;
          return nextData;
        }
      });

      return celebration;
    },
    [userId, rewardUser]
  );

  // ----------------------------------------------------
  // CALCULATIONS / ANALYTICS
  // ----------------------------------------------------

  const getEntriesByMonth = useCallback(
    (month: number, year: number): FinanceEntry[] => {
      const pad = (n: number) => String(n).padStart(2, "0");
      const key = `${year}-${pad(month)}`;
      return allFinances.filter((f) => f.date.slice(0, 7) === key);
    },
    [allFinances]
  );

  const getMonthlyTotals = useCallback(
    (month: number, year: number) => {
      const entries = getEntriesByMonth(month, year);
      let income = 0;
      let expense = 0;
      for (const e of entries) {
        if (e.type === "income") income += e.amount;
        else expense += e.amount;
      }
      return { income, expense, balance: income - expense };
    },
    [getEntriesByMonth]
  );

  const getLast6MonthsTotals = useCallback(() => {
    const buckets: { month: string; label: string; income: number; expense: number }[] = [];
    const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const pad = (n: number) => String(n).padStart(2, "0");
      const key = `${year}-${pad(monthIndex + 1)}`;

      buckets.push({
        month: key,
        label: MONTH_LABELS[monthIndex],
        income: 0,
        expense: 0,
      });
    }

    const index = new Map(buckets.map((b) => [b.month, b]));

    for (const e of allFinances) {
      const k = e.date.slice(0, 7);
      const b = index.get(k);
      if (!b) continue;
      if (e.type === "income") b.income += e.amount;
      else b.expense += e.amount;
    }

    return buckets;
  }, [allFinances]);

  const getExpensesByCategory = useCallback(
    (month: number, year: number) => {
      const entries = getEntriesByMonth(month, year).filter((f) => f.type === "expense");
      const total = entries.reduce((acc, curr) => acc + curr.amount, 0);

      const map = new Map<string, number>();
      for (const e of entries) {
        map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
      }

      return Array.from(map.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);
    },
    [getEntriesByMonth]
  );

  const getProjection = useCallback(() => {
    // Media simples dos ultimos 3 meses disponiveis
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    const last3Months: { m: number; y: number }[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      last3Months.push({ m: d.getMonth() + 1, y: d.getFullYear() });
    }

    let totalIncome = 0;
    let totalExpense = 0;

    for (const { m, y } of last3Months) {
      const totals = getMonthlyTotals(m, y);
      totalIncome += totals.income;
      totalExpense += totals.expense;
    }

    const avgIncome = Math.round(totalIncome / 3);
    const avgExpense = Math.round(totalExpense / 3);

    return {
      avgIncome,
      avgExpense,
      projectedBalance: avgIncome - avgExpense,
    };
  }, [getMonthlyTotals]);

  // ----------------------------------------------------
  // LOCAL RULE-BASED ADVISOR / SUGGESTIONS
  // ----------------------------------------------------

  const getSuggestions = useCallback(() => {
    const now = new Date();
    const currentM = now.getMonth() + 1;
    const currentY = now.getFullYear();

    const totals = getMonthlyTotals(currentM, currentY);
    const expensesCat = getExpensesByCategory(currentM, currentY);
    const activeGoals = data.goals.filter((g) => g.status === "em_andamento" && g.type === "financeira");
    const activeDebts = data.debts.filter((d) => d.status === "ativa");

    const suggestions: { type: "info" | "warning" | "danger"; title: string; message: string }[] = [];

    // Alert 1: Negativity
    if (totals.balance < 0) {
      suggestions.push({
        type: "danger",
        title: "Atenção: Saldo Negativo",
        message: `Este mês as saídas superaram as entradas em R$ ${Math.abs(totals.balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. Considere revisar seus gastos não essenciais.`,
      });
    }

    // Alert 2: Top categories
    const foodCat = expensesCat.find((c) => c.category === "alimentacao");
    if (foodCat && foodCat.percentage > 30) {
      suggestions.push({
        type: "warning",
        title: "Alimentação Elevada",
        message: `Alimentação representou ${foodCat.percentage}% de todos os seus gastos deste mês. Definir um limite mensal para iFood e restaurantes pode ajudar.`,
      });
    }

    const leisureCat = expensesCat.find((c) => c.category === "lazer");
    if (leisureCat && leisureCat.percentage > 25) {
      suggestions.push({
        type: "warning",
        title: "Gastos com Lazer",
        message: `Lazer representou ${leisureCat.percentage}% das despesas. Considere alternativas de passeios gratuitos ou mais econômicos para a semana.`,
      });
    }

    // Alert 3: Debts near due (< 7 days)
    const today = now.getDate();
    for (const d of activeDebts) {
      const diff = d.dueDay - today;
      if (diff >= 0 && diff <= 7) {
        suggestions.push({
          type: "danger",
          title: `Dívida Vencendo em Breve: ${d.name}`,
          message: `O vencimento é todo dia ${d.dueDay} (faltam ${diff === 0 ? "hoje" : diff === 1 ? "1 dia" : `${diff} dias`}). Prepare o pagamento de R$ ${(d.totalAmount / d.installmentsTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
        });
      }
    }

    // Alert 4: Goals saving speed
    for (const g of activeGoals) {
      if (!g.deadline) continue;
      const days = daysUntil(g.deadline);
      const monthsRemaining = Math.max(1, Math.ceil(days / 30));
      const targetSavingPerMonth = Math.max(0, (g.targetAmount - g.currentAmount) / monthsRemaining);

      if (targetSavingPerMonth > 0) {
        suggestions.push({
          type: "info",
          title: `Economia para: ${g.title}`,
          message: `Guarde R$ ${targetSavingPerMonth.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}/mês durante os próximos ${monthsRemaining} meses para atingir sua meta no prazo de ${new Date(g.deadline).toLocaleDateString("pt-BR")}.`,
        });
      }
    }

    // Default tip if list is empty
    if (suggestions.length === 0) {
      suggestions.push({
        type: "info",
        title: "Tudo sob controle!",
        message: "Suas finanças parecem saudáveis e organizadas este mês. Continue acompanhando e registrando suas entradas e saídas!",
      });
    }

    return suggestions;
  }, [getMonthlyTotals, getExpensesByCategory, data.goals, data.debts]);

  return {
    finances: allFinances,
    debts: data.debts,
    goals: data.goals.filter((g) => g.type === "financeira"), // only financial goals in hook context
    createEntry,
    updateEntry,
    deleteEntry,
    createDebt,
    updateDebt,
    deleteDebt,
    payDebtInstallment,
    createGoal,
    updateGoal,
    deleteGoal,
    depositToGoal,
    getEntriesByMonth,
    getMonthlyTotals,
    getLast6MonthsTotals,
    getExpensesByCategory,
    getProjection,
    getSuggestions,
  };
}
