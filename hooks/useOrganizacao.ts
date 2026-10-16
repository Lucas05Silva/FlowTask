"use client";

import { useCallback, useMemo } from "react";
import type {
  Assignee,
  Dream,
  DreamColor,
  FinanceEntry,
  FinancialIdea,
  Goal,
  IdeaDestination,
  MonthlyPlan,
  MonthlyPlanItem,
  Note,
  PlanItemCategory,
  PlanItemLinkType,
  Task,
} from "@/types";
import { getHydrated, updateData } from "@/lib/data/store";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/components/providers/AuthProvider";
import { useFinance } from "@/hooks/useFinance";
import { useInvestments } from "@/hooks/useInvestments";
import { KNOWN_USERS } from "@/lib/data/initialState";
import { XP, taskXp, type CelebrationResult } from "@/lib/gamification";
import { uid, todayISO } from "@/lib/utils";
import {
  computeDistribution,
  dreamEmoji,
  planId as buildPlanId,
  projectAmounts,
  projectGoal,
  shiftMonth,
  type AmountProjection,
} from "@/lib/organizacao";

export interface PlanItemFormData {
  name: string;
  category: PlanItemCategory;
  plannedAmount: number;
  linkedType: PlanItemLinkType | null;
  linkedId: string | null;
  notes: string;
}

export interface PromoteFormData {
  title: string;
  /** task: due date · goal: deadline */
  date: string | null;
  /** goal only */
  targetAmount: number;
}

export interface DreamFormData {
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  linkedGoalId: string | null;
  color: DreamColor;
  notes: string;
}

/** A dream with its effective values (live from the linked goal, when linked). */
export interface ResolvedDream {
  dream: Dream;
  target: number;
  current: number;
  linkedGoal: Goal | null;
  projection: AmountProjection;
}

/** Result of marking an item as paid — the page turns it into toasts/confetti. */
export interface PaidResult {
  message: string;
  celebration: CelebrationResult | null;
}

const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;
const newUUID = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : uid("n");

