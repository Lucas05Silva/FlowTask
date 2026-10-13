"use client";

import { useEffect, useMemo, useState } from "react";
import { HelpCircle, FileCheck, DollarSign, MapPin, GraduationCap, Calendar } from "lucide-react";
import { useCanada } from "@/hooks/useCanada";
import { useGoals } from "@/hooks/useGoals";
import { useInvestments } from "@/hooks/useInvestments";
import { useData } from "@/hooks/useData";
import { useGamification } from "@/components/providers/GamificationProvider";
import { CANADA_GOAL_LINKED_MODULE, RESERVE_ESTIMATE_TOTAL } from "@/lib/canada-data";
import { pct, cn } from "@/lib/utils";
import { CanadaStatusPanel } from "./CanadaStatusPanel";
import { CanadaDecisions } from "./CanadaDecisions";
import { CanadaDocuments } from "./CanadaDocuments";
import { CanadaFinanceiro } from "./CanadaFinanceiro";
import { CanadaLogistica } from "./CanadaLogistica";
import { CanadaEstudos } from "./CanadaEstudos";
import { CanadaTimeline } from "./CanadaTimeline";

type TabKey = "decisoes" | "documentos" | "financeiro" | "logistica" | "estudos" | "timeline";

const TABS: { key: TabKey; label: string; icon: typeof HelpCircle }[] = [
  { key: "decisoes", label: "Decisões", icon: HelpCircle },
  { key: "documentos", label: "Documentos", icon: FileCheck },
  { key: "financeiro", label: "Financeiro", icon: DollarSign },
  { key: "logistica", label: "Logística", icon: MapPin },
  { key: "estudos", label: "Estudos", icon: GraduationCap },
  { key: "timeline", label: "Timeline", icon: Calendar },
];

export function CanadaPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("decisoes");
  const { celebrate } = useGamification();
  const data = useData();

  const canada = useCanada();
  const { goals, createGoal, updateProgress } = useGoals();
  const { investments } = useInvestments();

  useEffect(() => {
    canada.seedIfEmpty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canadaGoal = goals.find((g) => g.linkedModule === CANADA_GOAL_LINKED_MODULE);
  useEffect(() => {
    if (canadaGoal) return;
    createGoal({
      title: "Reserva Canadá",
      description: "Reserva financeira para passagens, depósito, visto e primeiros meses no Canadá.",
      type: "financeira",
      targetAmount: RESERVE_ESTIMATE_TOTAL,
      currentAmount: 0,
      deadline: null,
      category: "canada",
      linkedModule: CANADA_GOAL_LINKED_MODULE,
      xpReward: 150,
      contributionType: "value",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canadaGoal]);

  const current = canadaGoal?.currentAmount ?? 0;
  const target = canadaGoal?.targetAmount ?? RESERVE_ESTIMATE_TOTAL;
  const financialPct = pct(current, target);

  const netMonthly = useMemo(() => {
    const now = new Date();
    let income = 0;
    let expense = 0;
    let months = 0;
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthIncome = data.finances.filter((f) => f.type === "income" && f.date.slice(0, 7) === key).reduce((s, f) => s + f.amount, 0);
      const monthExpense = data.finances.filter((f) => f.type === "expense" && f.date.slice(0, 7) === key).reduce((s, f) => s + f.amount, 0);
      if (monthIncome > 0 || monthExpense > 0) {
        income += monthIncome;
        expense += monthExpense;
        months++;
      }
    }
    return months > 0 ? (income - expense) / months : 0;
  }, [data.finances]);

  const exteriorInvestments = investments.filter((i) => i.type === "exterior" && !i.isPlaceholder);
  const exteriorTotal = exteriorInvestments.reduce((s, i) => s + i.currentValue, 0);

  function handleUpdateGoalValue(value: number) {
    if (!canadaGoal) return;
    const res = updateProgress(canadaGoal.id, value);
    if (res) celebrate(res, { big: !!res.completedGoal });
  }

  function handleAnswer(id: string, answer: string) {
    const res = canada.answerDecision(id, answer);
    if (res) celebrate(res);
  }

  function handleSetDocumentStatus(id: string, status: Parameters<typeof canada.setDocumentStatus>[1]) {
    const res = canada.setDocumentStatus(id, status);
    if (res) celebrate(res);
  }

  function handleToggleChecklist(id: string) {
    const res = canada.toggleChecklistItem(id);
    if (res) celebrate(res);
  }

  function handleChooseCity(id: string) {
    const res = canada.chooseCity(id);
    if (res) celebrate(res, { big: true });
  }

  const progress = canada.getProgress();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <CanadaStatusPanel
        progress={progress}
        financial={{ current, target }}
        targetDepartureDate={canada.targetDepartureDate}
      />

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-line scrollbar-none">
        <div className="flex min-w-max space-x-6 pb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative flex items-center gap-1.5 border-b-2 py-3.5 text-sm font-semibold transition-all hover:text-content",
                  activeTab === tab.key ? "border-brand text-brand-dark" : "border-transparent text-muted",
                )}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2">
        {activeTab === "decisoes" && (
          <CanadaDecisions decisions={canada.decisions} onAnswer={handleAnswer} onSetStatus={canada.setDecisionStatus} />
        )}
        {activeTab === "documentos" && (
          <CanadaDocuments
            documents={canada.documents}
            onSetStatus={handleSetDocumentStatus}
            onAdd={canada.addDocument}
            onDelete={canada.deleteDocument}
          />
        )}
        {activeTab === "financeiro" && (
          <CanadaFinanceiro
            current={current}
            target={target}
            netMonthly={netMonthly}
            exteriorTotal={exteriorTotal}
            hasExteriorInvestment={exteriorInvestments.length > 0}
            onUpdateCurrent={handleUpdateGoalValue}
          />
        )}
        {activeTab === "logistica" && (
          <CanadaLogistica
            cities={canada.cities}
            checklist={canada.checklist}
            onAddCityPoint={canada.addCityPoint}
            onRemoveCityPoint={canada.removeCityPoint}
            onToggleFavoriteCity={canada.toggleFavoriteCity}
            onChooseCity={handleChooseCity}
            onToggleChecklist={handleToggleChecklist}
          />
        )}
        {activeTab === "estudos" && (
          <CanadaEstudos
            notes={canada.notes}
            checklist={canada.checklist}
            onAddNote={canada.addNote}
            onUpdateNote={canada.updateNote}
            onDeleteNote={canada.deleteNote}
            onToggleChecklist={handleToggleChecklist}
          />
        )}
        {activeTab === "timeline" && (
          <CanadaTimeline
            targetDepartureDate={canada.targetDepartureDate}
            progress={progress}
            financialPct={financialPct}
            decisions={canada.decisions}
          />
        )}
      </div>
    </div>
  );
}
