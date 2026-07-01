"use client";

import { useMemo } from "react";
import { Plus, Target, PiggyBank, Heart, Home, Compass, Coins, Award, Trash2 } from "lucide-react";
import type { Goal, FinancialGoalCategory } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatBRL, pct, countdownLabel, daysUntil } from "@/lib/utils";

interface FinancialGoalListProps {
  goals: Goal[];
  onCreateClick: () => void;
  onEditClick: (goal: Goal) => void;
  onDeposit: (id: string, amount: number) => any;
  onDeleteClick: (id: string) => void;
  onCelebrate: (result: any) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  apartamento: Home,
  casamento: Heart,
  reserva_emergencia: PiggyBank,
  viagem: Compass,
  investimento: Coins,
  outros: Target,
};

export function FinancialGoalList({
  goals,
  onCreateClick,
  onEditClick,
  onDeposit,
  onDeleteClick,
  onCelebrate,
}: FinancialGoalListProps) {
  const activeGoals = useMemo(() => goals.filter((g) => g.status !== "concluida"), [goals]);
  const completedGoals = useMemo(() => goals.filter((g) => g.status === "concluida"), [goals]);

  function getIcon(category: string | null) {
    return CATEGORY_ICONS[category || ""] ?? Target;
  }

  function handleDeposit(e: React.MouseEvent, goal: Goal) {
    e.stopPropagation();
    const input = window.prompt(`Quanto deseja depositar na meta "${goal.title}"?`);
    if (input === null) return;
    const value = parseFloat(input.replace(",", "."));
    if (isNaN(value) || value <= 0) {
      alert("Por favor, insira um valor válido maior que zero.");
      return;
    }
    const res = onDeposit(goal.id, value);
    if (res) {
      onCelebrate(res);
    }
  }

  function getSavingAdvice(goal: Goal): string | null {
    if (!goal.deadline || goal.status === "concluida") return null;
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return null;

    const days = daysUntil(goal.deadline);
    if (days <= 0) return "Prazo final já se esgotou. Adicione fundos para concluir!";

    const months = Math.max(1, Math.ceil(days / 30));
    const perMonth = remaining / months;
    return `Guarde ${formatBRL(perMonth)}/mês para atingir no prazo de ${months} meses.`;
  }

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-muted">Acompanhe suas metas de poupança</h4>
        <Button icon={Plus} onClick={onCreateClick} className="bg-brand hover:bg-brand-light">
          Nova meta
        </Button>
      </div>

      {/* Active Goals grid */}
      {activeGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma meta financeira ativa"
          description="Crie sua primeira meta financeira e acompanhe cada real guardado para o seu futuro! 🎯"
          action={
            <Button size="sm" icon={Plus} onClick={onCreateClick}>
              Criar meta
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeGoals.map((g) => {
            const Icon = getIcon(g.category);
            const p = pct(g.currentAmount, g.targetAmount);
            const countdownText = g.deadline ? countdownLabel(g.deadline) : "Sem prazo";
            const isDelayed = g.deadline ? daysUntil(g.deadline) < 0 : false;
            const advice = getSavingAdvice(g);

            return (
              <Card
                key={g.id}
                onClick={() => onEditClick(g)}
                className="group relative flex flex-col justify-between cursor-pointer border-line hover:border-brand/35 hover:shadow-soft transition-all"
              >
                <div>
                  {/* Header Title + icon */}
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-brand/10 text-brand">
                      <Icon className="size-5" />
                    </span>
                    <Badge color={isDelayed ? "var(--prio-urgente)" : "var(--border)"}>
                      {countdownText}
                    </Badge>
                  </div>

                  <h4 className="mt-3.5 font-bold text-sm text-content group-hover:text-brand transition-colors truncate">
                    {g.title}
                  </h4>
                  {g.description && <p className="mt-1 text-xs text-muted line-clamp-2">{g.description}</p>}

                  {/* Progress bar */}
                  <div className="mt-5">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted">
                        {formatBRL(g.currentAmount)} / {formatBRL(g.targetAmount)}
                      </span>
                      <span className="text-brand font-bold">{p}%</span>
                    </div>
                    <ProgressBar value={p} />
                  </div>
                </div>

                {/* Footer advice and actions */}
                <div className="mt-5 border-t border-line/45 pt-3.5 space-y-3">
                  {advice && (
                    <p className="text-[10.5px] leading-relaxed text-muted bg-panel/40 px-2 py-1.5 rounded-input">
                      💡 {advice}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleDeposit(e, g)}
                      className="flex-1 justify-center border-brand/20 text-brand hover:bg-brand/5 py-1 text-xs h-8"
                    >
                      Depositar
                    </Button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (confirm("Excluir esta meta?")) onDeleteClick(g.id);
                      }}
                      className="grid size-8 place-items-center rounded-input text-muted opacity-0 group-hover:opacity-100 hover:bg-danger/10 hover:text-danger transition-all shrink-0"
                      aria-label="Excluir meta"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="border-t border-line/50 pt-5">
          <h5 className="mb-3 text-sm font-bold text-muted flex items-center gap-1.5">
            <Award className="size-4 text-amber-500" /> Metas Concluídas ({completedGoals.length})
          </h5>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {completedGoals.map((g) => {
              const Icon = getIcon(g.category);
              return (
                <div
                  key={g.id}
                  onClick={() => onEditClick(g)}
                  className="group relative flex cursor-pointer items-center gap-3.5 rounded-card border border-brand/20 bg-brand/[0.02] p-4 hover:bg-brand/[0.04] transition-all"
                >
                  <span className="grid size-9 place-items-center rounded-full bg-success/15 text-success">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xs text-content truncate line-through">{g.title}</h5>
                    <p className="mt-0.5 text-[10px] text-muted">
                      Total poupado: <strong>{formatBRL(g.targetAmount)}</strong>
                    </p>
                  </div>

                  <span className="grid size-6 place-items-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20" title="Meta Concluída!">
                    <Award className="size-3.5" />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