export function useOrganizacao(month: number, year: number) {
  const data = useData();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const me: Assignee | null =
    userId === KNOWN_USERS[0].id ? "lucas" : userId === KNOWN_USERS[1].id ? "thaiane" : null;

  const { debts, goals: financialGoals, payDebtInstallment, depositToGoal } = useFinance();
  const { investments, contributions, addContribution } = useInvestments();

  const currentPlanId = userId ? buildPlanId(userId, year, month) : null;
  const key = monthKey(year, month);

  /* ---- reads (RLS already scopes these tables to the user; filter anyway) -- */
  const plan = useMemo<MonthlyPlan | null>(
    () => data.monthlyPlans.find((p) => p.id === currentPlanId && p.userId === userId) ?? null,
    [data.monthlyPlans, currentPlanId, userId],
  );
  const items = useMemo(
    () => data.monthlyPlanItems.filter((i) => i.planId === currentPlanId && i.userId === userId),
    [data.monthlyPlanItems, currentPlanId, userId],
  );
  const ideas = useMemo(
    () =>
      data.financialIdeas
        .filter((i) => i.planId === currentPlanId && i.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data.financialIdeas, currentPlanId, userId],
  );

  const distribution = useMemo(() => computeDistribution(plan?.totalIncome ?? 0, items), [plan, items]);

  /**
   * An item counts as done if it was checked here OR its linked record shows
   * activity in this month elsewhere (debt installment paid in Dívidas,
   * aporte in Investimentos, deposit / completion in Metas).
   */
  const itemStatus = useCallback(
    (item: MonthlyPlanItem): { done: boolean; external: boolean; goalReached: boolean } => {
      let external = false;
      let goalReached = false;
      if (item.linkedType === "debt" && item.linkedId) {
        const debt = debts.find((d) => d.id === item.linkedId);
        if (debt) {
          external =
            debt.status === "quitada" ||
            data.finances.some(
              (f) => f.date.slice(0, 7) === key && f.tags?.includes("divida") && f.description.endsWith(`- ${debt.name}`),
            );
        }
      } else if (item.linkedType === "investment" && item.linkedId) {
        external = contributions.some((c) => c.investmentId === item.linkedId && c.date.slice(0, 7) === key);
      } else if (item.linkedType === "financial_goal" && item.linkedId) {
        const goal = financialGoals.find((g) => g.id === item.linkedId);
        if (goal) {
          goalReached = goal.status === "concluida";
          external =
            goalReached ||
            data.finances.some(
              (f) => f.date.slice(0, 7) === key && f.description === `Depósito Meta - ${goal.title}`,
            );
        }
      }
      return { done: item.isPaid || external, external: external && !item.isPaid, goalReached };
    },
    [debts, contributions, financialGoals, data.finances, key],
  );

  /* ---- plan ------------------------------------------------------------------ */
  const createPlan = useCallback(
    (totalIncome: number) => {
      if (!userId || !currentPlanId) return;
      const now = new Date().toISOString();
      updateData((d) => {
        if (d.monthlyPlans.some((p) => p.id === currentPlanId)) return d;
        const p: MonthlyPlan = {
          id: currentPlanId, userId, month, year, totalIncome, notes: "",
          patrimonyTotal: null, createdAt: now, updatedAt: now,
        };
        return { ...d, monthlyPlans: [...d.monthlyPlans, p] };
      });
    },
    [userId, currentPlanId, month, year],
  );

  const updatePlan = useCallback(
    (patch: Partial<Pick<MonthlyPlan, "totalIncome" | "notes" | "patrimonyTotal">>) => {
      if (!currentPlanId) return;
      updateData((d) => ({
        ...d,
        monthlyPlans: d.monthlyPlans.map((p) =>
          p.id === currentPlanId ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
        ),
      }));
    },
    [currentPlanId],
  );

  /** Copy last month's items (unpaid) into this month's plan — quick start. */
  const copyPreviousItems = useCallback(() => {
    if (!userId || !currentPlanId) return 0;
    const prev = shiftMonth(month, year, -1);
    const prevId = buildPlanId(userId, prev.year, prev.month);
    const source = data.monthlyPlanItems.filter((i) => i.planId === prevId);
    if (source.length === 0) return 0;
    const now = new Date().toISOString();
    updateData((d) => ({
      ...d,
      monthlyPlanItems: [
        ...d.monthlyPlanItems,
        ...source.map((s) => ({
          ...s, id: uid("mpi"), planId: currentPlanId, isPaid: false, paidAt: null,
          paidRecordId: null, actualAmount: 0, createdAt: now,
        })),
      ],
    }));
    return source.length;
  }, [userId, currentPlanId, month, year, data.monthlyPlanItems]);

  /* ---- items ----------------------------------------------------------------- */
  const addItem = useCallback(
    (form: PlanItemFormData) => {
      if (!userId || !currentPlanId) return;
      const item: MonthlyPlanItem = {
        id: uid("mpi"), planId: currentPlanId, userId,
        category: form.category, name: form.name.trim(), plannedAmount: form.plannedAmount,
        actualAmount: 0, linkedType: form.linkedType, linkedId: form.linkedId,
        isPaid: false, paidAt: null, paidRecordId: null,
        notes: form.notes.trim() || undefined, createdAt: new Date().toISOString(),
      };
      updateData((d) => ({ ...d, monthlyPlanItems: [...d.monthlyPlanItems, item] }));
    },
    [userId, currentPlanId],
  );

  const updateItem = useCallback((id: string, patch: Partial<MonthlyPlanItem>) => {
    updateData((d) => ({
      ...d,
      monthlyPlanItems: d.monthlyPlanItems.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  }, []);

  const deleteItem = useCallback((id: string) => {
    updateData((d) => ({ ...d, monthlyPlanItems: d.monthlyPlanItems.filter((i) => i.id !== id) }));
  }, []);

  /**
   * Mark as paid AND run the matching action in the source module:
   * dívida → paga uma parcela · investimento → aporte · meta/reserva (meta) → depósito ·
   * conta sem vínculo → lançamento de saída pessoal no Financeiro.
   */
  const markPaid = useCallback(
    (item: MonthlyPlanItem): PaidResult | null => {
      if (!userId) return null;
      const nowIso = new Date().toISOString();
      let celebration: CelebrationResult | null = null;
      let message = `✅ ${item.name} marcado como pago na Organização`;
      let paidRecordId: string | null = null;

      if (item.linkedType === "debt" && item.linkedId) {
        celebration = payDebtInstallment(item.linkedId);
        message = `💳 Parcela de ${item.name} paga via Organização`;
      } else if (item.linkedType === "investment" && item.linkedId) {
        celebration = addContribution(item.linkedId, {
          amount: item.plannedAmount, date: todayISO(), contributor: me ?? "ambos",
          notes: "Via Organização", registerAsExpense: false,
        });
        const inv = investments.find((i) => i.id === item.linkedId);
        message = `📈 Aporte no ${inv?.name ?? item.name} registrado via Organização`;
      } else if (item.linkedType === "financial_goal" && item.linkedId) {
        celebration = depositToGoal(item.linkedId, item.plannedAmount);
        const goal = financialGoals.find((g) => g.id === item.linkedId);
        message = `🎯 Depósito na meta ${goal?.title ?? item.name} registrado — progresso atualizado`;
      } else if (item.category === "fixa" || item.category === "variavel" || item.category === "divida") {
        // Unlinked conta → personal expense in the Financeiro (owner = me).
        const entry: FinanceEntry = {
          id: uid("f"), type: "expense", amount: item.plannedAmount, description: item.name,
          date: todayISO(), category: "outros", tags: ["organizacao"], isRecurring: false,
          recurrenceRule: null, ...(me ? { owner: me } : {}), createdBy: userId, createdAt: nowIso,
        };
        paidRecordId = entry.id;
        updateData((d) => ({ ...d, finances: [...d.finances, entry] }));
      } else {
        message = `🌱 ${item.name} guardado — marcado na Organização`;
      }

      updateData((d) => ({
        ...d,
        monthlyPlanItems: d.monthlyPlanItems.map((i) =>
          i.id === item.id
            ? { ...i, isPaid: true, paidAt: nowIso, actualAmount: item.plannedAmount, paidRecordId }
            : i,
        ),
      }));
      return { message, celebration };
    },
    [userId, me, payDebtInstallment, addContribution, depositToGoal, investments, financialGoals],
  );

  /** Undo is only safe when the payment created a plain lançamento (or nothing). */
  const canUndo = (item: MonthlyPlanItem) => item.isPaid && !item.linkedType;

  const undoPaid = useCallback((item: MonthlyPlanItem) => {
    if (!item.isPaid || item.linkedType) return;
    updateData((d) => ({
      ...d,
      finances: item.paidRecordId ? d.finances.filter((f) => f.id !== item.paidRecordId) : d.finances,
      monthlyPlanItems: d.monthlyPlanItems.map((i) =>
        i.id === item.id ? { ...i, isPaid: false, paidAt: null, actualAmount: 0, paidRecordId: null } : i,
      ),
    }));
  }, []);

  /* ---- ideas ----------------------------------------------------------------- */
  const addIdea = useCallback(
    (content: string) => {
      if (!userId || !currentPlanId || !content.trim()) return;
      const idea: FinancialIdea = {
        id: uid("idea"), userId, planId: currentPlanId, content: content.trim(),
        promotedTo: null, promotedId: null, createdAt: new Date().toISOString(),
      };
      updateData((d) => ({ ...d, financialIdeas: [...d.financialIdeas, idea] }));
    },
    [userId, currentPlanId],
  );

  const deleteIdea = useCallback((id: string) => {
    updateData((d) => ({ ...d, financialIdeas: d.financialIdeas.filter((i) => i.id !== id) }));
  }, []);

  /** Create a task / financial goal / note from an idea and mark it promoted. */
  const promoteIdea = useCallback(
    (idea: FinancialIdea, destination: IdeaDestination, form: PromoteFormData) => {
      if (!userId) return;
      const nowIso = new Date().toISOString();
      updateData((d) => {
        let next = d;
        let promotedId: string;
        if (destination === "task") {
          const task: Task = {
            id: uid("t"), title: form.title.trim(), description: idea.content, dueDate: form.date,
            priority: "media", category: "financeiro", status: "a_fazer", assignee: me ?? "ambos",
            subtasks: [], isRecurring: false, recurrenceRule: null, parentTaskId: null, goalId: null,
            xpReward: taskXp("media"), order: d.tasks.reduce((m, t) => Math.max(m, t.order), 0) + 1,
            createdBy: userId, createdAt: nowIso, completedAt: null,
          };
          promotedId = task.id;
          next = { ...next, tasks: [...next.tasks, task] };
        } else if (destination === "goal") {
          const goal: Goal = {
            id: uid("g"), title: form.title.trim(), description: idea.content, type: "financeira",
            targetAmount: form.targetAmount, currentAmount: 0, deadline: form.date, category: "outros",
            linkedModule: null, xpReward: XP.financialGoal, status: "em_andamento",
            createdBy: userId, createdAt: nowIso, completedAt: null,
          };
          promotedId = goal.id;
          next = { ...next, goals: [...next.goals, goal] };
        } else {
          const note: Note = {
            id: newUUID(), title: form.title.trim(), content: idea.content, color: "purple",
            isPinned: false, isShared: false, ownerId: userId, createdAt: nowIso, updatedAt: nowIso,
          };
          promotedId = note.id;
          next = { ...next, notes: [...next.notes, note] };
        }
        return {
          ...next,
          financialIdeas: next.financialIdeas.map((i) =>
            i.id === idea.id ? { ...i, promotedTo: destination, promotedId } : i,
          ),
        };
      });
    },
    [userId, me],
  );

  /* ---- future: savings rate, projections, patrimony ------------------------- */

  /** Average (income − expense) over the last 3 full months — shared + my personal entries. */
  const avgMonthlySavings = useMemo(() => {
    const now = new Date();
    let total = 0;
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = monthKey(d.getFullYear(), d.getMonth() + 1);
      for (const f of data.finances) {
        if (f.date.slice(0, 7) !== k) continue;
        if (f.owner != null && f.owner !== me) continue;
        total += f.type === "income" ? f.amount : -f.amount;
      }
    }
    return Math.round(total / 3);
  }, [data.finances, me]);

  const goalProjections = useMemo(
    () =>
      financialGoals
        .filter((g) => g.targetAmount > 0)
        .map((g) => projectGoal(g, avgMonthlySavings))
        .sort((a, b) => b.goal.targetAmount - a.goal.targetAmount),
    [financialGoals, avgMonthlySavings],
  );

  /** Live patrimônio: investments + goals not already backed by an investment. */
  const livePatrimony = useMemo(() => {
    const backed = new Set(investments.map((i) => i.goalId).filter(Boolean));
    const inv = investments.reduce((s, i) => s + i.currentValue, 0);
    const goals = financialGoals.filter((g) => !backed.has(g.id)).reduce((s, g) => s + g.currentAmount, 0);
    return Math.round(inv + goals);
  }, [investments, financialGoals]);

  /** One point per month the user had a plan (with a recorded patrimônio), last 12. */
  const patrimonyHistory = useMemo(() => {
    const now = new Date();
    const out: { month: number; year: number; total: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const p = data.monthlyPlans.find((pl) => pl.userId === userId && pl.month === m && pl.year === y);
      if (i === 0) out.push({ month: m, year: y, total: livePatrimony });
      else if (p?.patrimonyTotal != null) out.push({ month: m, year: y, total: p.patrimonyTotal });
    }
    return out;
  }, [data.monthlyPlans, userId, livePatrimony]);

  /* ---- dreams (per-user cards; linked ones mirror a financial goal live) ---- */
  const dreams = useMemo(
    () =>
      data.dreams
        .filter((d) => d.userId === userId)
        .sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt.localeCompare(b.createdAt)),
    [data.dreams, userId],
  );

  const resolvedDreams = useMemo<ResolvedDream[]>(
    () =>
      dreams.map((dream) => {
        const linkedGoal = dream.linkedGoalId ? financialGoals.find((g) => g.id === dream.linkedGoalId) ?? null : null;
        const target = linkedGoal ? linkedGoal.targetAmount : dream.targetAmount;
        const current = linkedGoal ? linkedGoal.currentAmount : dream.currentAmount;
        return { dream, target, current, linkedGoal, projection: projectAmounts(target, current, avgMonthlySavings) };
      }),
    [dreams, financialGoals, avgMonthlySavings],
  );

  const saveDream = useCallback(
    (form: DreamFormData, id?: string) => {
      if (!userId) return;
      const fields = {
        name: form.name.trim(),
        emoji: form.emoji || "⭐",
        targetAmount: form.targetAmount,
        currentAmount: form.currentAmount,
        linkedGoalId: form.linkedGoalId,
        color: form.color,
        notes: form.notes.trim() || undefined,
      };
      updateData((d) => {
        if (id) return { ...d, dreams: d.dreams.map((x) => (x.id === id ? { ...x, ...fields } : x)) };
        const order = d.dreams.filter((x) => x.userId === userId).reduce((m, x) => Math.max(m, x.displayOrder), -1) + 1;
        const dream: Dream = { id: uid("dream"), userId, displayOrder: order, createdAt: new Date().toISOString(), ...fields };
        return { ...d, dreams: [...d.dreams, dream] };
      });
    },
    [userId],
  );

  const deleteDream = useCallback((id: string) => {
    updateData((d) => ({ ...d, dreams: d.dreams.filter((x) => x.id !== id) }));
  }, []);

  /** Inline "valor atual" edit — only meaningful for unlinked dreams. */
  const setDreamCurrent = useCallback((id: string, value: number) => {
    updateData((d) => ({ ...d, dreams: d.dreams.map((x) => (x.id === id ? { ...x, currentAmount: value } : x)) }));
  }, []);

  /** Persist a new order (ids in display order). */
  const reorderDreams = useCallback((orderedIds: string[]) => {
    const pos = new Map(orderedIds.map((id, i) => [id, i]));
    updateData((d) => ({
      ...d,
      dreams: d.dreams.map((x) => (pos.has(x.id) && x.displayOrder !== pos.get(x.id) ? { ...x, displayOrder: pos.get(x.id)! } : x)),
    }));
  }, []);

  /**
   * One-time migration from the old goal-based cards: if this user has no
   * dreams yet, create one (linked) per open financial goal. Waits for
   * hydration so it never seeds from an empty pre-load state.
   */
  const seedDreamsFromGoals = useCallback(() => {
    if (!userId || typeof window === "undefined" || !getHydrated()) return;
    const flag = `flowtask_dreams_seed_v1_${userId}`;
    if (window.localStorage.getItem(flag)) return;
    if (dreams.length > 0) {
      window.localStorage.setItem(flag, "1");
      return;
    }
    const open = financialGoals.filter((g) => g.status !== "concluida" && g.targetAmount > 0);
    if (open.length === 0) return; // nothing to migrate yet — try again on a later visit
    window.localStorage.setItem(flag, "1");
    const palette: DreamColor[] = ["roxo", "cyan", "verde", "dourado"];
    const nowIso = new Date().toISOString();
    updateData((d) => ({
      ...d,
      dreams: [
        ...d.dreams,
        ...open.map((g, i) => ({
          id: uid("dream"), userId, name: g.title, emoji: dreamEmoji(g), targetAmount: g.targetAmount,
          currentAmount: g.currentAmount, linkedGoalId: g.id, color: palette[i % palette.length],
          displayOrder: i, createdAt: nowIso,
        })),
      ],
    }));
  }, [userId, dreams.length, financialGoals]);

  return {
    me,
    plan,
    items,
    ideas,
    distribution,
    itemStatus,
    // options to link items to
    debts: debts.filter((d) => d.status === "ativa"),
    financialGoals: financialGoals.filter((g) => g.status !== "concluida"),
    investments: investments.filter((i) => !i.isPlaceholder),
    // plan
    createPlan,
    updatePlan,
    copyPreviousItems,
    // items
    addItem,
    updateItem,
    deleteItem,
    markPaid,
    canUndo,
    undoPaid,
    // ideas
    addIdea,
    deleteIdea,
    promoteIdea,
    // future
    avgMonthlySavings,
    goalProjections,
    livePatrimony,
    patrimonyHistory,
    // dreams
    resolvedDreams,
    allFinancialGoals: financialGoals,
    saveDream,
    deleteDream,
    setDreamCurrent,
    reorderDreams,
    seedDreamsFromGoals,
  };
}
