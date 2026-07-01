"use client";

import { useState, useMemo } from "react";
import { Target, Search, Plus, Trophy } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";
import { useGamification } from "@/components/providers/GamificationProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { GoalCard } from "./GoalCard";
import { GoalMural } from "./GoalMural";
import { GoalModal } from "./GoalModal";
import { daysUntil, pct } from "@/lib/utils";
import { cn } from "@/lib/utils";

type FilterType = "todas" | "financeira" | "projeto" | "pessoal" | "apartamento" | "casamento";
type SortOption = "prazo" | "progresso" | "xp";
type TabOption = "active" | "completed";

export function GoalsPage() {
  const { celebrate } = useGamification();
  const {
    goals,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    updateProgress,
    toggleCheckItem,
  } = useGoals();

  const [activeTab, setActiveTab] = useState<TabOption>("active");
  const [selectedType, setSelectedType] = useState<FilterType>("todas");
  const [selectedSort, setSelectedSort] = useState<SortOption>("prazo");
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);

  const filterChips: { value: FilterType; label: string }[] = [
    { value: "todas", label: "Todas" },
    { value: "financeira", label: "Financeiras 💰" },
    { value: "projeto", label: "Projetos 💼" },
    { value: "pessoal", label: "Pessoais 👤" },
    { value: "apartamento", label: "Apartamento 🏠" },
    { value: "casamento", label: "Casamento 💖" },
  ];

  // Logic: split goals by status (active vs completed)
  const activeGoals = useMemo(() => goals.filter((g) => g.status !== "concluida"), [goals]);
  const completedGoals = useMemo(() => goals.filter((g) => g.status === "concluida"), [goals]);

  // Apply filters and sorting
  const processedActiveGoals = useMemo(() => {
    return activeGoals
      .filter((g) => selectedType === "todas" || g.type === selectedType)
      .filter((g) => !searchQuery || g.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (selectedSort === "prazo") {
          const daysA = a.deadline ? daysUntil(a.deadline) : Infinity;
          const daysB = b.deadline ? daysUntil(b.deadline) : Infinity;
          return daysA - daysB;
        }
        if (selectedSort === "progresso") {
          const pctA = pct(a.currentAmount, a.targetAmount);
          const pctB = pct(b.currentAmount, b.targetAmount);
          return pctB - pctA; // Highest progress first
        }
        if (selectedSort === "xp") {
          return b.xpReward - a.xpReward; // Highest XP first
        }
        return 0;
      });
  }, [activeGoals, selectedType, selectedSort, searchQuery]);

  const handleCreateClick = () => {
    setEditingGoal(null);
    setModalOpen(true);
  };

  const handleEditClick = (goal: any) => {
    setEditingGoal(goal);
    setModalOpen(true);
  };

  const handleCreate = (form: any) => {
    const res = createGoal(form);
    if (res) {
      celebrate(res, { big: true });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Metas" subtitle="Hub central para acompanhar as conquistas do casal em todas as áreas." />
        <Button
          onClick={handleCreateClick}
          size="sm"
          icon={Plus}
          className="bg-brand hover:bg-brand/90 self-start sm:self-auto"
        >
          Nova meta
        </Button>
      </div>

      {/* Tabs Controller (Active Goals vs Achievements Mural) */}
      <div className="border-b border-line flex items-center justify-between pb-px">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab("active")}
            className={cn(
              "relative py-3 text-sm font-semibold transition-all border-b-2 hover:text-content",
              activeTab === "active"
                ? "border-brand text-brand-dark"
                : "border-transparent text-muted"
            )}
          >
            Em Andamento
            {activeGoals.length > 0 && (
              <span className="ml-1.5 rounded-full bg-brand/10 text-brand text-[10px] px-1.5 py-0.5 font-bold">
                {activeGoals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={cn(
              "relative py-3 text-sm font-semibold transition-all border-b-2 hover:text-content",
              activeTab === "completed"
                ? "border-brand text-brand-dark"
                : "border-transparent text-muted"
            )}
          >
            Concluídas (Mural)
            {completedGoals.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] px-1.5 py-0.5 font-bold">
                {completedGoals.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter and sorting toolbar (only visible on Active tab) */}
      {activeTab === "active" && (
        <div className="space-y-4">
          <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar meta..."
                className="pl-9"
              />
            </div>

            {/* Sort order select */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-muted whitespace-nowrap">Ordenar por:</span>
              <Select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as SortOption)}
                className="w-40 h-10 py-1"
              >
                <option value="prazo">Prazo (Próximo)</option>
                <option value="progresso">Progresso (%)</option>
                <option value="xp">XP Recompensa</option>
              </Select>
            </div>
          </Card>

          {/* Type filters chips layout */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {filterChips.map((chip) => (
              <button
                key={chip.value}
                onClick={() => setSelectedType(chip.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full border text-xs font-bold transition-all whitespace-nowrap",
                  selectedType === chip.value
                    ? "bg-brand/10 border-brand text-brand-dark shadow-sm"
                    : "bg-surface border-line text-muted hover:border-muted/30 hover:text-content"
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main rendering area */}
      <div className="mt-4">
        {activeTab === "active" ? (
          processedActiveGoals.length === 0 ? (
            <EmptyState
              icon={Target}
              title="Nenhuma meta definida ainda"
              description={
                searchQuery
                  ? "Nenhuma meta atende aos filtros de pesquisa selecionados."
                  : "Defina sua primeira meta e acompanhe cada conquista 🎯"
              }
              action={
                !searchQuery && (
                  <Button size="sm" icon={Plus} onClick={handleCreateClick}>
                    Criar primeira meta
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {processedActiveGoals.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  onEditClick={handleEditClick}
                  onUpdateProgress={updateProgress}
                  onToggleCheckItem={toggleCheckItem}
                  onComplete={completeGoal}
                  onCelebrate={(res) => celebrate(res, { big: true })}
                />
              ))}
            </div>
          )
        ) : (
          <GoalMural completedGoals={completedGoals} />
        )}
      </div>

      {/* Modal trigger */}
      <GoalModal
        open={modalOpen}
        goal={editingGoal}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
        onUpdate={updateGoal}
        onDelete={deleteGoal}
      />
    </div>
  );
}
