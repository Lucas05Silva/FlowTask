"use client";

import { useState, useMemo } from "react";
import { Heart, Calendar, DollarSign, Users, Award, Bell } from "lucide-react";
import { useWedding } from "@/hooks/useWedding";
import { useGamification } from "@/components/providers/GamificationProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GoalProgress } from "../goals/GoalProgress";
import { WeddingDatePicker } from "./WeddingDatePicker";
import { WeddingTaskModal } from "./WeddingTaskModal";
import { WeddingVendorModal } from "./WeddingVendorModal";
import { WeddingChecklist } from "./WeddingChecklist";
import { WeddingBudget } from "./WeddingBudget";
import { WeddingVendors } from "./WeddingVendors";
import { WeddingTimeline } from "./WeddingTimeline";
import { formatBRL } from "@/lib/utils";
import { cn } from "@/lib/utils";

type TabKey = "checklist" | "orcamento" | "fornecedores" | "cronograma";

export function WeddingPage() {
  const { celebrate } = useGamification();
  const {
    tasks,
    budget,
    vendors,
    weddingDate,
    weddingVenueName,
    weddingVenueAddress,
    updateWeddingConfig,
    createWeddingTask,
    updateWeddingTask,
    deleteWeddingTask,
    createWeddingBudgetCategory,
    updateWeddingBudgetCategory,
    deleteWeddingBudgetCategory,
    createWeddingVendor,
    updateWeddingVendor,
    deleteWeddingVendor,
    getChecklistProgress,
    getBudgetTotals,
    getDaysUntilWedding,
    getTimelineItems,
  } = useWedding();

  const [activeTab, setActiveTab] = useState<TabKey>("checklist");

  // Modals state
  const [dateModalOpen, setDateModalOpen] = useState(false);
  
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  // Stats
  const checklistStats = getChecklistProgress();
  const budgetStats = getBudgetTotals();
  const daysRemaining = getDaysUntilWedding();
  const timelineItems = getTimelineItems();

  const contractedCount = useMemo(() => {
    return vendors.filter((v) => v.status === "contratado" || v.status === "pago").length;
  }, [vendors]);

  const totalVendors = vendors.length;

  const countdownText = useMemo(() => {
    if (daysRemaining === null) return null;
    if (daysRemaining === 0) return "É HOJE! O Grande Dia chegou! 💒💕💍";
    if (daysRemaining === 1) return "É AMANHÃ! O coração está a mil! 💒💍";
    if (daysRemaining < 0) {
      const days = Math.abs(daysRemaining);
      return `Casados há ${days} ${days === 1 ? "dia" : "dias"}! 💕💍`;
    }
    return `Faltam ${daysRemaining} dias para o grande dia! 💒✨`;
  }, [daysRemaining]);

  const handleOpenTaskEdit = (task: any) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const handleOpenTaskCreate = () => {
    setSelectedTask(null);
    setTaskModalOpen(true);
  };

  const handleOpenVendorEdit = (vendor: any) => {
    setSelectedVendor(vendor);
    setVendorModalOpen(true);
  };

  const handleOpenVendorCreate = () => {
    setSelectedVendor(null);
    setVendorModalOpen(true);
  };

  const handleTimelineItemClick = (id: string, type: "task" | "wedding_day") => {
    if (type === "task") {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        handleOpenTaskEdit(task);
      }
    } else {
      setDateModalOpen(true);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Wedding Banner Countdown Header */}
      <div className="relative overflow-hidden rounded-card border border-pink-100/25 bg-gradient-to-r from-pink-500/10 via-pink-400/5 to-purple-500/10 p-5 md:p-6 shadow-soft">
        <div className="absolute right-4 top-4 text-pink-500/10 hover:text-pink-500/20 pointer-events-none transition-colors hidden sm:block">
          <Heart className="size-48 stroke-[1px] fill-current" />
        </div>

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-pink-500">
              <Heart className="size-5 fill-current" />
              <h2 className="text-xl font-black tracking-tight sm:text-2xl text-content">Planejamento do Casamento</h2>
            </div>
            {countdownText ? (
              <p className="text-sm font-extrabold text-pink-600 dark:text-pink-400 bg-pink-500/5 border border-pink-500/10 px-3 py-1 rounded-full self-start inline-block">
                {countdownText}
              </p>
            ) : (
              <p className="text-xs text-muted leading-relaxed">
                Agende a data para ativar o cronômetro romântico da contagem regressiva.
              </p>
            )}

            {weddingVenueName && (
              <p className="text-xs text-muted font-medium mt-1">
                📍 {weddingVenueName} {weddingVenueAddress ? `— ${weddingVenueAddress}` : ""}
              </p>
            )}
          </div>

          <Button
            onClick={() => setDateModalOpen(true)}
            size="sm"
            className="bg-white hover:bg-pink-50 text-pink-500 border border-pink-200 shadow-sm shrink-0 self-start sm:self-auto font-bold"
          >
            {weddingDate ? "Alterar Data / Local" : "Definir Data"}
          </Button>
        </div>
      </div>

      {/* Stats Summary Panel (3 cards) */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Tarefas Concluídas */}
        <Card className="border-pink-100/20 bg-surface flex flex-col justify-between p-4">
          <div className="flex items-center justify-between text-xs font-bold text-muted">
            <span>Tarefas do Checklist</span>
            <span>{checklistStats.completed}/{checklistStats.total} ({checklistStats.percentage}%)</span>
          </div>
          <div className="mt-3.5 space-y-2">
            <h3 className="text-xl font-black text-content">Progresso das Tarefas</h3>
            <GoalProgress current={checklistStats.completed} target={checklistStats.total} color="var(--cat-casamento)" />
          </div>
        </Card>

        {/* Orçamento total */}
        <Card className="border-pink-100/20 bg-surface flex flex-col justify-between p-4">
          <div className="flex items-center justify-between text-xs font-bold text-muted">
            <span>Orçamento Geral</span>
            <span>{budgetStats.estimated > 0 ? Math.round((budgetStats.actual / budgetStats.estimated) * 100) : 0}%</span>
          </div>
          <div className="mt-3.5 space-y-2">
            <h3 className="text-xl font-black text-content">
              {formatBRL(budgetStats.actual)} <span className="text-xs font-normal text-muted">de {formatBRL(budgetStats.estimated)}</span>
            </h3>
            <GoalProgress current={budgetStats.actual} target={budgetStats.estimated} color="var(--success)" />
          </div>
        </Card>

        {/* Fornecedores Contratados */}
        <Card className="border-pink-100/20 bg-surface flex flex-col justify-between p-4">
          <div className="flex items-center justify-between text-xs font-bold text-muted">
            <span>Fornecedores</span>
            <span>{contractedCount}/{totalVendors} contratados</span>
          </div>
          <div className="mt-3.5 space-y-2">
            <h3 className="text-xl font-black text-content">Contratos Fechados</h3>
            <GoalProgress current={contractedCount} target={totalVendors} color="var(--brand-purple)" />
          </div>
        </Card>
      </div>

      {/* Tab bar header */}
      <div className="flex border-b border-line/45 text-sm font-semibold select-none overflow-x-auto scrollbar-none">
        {(
          [
            { key: "checklist", label: "Checklist 💍" },
            { key: "orcamento", label: "Orçamento 💰" },
            { key: "fornecedores", label: "Fornecedores 🤝" },
            { key: "cronograma", label: "Cronograma ⏳" },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "pb-3 pt-1 px-4 border-b-2 transition-all shrink-0 capitalize whitespace-nowrap",
                active
                  ? "border-pink-500 text-pink-500 font-extrabold"
                  : "border-transparent text-muted hover:text-content"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Render active tab content */}
      <div className="min-h-[400px]">
        {activeTab === "checklist" && (
          <WeddingChecklist
            tasks={tasks}
            onTaskClick={handleOpenTaskEdit}
            onCreateClick={handleOpenTaskCreate}
            onUpdateStatus={(id, status) => updateWeddingTask(id, { status })}
          />
        )}
        {activeTab === "orcamento" && (
          <WeddingBudget
            budget={budget}
            onUpdateCategory={updateWeddingBudgetCategory}
            onCreateCategory={createWeddingBudgetCategory}
          />
        )}
        {activeTab === "fornecedores" && (
          <WeddingVendors
            vendors={vendors}
            onVendorClick={handleOpenVendorEdit}
            onCreateClick={handleOpenVendorCreate}
          />
        )}
        {activeTab === "cronograma" && (
          <WeddingTimeline items={timelineItems} onItemClick={handleTimelineItemClick} />
        )}
      </div>

      {/* Configuration modal overlays */}
      <WeddingDatePicker
        open={dateModalOpen}
        onClose={() => setDateModalOpen(false)}
        currentDate={weddingDate}
        currentVenue={weddingVenueName}
        currentAddress={weddingVenueAddress}
        onSave={updateWeddingConfig}
        onCelebrate={(res) => celebrate(res, { big: true })}
      />

      <WeddingTaskModal
        open={taskModalOpen}
        item={selectedTask}
        onClose={() => setTaskModalOpen(false)}
        onCreate={createWeddingTask}
        onUpdate={updateWeddingTask}
        onDelete={deleteWeddingTask}
        onCelebrate={(res) => celebrate(res, { big: false })}
      />

      <WeddingVendorModal
        open={vendorModalOpen}
        item={selectedVendor}
        onClose={() => setVendorModalOpen(false)}
        onCreate={createWeddingVendor}
        onUpdate={updateWeddingVendor}
        onDelete={deleteWeddingVendor}
        onCelebrate={(res) => celebrate(res, { big: true })}
      />
    </div>
  );
}
