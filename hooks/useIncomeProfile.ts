"use client";

import { useCallback, useMemo } from "react";
import type {
  IncomeProfile,
  IncomeSource,
  IncomeHistoryEntry,
  Achievement,
  FlowTaskData,
} from "@/types";
import { updateData } from "@/lib/data/store";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/components/providers/AuthProvider";
import { levelFromXp, XP, type CelebrationResult } from "@/lib/gamification";
import { uid, todayISO } from "@/lib/utils";
import { KNOWN_USERS } from "@/lib/data/initialState";

export const LUCAS_ID = KNOWN_USERS[0].id;

/** Default (real) income profile for Lucas — July 2026. */
function defaultSources(): IncomeSource[] {
  return [
    { id: "emprego-novo", label: "Novo emprego", type: "fixo", amount: 1900, active: true, note: "Salário principal" },
    { id: "flowsys", label: "Flowsys (2 clientes)", type: "fixo", amount: 900, active: true, note: "10% vai direto para investimento" },
    { id: "estagio-horas", label: "Estágio por horas", type: "variavel", amount: 0, active: true, note: "Bônus — 100% vai para investimento" },
  ];
}

export interface IncomeProfileFormData {
  sources: IncomeSource[];
  monthlyExpenses: number;
  investmentGoalPct: number;
  flowsysInvestmentPct: number;
}

