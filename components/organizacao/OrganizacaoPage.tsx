"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Lock, ClipboardList } from "lucide-react";
import type { MonthlyPlanItem } from "@/types";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useGamification } from "@/components/providers/GamificationProvider";
import { useOrganizacao } from "@/hooks/useOrganizacao";
import { EmptyState } from "@/components/ui/EmptyState";
import { fireBigConfetti } from "@/lib/confetti";
import { compareToCurrentMonth, monthName, shiftMonth } from "@/lib/organizacao";
import { cn } from "@/lib/utils";
import { EmptyPlanState } from "./EmptyPlanState";
import { MonthOverview } from "./MonthOverview";
import { DistributionSection } from "./DistributionSection";
import { FutureSection } from "./FutureSection";
import { DreamsSection } from "./DreamsSection";
import { ReflectionSection } from "./ReflectionSection";

export function OrganizacaoPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { celebrate } = useGamification();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const org = useOrganizacao(month, year);

  const relation = compareToCurrentMonth(month, year);
  const readOnly = relation < 0;
  const isCurrent = relation === 0;

  // Keep this month's patrimônio snapshot fresh so the evolution chart builds over time.
  const { plan, livePatrimony, updatePlan } = org;
  useEffect(() => {
    if (!isCurrent || !plan) return;
    if (plan.patrimonyTotal !== livePatrimony) updatePlan({ patrimonyTotal: livePatrimony });
  }, [isCurrent, plan, livePatrimony, updatePlan]);

  // One-time: turn the old goal-based dream cards into editable dreams.
  const { seedDreamsFromGoals } = org;
  useEffect(() => seedDreamsFromGoals(), [seedDreamsFromGoals]);

  const go = (delta: number) => {
    const next = shiftMonth(month, year, delta);
    setMonth(next.month);
    setYear(next.year);
  };

  function handleMarkPaid(item: MonthlyPlanItem) {
    const res = org.markPaid(item);
    if (!res) return;
    toast({ variant: "success", title: res.message });
    if (res.celebration) celebrate(res.celebration, { big: !!res.celebration.completedGoal });
    // Was this the last open item of the month?
    const othersDone = org.items.filter((i) => i.id !== item.id).every((i) => org.itemStatus(i).done);
    if (org.items.length > 1 && othersDone) {
      void fireBigConfetti();
      toast({ variant: "achievement", title: "Mês organizado! Você mandou bem 🎉" });
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-dark">Espaço pessoal</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-content sm:text-3xl">
            📋 Organização <span className="text-muted">— {user?.name ?? ""}</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Só você vê esta página. Planeje cada real do seu mês.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Mês anterior"
            className="grid size-9 place-items-center rounded-input border border-line text-muted transition-colors hover:bg-panel hover:text-content"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="min-w-[150px] text-center">
            <p className={cn("text-lg font-bold", isCurrent ? "text-brand-dark dark:text-brand-light" : "text-content")}>
              {monthName(month)} {year}
            </p>
            {isCurrent ? (
              <span className="text-[10px] font-bold uppercase tracking-wide text-brand">Mês atual</span>
            ) : readOnly ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                <Lock className="size-3" /> Somente leitura
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMonth(now.getMonth() + 1);
                  setYear(now.getFullYear());
                }}
                className="text-[10px] font-bold uppercase tracking-wide text-muted hover:text-brand"
              >
                Voltar ao mês atual
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Próximo mês"
            className="grid size-9 place-items-center rounded-input border border-line text-muted transition-colors hover:bg-panel hover:text-content"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </header>

      {!org.plan ? (
        readOnly ? (
          <EmptyState
            icon={ClipboardList}
            title={`Sem plano em ${monthName(month)}/${year}`}
            description="Você não planejou este mês. Os meses passados ficam só para consulta."
          />
        ) : (
          <EmptyPlanState
            userName={user?.name ?? ""}
            monthLabel={monthName(month)}
            onStart={(income) => {
              org.createPlan(income);
              const copied = org.copyPreviousItems();
              toast({
                variant: "success",
                title: "Plano criado 💜",
                description: copied > 0 ? `${copied} itens do mês anterior copiados.` : "Agora distribua sua receita.",
              });
            }}
          />
        )
      ) : (
        <>
          <MonthOverview
            income={org.plan.totalIncome}
            distribution={org.distribution}
            hasItems={org.items.length > 0}
            readOnly={readOnly}
            onIncomeChange={(v) => org.updatePlan({ totalIncome: v })}
          />
          <DistributionSection
            items={org.items}
            readOnly={readOnly}
            itemStatus={org.itemStatus}
            debts={org.debts}
            goals={org.financialGoals}
            investments={org.investments}
            canUndo={org.canUndo}
            onAdd={org.addItem}
            onDelete={org.deleteItem}
            onMarkPaid={handleMarkPaid}
            onUndo={org.undoPaid}
          />
          <FutureSection
            avgMonthlySavings={org.avgMonthlySavings}
            projections={org.goalProjections}
            history={org.patrimonyHistory}
          >
            <DreamsSection
              dreams={org.resolvedDreams}
              goals={org.allFinancialGoals}
              onSave={(form, id) => {
                org.saveDream(form, id);
                toast({ variant: "success", title: id ? "Sonho atualizado ✨" : "Novo sonho criado ✨" });
              }}
              onDelete={org.deleteDream}
              onSetCurrent={org.setDreamCurrent}
              onReorder={org.reorderDreams}
            />
          </FutureSection>
          <ReflectionSection
            key={org.plan.id}
            monthLabel={`${monthName(month)}/${year}`}
            notes={org.plan.notes}
            ideas={org.ideas}
            readOnly={readOnly}
            onSaveNotes={(notes) => org.updatePlan({ notes })}
            onAddIdea={org.addIdea}
            onDeleteIdea={org.deleteIdea}
            onPromote={(idea, dest, form) => {
              org.promoteIdea(idea, dest, form);
              const where = dest === "task" ? "Tarefas" : dest === "goal" ? "Metas do Financeiro" : "Notas";
              toast({ variant: "success", title: "💡 Ideia virou ação!", description: `Criada em ${where}.` });
            }}
          />
        </>
      )}
    </div>
  );
}
