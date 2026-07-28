"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Landmark,
  Wallet,
  Coins,
} from "lucide-react";
import type { Investment } from "@/types";
import { useInvestments } from "@/hooks/useInvestments";
import { useGamification } from "@/components/providers/GamificationProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmergencyFundBanner } from "./EmergencyFundBanner";
import { InvestmentOverview } from "./InvestmentOverview";
import { InvestmentList } from "./InvestmentList";
import { ContributionsTimeline } from "./ContributionsTimeline";
import { ProjectionTab } from "./ProjectionTab";
import { InvestmentModal } from "./InvestmentModal";
import { ContributionModal } from "./ContributionModal";
import { formatBRL, cn } from "@/lib/utils";

type TabKey = "overview" | "investments" | "contributions" | "projection";

const DISCLAIMER =
  "Os valores exibidos são estimativas baseadas em taxas de referência de mercado. Rentabilidade passada não garante resultados futuros. Este módulo é apenas informativo e não constitui recomendação de investimento.";

export function InvestmentsPage() {
  const { user } = useAuth();
  const { celebrate } = useGamification();
  const {
    investments,
    contributions,
    snapshots,
    goals,
    monthlyExpenseEstimate,
    getTotalInvested,
    getTotalCurrentValue,
    getTotalReturn,
    getTotalReturnPercent,
    getEmergencyFundTotal,
    getMonthlyPassiveIncome,
    getPortfolioAverageRate,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    addContribution,
    deleteContribution,
    saveMonthlySnapshot,
    seedIfEmpty,
  } = useInvestments();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [emergencyFilter, setEmergencyFilter] = useState(false);

  const [investmentModalOpen, setInvestmentModalOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  const [contributionModalOpen, setContributionModalOpen] = useState(false);
  const [contributionTarget, setContributionTarget] = useState<Investment | null>(null);

  const [manualMonthly, setManualMonthly] = useState(0);

  // Seed (Lucas first access) + monthly snapshot.
  useEffect(() => {
    seedIfEmpty();
  }, [seedIfEmpty]);
  useEffect(() => {
    saveMonthlySnapshot();
  }, [saveMonthlySnapshot]);

  // Persist the manual monthly-expense fallback per user.
  useEffect(() => {
    if (!user) return;
    const stored = window.localStorage.getItem(`flowtask_reserve_monthly_${user.id}`);
    if (stored) setManualMonthly(parseFloat(stored) || 0);
  }, [user]);
  useEffect(() => {
    if (!user) return;
    window.localStorage.setItem(`flowtask_reserve_monthly_${user.id}`, String(manualMonthly));
  }, [manualMonthly, user]);

  const totalInvested = getTotalInvested();
  const totalCurrent = getTotalCurrentValue();
  const totalReturn = getTotalReturn();
  const returnPct = getTotalReturnPercent();
  const emergencyTotal = getEmergencyFundTotal();
  const passiveIncome = getMonthlyPassiveIncome();
  const avgRate = getPortfolioAverageRate();

  const reserveMonthly = monthlyExpenseEstimate > 0 ? monthlyExpenseEstimate : manualMonthly;
  const reserveTarget = reserveMonthly * 4;

  const kpis = useMemo(
    () => [
      {
        label: "Patrimônio Total",
        value: formatBRL(totalCurrent),
        hint: "Valor atual de todos os investimentos",
        icon: Landmark,
        color: "var(--brand-purple)",
      },
      {
        label: "Total Aportado",
        value: formatBRL(totalInvested),
        hint: "Soma de todos os aportes",
        icon: Wallet,
        color: "var(--cyan-dark)",
      },
      {
        label: "Rendimento",
        value: `${totalReturn >= 0 ? "+" : ""}${formatBRL(totalReturn)}`,
        hint: `${totalReturn >= 0 ? "+" : ""}${returnPct.toFixed(1)}% sobre o aportado`,
        icon: totalReturn >= 0 ? TrendingUp : TrendingDown,
        color: totalReturn >= 0 ? "var(--success)" : "var(--danger)",
        valueColor: totalReturn >= 0 ? "text-success" : "text-danger",
      },
      {
        label: "Renda Passiva Est.",
        value: `${formatBRL(passiveIncome)}/mês`,
        hint: "Regra dos 4% ao ano",
        icon: Coins,
        color: "var(--cat-financeiro)",
      },
    ],
    [totalCurrent, totalInvested, totalReturn, returnPct, passiveIncome],
  );

  const tabs = [
    { key: "overview", label: "Visão Geral" },
    { key: "investments", label: "Meus Investimentos" },
    { key: "contributions", label: "Aportes" },
    { key: "projection", label: "Projeção" },
  ] as const;

  const openCreate = () => {
    setSelectedInvestment(null);
    setInvestmentModalOpen(true);
  };
  const openEdit = (inv: Investment) => {
    setSelectedInvestment(inv);
    setInvestmentModalOpen(true);
  };
  const openContribution = (inv: Investment | null) => {
    setContributionTarget(inv);
    setContributionModalOpen(true);
  };

  const handleCreate = (form: Parameters<typeof createInvestment>[0]) => {
    const res = createInvestment(form);
    if (res) celebrate(res, { big: !!res.completedGoal });
  };
  const handleContribution = (investmentId: string, form: Parameters<typeof addContribution>[1]) => {
    const res = addContribution(investmentId, form);
    if (res) celebrate(res, { big: !!res.completedGoal });
  };

  const goToEmergency = () => {
    const next = !emergencyFilter;
    setEmergencyFilter(next);
    if (next) setActiveTab("investments");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Investimentos"
          subtitle="Seu patrimônio pessoal e evolução financeira."
        />
        <Button icon={Plus} onClick={openCreate} className="self-start">
          Novo Investimento
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted sm:text-sm">{k.label}</span>
                <span
                  className="grid size-8 place-items-center rounded-full"
                  style={{ backgroundColor: `color-mix(in srgb, ${k.color} 16%, transparent)`, color: k.color }}
                >
                  <Icon className="size-4" />
                </span>
              </div>
              <p className={cn("text-lg font-bold sm:text-2xl", k.valueColor ?? "text-content")}>{k.value}</p>
              <p className="text-[11px] text-muted">{k.hint}</p>
            </Card>
          );
        })}
      </div>

      {/* Emergency fund banner */}
      <EmergencyFundBanner
        total={emergencyTotal}
        target={reserveTarget}
        active={emergencyFilter}
        fromFinance={monthlyExpenseEstimate > 0}
        manualMonthly={manualMonthly}
        onManualMonthlyChange={setManualMonthly}
        onToggleFilter={goToEmergency}
      />

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-line scrollbar-none">
        <div className="flex min-w-max space-x-6 pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key !== "investments") setEmergencyFilter(false);
              }}
              className={cn(
                "relative border-b-2 py-3.5 text-sm font-semibold transition-all hover:text-content",
                activeTab === tab.key ? "border-brand text-brand-dark" : "border-transparent text-muted",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === "overview" && (
          <InvestmentOverview
            investments={investments}
            snapshots={snapshots}
            totalInvested={totalInvested}
            totalCurrent={totalCurrent}
          />
        )}
        {activeTab === "investments" && (
          <InvestmentList
            investments={investments}
            goals={goals}
            forceEmergencyFilter={emergencyFilter}
            onCreate={openCreate}
            onAddContribution={openContribution}
            onEdit={openEdit}
          />
        )}
        {activeTab === "contributions" && (
          <ContributionsTimeline
            contributions={contributions}
            investments={investments}
            onCreateAvulso={() => openContribution(null)}
            onDelete={deleteContribution}
          />
        )}
        {activeTab === "projection" && (
          <ProjectionTab currentValue={totalCurrent} suggestedRate={avgRate} />
        )}
      </div>

      {/* Disclaimer */}
      <p className="border-t border-line pt-4 text-[11px] leading-relaxed text-muted">{DISCLAIMER}</p>

      {/* Modals */}
      <InvestmentModal
        open={investmentModalOpen}
        investment={selectedInvestment}
        goals={goals}
        onClose={() => setInvestmentModalOpen(false)}
        onCreate={handleCreate}
        onUpdate={updateInvestment}
        onDelete={deleteInvestment}
      />
      <ContributionModal
        open={contributionModalOpen}
        investment={contributionTarget}
        investments={investments}
        onClose={() => setContributionModalOpen(false)}
        onSubmit={handleContribution}
      />
    </div>
  );
}