export function useIncomeProfile() {
  const data = useData();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const profile = useMemo<IncomeProfile | null>(
    () => (data.incomeProfiles || []).find((p) => p.userId === userId) ?? null,
    [data.incomeProfiles, userId],
  );

  const history = useMemo<IncomeHistoryEntry[]>(
    () =>
      (data.incomeHistory || [])
        .filter((h) => h.userId === userId)
        .sort((a, b) => b.month.localeCompare(a.month) || b.createdAt.localeCompare(a.createdAt)),
    [data.incomeHistory, userId],
  );

  /* ---- derived income figures --------------------------------------------- */
  const sources = useMemo<IncomeSource[]>(() => profile?.sources ?? [], [profile]);
  const monthlyExpenses = profile?.monthlyExpenses ?? 0;
  const investmentGoalPct = profile?.investmentGoalPct ?? 0;
  const flowsysInvestmentPct = profile?.flowsysInvestmentPct ?? 0;

  const getFixedIncome = useCallback(
    () => sources.filter((s) => s.type === "fixo" && s.active).reduce((sum, s) => sum + s.amount, 0),
    [sources],
  );
  const getVariableIncome = useCallback(
    () => sources.filter((s) => s.type === "variavel" && s.active).reduce((sum, s) => sum + s.amount, 0),
    [sources],
  );
  const getBenefitIncome = useCallback(
    () => sources.filter((s) => s.type === "beneficio" && s.active).reduce((sum, s) => sum + s.amount, 0),
    [sources],
  );
  const getTotalIncome = useCallback(
    () => getFixedIncome() + getVariableIncome() + getBenefitIncome(),
    [getFixedIncome, getVariableIncome, getBenefitIncome],
  );
  const getFlowsysContribution = useCallback(() => {
    const flowsys = sources.find((s) => s.id === "flowsys" && s.active);
    return flowsys ? Math.round((flowsys.amount * flowsysInvestmentPct) / 100) : 0;
  }, [sources, flowsysInvestmentPct]);
  const getMonthlyInvestment = useCallback(
    () => Math.round((getFixedIncome() * investmentGoalPct) / 100),
    [getFixedIncome, investmentGoalPct],
  );
  const getTotalInvestment = useCallback(
    () => getMonthlyInvestment() + getFlowsysContribution(),
    [getMonthlyInvestment, getFlowsysContribution],
  );
  const getSurplus = useCallback(
    () => getFixedIncome() - monthlyExpenses - getTotalInvestment(),
    [getFixedIncome, monthlyExpenses, getTotalInvestment],
  );

  /* ---- gamification helper (mirror of useFinance.rewardUser) -------------- */
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
        },
      };
    },
    [userId],
  );

  /* ---- seed (Lucas, once) -------------------------------------------------- */
  const seedIfEmpty = useCallback(() => {
    if (!userId || userId !== LUCAS_ID) return;
    if (typeof window === "undefined") return;
    const flagKey = `flowtask_income_seed_${userId}`;
    if (window.localStorage.getItem(flagKey)) return;
    window.localStorage.setItem(flagKey, "1");

    updateData((d) => {
      if ((d.incomeProfiles || []).some((p) => p.userId === userId)) return d;
      const nowIso = new Date().toISOString();
      const newProfile: IncomeProfile = {
        id: userId,
        userId,
        sources: defaultSources(),
        monthlyExpenses: 1200,
        investmentGoalPct: 20,
        flowsysInvestmentPct: 10,
        updatedAt: nowIso,
      };
      const seedHistory: IncomeHistoryEntry[] = [
        { id: uid("ih"), userId, month: "2026-06", totalFixed: 2100, totalVariable: 0, note: "Estágio R$ 1.200 + Flowsys R$ 900", createdAt: nowIso },
        { id: uid("ih"), userId, month: "2026-07", totalFixed: 2800, totalVariable: 0, note: "Novo emprego R$ 1.900 + Flowsys R$ 900", createdAt: nowIso },
      ];
      const existingMonths = new Set(
        (d.incomeHistory || []).filter((h) => h.userId === userId).map((h) => h.month),
      );
      const toAdd = seedHistory.filter((h) => !existingMonths.has(h.month));
      return {
        ...d,
        incomeProfiles: [...d.incomeProfiles, newProfile],
        incomeHistory: [...d.incomeHistory, ...toAdd],
      };
    });
  }, [userId]);

  /* ---- save (upsert profile + history entry + gamification) --------------- */
  const saveProfile = useCallback(
    (form: IncomeProfileFormData): CelebrationResult | null => {
      if (!userId) return null;
      let celebration: CelebrationResult | null = null;

      updateData((d) => {
        const nowIso = new Date().toISOString();
        const nextProfile: IncomeProfile = {
          id: userId,
          userId,
          sources: form.sources,
          monthlyExpenses: form.monthlyExpenses,
          investmentGoalPct: form.investmentGoalPct,
          flowsysInvestmentPct: form.flowsysInvestmentPct,
          updatedAt: nowIso,
        };
        const others = d.incomeProfiles.filter((p) => p.userId !== userId);

        const totalFixed = form.sources
          .filter((s) => s.type === "fixo" && s.active)
          .reduce((sum, s) => sum + s.amount, 0);
        const totalVariable = form.sources
          .filter((s) => s.type === "variavel" && s.active)
          .reduce((sum, s) => sum + s.amount, 0);

        // Record this month in the history (replace an existing same-month entry).
        const month = todayISO().slice(0, 7);
        const historyWithoutMonth = d.incomeHistory.filter(
          (h) => !(h.userId === userId && h.month === month),
        );
        const newEntry: IncomeHistoryEntry = {
          id: uid("ih"),
          userId,
          month,
          totalFixed,
          totalVariable,
          note: `Renda fixa R$ ${totalFixed.toLocaleString("pt-BR")} + variável R$ ${totalVariable.toLocaleString("pt-BR")}`,
          createdAt: nowIso,
        };

        let next: FlowTaskData = {
          ...d,
          incomeProfiles: [...others, nextProfile],
          incomeHistory: [...historyWithoutMonth, newEntry],
        };

        // "Plano traçado": all sources labelled + an investment goal defined.
        const planReady =
          form.sources.length > 0 &&
          form.sources.every((s) => s.label.trim().length > 0) &&
          form.investmentGoalPct > 0;
        const manualAch = planReady ? ["ach_income_plan"] : [];

        // +25 XP the first time the profile is edited by the user.
        const editedFlag = `flowtask_income_edited_${userId}`;
        const firstEdit = typeof window !== "undefined" && !window.localStorage.getItem(editedFlag);
        if (firstEdit) window.localStorage.setItem(editedFlag, "1");
        const baseXp = firstEdit ? XP.incomeProfileUpdate : 0;

        const { nextData, result } = rewardUser(next, baseXp, manualAch);
        next = nextData;
        celebration = result;
        return next;
      });

      return celebration;
    },
    [userId, rewardUser],
  );

  return {
    profile,
    history,
    sources,
    monthlyExpenses,
    investmentGoalPct,
    flowsysInvestmentPct,
    isLucas: userId === LUCAS_ID,
    getFixedIncome,
    getVariableIncome,
    getBenefitIncome,
    getTotalIncome,
    getFlowsysContribution,
    getMonthlyInvestment,
    getTotalInvestment,
    getSurplus,
    seedIfEmpty,
    saveProfile,
  };
}
