"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Briefcase, User, Home, Heart, Calendar, Trophy, CheckSquare, Plus, Edit3, ArrowRight } from "lucide-react";
import type { Goal } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoalProgress } from "./GoalProgress";
import { formatBRL, pct, countdownLabel, daysUntil } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface GoalCardProps {
  goal: Goal;
  onEditClick: (goal: Goal) => void;
  onUpdateProgress: (id: string, value: number) => any;
  onToggleCheckItem: (goalId: string, itemId: string) => any;
  onComplete: (id: string) => any;
  onCelebrate: (result: any) => void;
}

const TYPE_META: Record<string, { label: string; color: string; icon: any }> = {
  financeira: { label: "Financeira", color: "var(--cat-financeiro)", icon: DollarSign },
  projeto: { label: "Projeto", color: "var(--cat-flowsys)", icon: Briefcase },
  pessoal: { label: "Pessoal", color: "var(--cat-pessoal)", icon: User },
  apartamento: { label: "Apartamento", color: "var(--cat-apartamento)", icon: Home },
  casamento: { label: "Casamento", color: "var(--cat-casamento)", icon: Heart },
};

export function GoalCard({
  goal,
  onEditClick,
  onUpdateProgress,
  onToggleCheckItem,
  onComplete,
  onCelebrate,
}: GoalCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [inputVal, setInputVal] = useState<string>(String(goal.currentAmount));

  const isFinancial = goal.type === "financeira";
  const hasChecklist = goal.checklist && goal.checklist.length > 0;
  const isDone = goal.status === "concluida";

  const meta = TYPE_META[goal.type] ?? { label: goal.type, color: "var(--text-secondary)", icon: User };
  const Icon = meta.icon;
  const percentage = pct(goal.currentAmount, goal.targetAmount);

  // Border coloring based on status
  const deadlineDays = goal.deadline ? daysUntil(goal.deadline) : Infinity;
  const isAtrasada = goal.status === "atrasada";
  const isExpiringSoon = !isDone && deadlineDays >= 0 && deadlineDays <= 7;

  const cardBorderClass = cn(
    isAtrasada && "border-danger bg-danger/[0.01]",
    isExpiringSoon && "border-warning bg-warning/[0.01]",
    !isAtrasada && !isExpiringSoon && "border-line"
  );

  const countdownText = goal.deadline ? countdownLabel(goal.deadline) : "Sem prazo";

  function handleSaveProgress(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    const parsed = parseFloat(inputVal.replace(",", "."));
    if (isNaN(parsed) || parsed < 0) {
      alert("Por favor, insira um número válido maior ou igual a zero.");
      return;
    }
    const res = onUpdateProgress(goal.id, parsed);
    if (res) {
      onCelebrate(res);
    }
  }

  function handleToggleCheckbox(e: React.MouseEvent, itemId: string) {
    e.stopPropagation();
    const res = onToggleCheckItem(goal.id, itemId);
    if (res) {
      onCelebrate(res);
    }
  }

  function handleEditClick(e: React.MouseEvent) {
    e.stopPropagation();
    onEditClick(goal);
  }

  function handleCardClick() {
    setExpanded(!expanded);
  }

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        "cursor-pointer select-none overflow-hidden transition-all duration-200 hover:scale-[1.015] hover:shadow-pop",
        cardBorderClass
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid size-9 place-items-center rounded-lg bg-panel border border-line" style={{ color: meta.color }}>
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-content truncate transition-colors group-hover:text-brand">
              {goal.title}
            </h4>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
              {meta.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge color="var(--border)">{countdownText}</Badge>
          {!isDone && (
            <button
              onClick={handleEditClick}
              className="grid size-8 place-items-center rounded-input text-muted hover:bg-panel hover:text-content transition-colors"
              title="Editar meta"
            >
              <Edit3 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {goal.description && (
        <p className="mt-2.5 text-xs text-muted leading-relaxed line-clamp-2">
          {goal.description}
        </p>
      )}

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
          <span className="text-muted">
            {isFinancial ? formatBRL(goal.currentAmount) : goal.currentAmount}{" "}
            / {isFinancial ? formatBRL(goal.targetAmount) : goal.targetAmount}{" "}
            {goal.unit && !isFinancial ? goal.unit : ""}
          </span>
          <span className="font-bold" style={{ color: meta.color }}>{percentage}%</span>
        </div>
        <GoalProgress current={goal.currentAmount} target={goal.targetAmount} color={meta.color} size="md" />
      </div>

      {/* Rewards details */}
      <div className="mt-3.5 flex items-center justify-between text-xs border-t border-line/45 pt-3 font-semibold">
        <span className="inline-flex items-center gap-1 text-muted">
          <Trophy className="size-3.5 text-amber-500" /> Recompensa:
          <span className="text-brand">+{goal.xpReward} XP</span>
        </span>

        <span className="text-[11px] text-muted font-medium">
          {expanded ? "Clique para encolher ▲" : "Clique para gerenciar ▼"}
        </span>
      </div>

      {/* Expanded Actions panel */}
      {expanded && (
        <div
          className="mt-4 border-t border-line/50 pt-4 space-y-4 cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Checklist Mode */}
          {hasChecklist && goal.checklist && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-content">Checklist de Itens</h5>
              <div className="grid gap-1.5">
                {goal.checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={(e) => handleToggleCheckbox(e, item.id)}
                    className="flex items-center gap-2.5 rounded-input bg-panel/50 px-3 py-2 border border-line/35 hover:bg-panel cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => {}} // toggled on container click
                      className="size-4 accent-brand cursor-pointer"
                    />
                    <span className={cn("text-xs text-content", item.completed && "line-through text-muted font-medium")}>
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Numerical Input Mode */}
          {!hasChecklist && !isFinancial && !isDone && (
            <form onSubmit={handleSaveProgress} className="space-y-2">
              <label htmlFor={`goal-progress-${goal.id}`} className="block text-xs font-semibold text-muted mb-1">
                Atualizar progresso ({goal.unit || "unidades"})
              </label>
              <div className="flex gap-2">
                <Input
                  id={`goal-progress-${goal.id}`}
                  type="number"
                  step="any"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="h-9 text-xs"
                />
                <Button type="submit" size="sm" className="h-9 shrink-0">
                  Salvar
                </Button>
              </div>
            </form>
          )}

          {/* Financial Redirection Mode */}
          {isFinancial && !isDone && (
            <div className="rounded-input bg-amber-500/5 border border-amber-500/10 p-3 text-xs leading-relaxed">
              <p className="text-muted">
                Meta financeira vinculada. Para depositar fundos ou quitá-la, utilize a aba de metas do módulo Financeiro para manter os orçamentos sincronizados.
              </p>
              <Button
                variant="outline"
                size="sm"
                iconRight={ArrowRight}
                onClick={() => router.push("/financeiro")}
                className="mt-2.5 border-amber-500/20 text-amber-600 hover:bg-amber-500/5 h-8 text-xs py-1"
              >
                Ir para o Financeiro
              </Button>
            </div>
          )}

          {/* Complete directly if Numerical is done or manual complete */}
          {!isDone && !isFinancial && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const res = onComplete(goal.id);
                if (res) onCelebrate(res);
                setExpanded(false);
              }}
              className="w-full justify-center border-brand/25 text-brand hover:bg-brand/5 mt-2 h-9 text-xs"
            >
              Concluir Meta
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
