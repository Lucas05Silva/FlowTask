"use client";

import { useMemo } from "react";
import { Info, AlertTriangle, AlertCircle, TrendingDown, Coins, Calendar, PieChart } from "lucide-react";
import type { FinanceEntry, Debt, Goal } from "@/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatBRL, daysUntil } from "@/lib/utils";
import { FINANCE_CATEGORY_META } from "@/lib/constants";

interface FinanceSuggestionsProps {
  finances: FinanceEntry[];
  debts: Debt[];
  goals: Goal[];
  expensesByCategory: { category: string; amount: number; percentage: number }[];
  suggestions: { type: "info" | "warning" | "danger"; title: string; message: string }[];
}

export function FinanceSuggestions({
  finances,
  debts,
  goals,
  expensesByCategory,
  suggestions,
}: FinanceSuggestionsProps) {
  const activeGoals = useMemo(() => goals.filter((g) => g.status === "em_andamento"), [goals]);
  const activeDebts = useMemo(() => debts.filter((d) => d.status === "ativa"), [debts]);

  const cardsColorMap = {
    info: {
      bg: "bg-info/5 border-info/20",
      text: "text-info",
      icon: Info,
    },
    warning: {
      bg: "bg-warning/5 border-warning/20",
      text: "text-warning",
      icon: AlertTriangle,
    },
    danger: {
      bg: "bg-danger/5 border-danger/20",
      text: "text-danger",
      icon: AlertCircle,
    },
  };

  return (
    <div className="space-y-6">
      {/* Advisor list */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-muted flex items-center gap-1.5">
          <PieChart className="size-4 text-brand" /> Recomendações Automáticas
        </h4>

        {suggestions.map((s, idx) => {
          const config = cardsColorMap[s.type] || cardsColorMap.info;
          const Icon = config.icon;

          return (
            <div
              key={idx}
              className={`flex gap-3.5 rounded-card border p-4 items-start ${config.bg}`}
            >
              <span className={`grid size-9 place-items-center rounded-full bg-surface shrink-0 ${config.text}`}>
                <Icon className="size-5" />
              </span>
              <div>
                <h5 className={`font-bold text-sm ${config.text}`}>{s.title}</h5>
                <p className="mt-1 text-xs text-muted leading-relaxed">{s.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top 3 Expenses breakdown */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="size-5 text-danger" />
            <CardTitle className="text-base font-semibold">Onde você mais gastou (Mês Atual)</CardTitle>
          </div>

          {expensesByCategory.length === 0 ? (
            <p className="text-xs text-muted py-6 text-center">Nenhum gasto registrado neste mês.</p>
          ) : (
            <div className="space-y-3">
              {expensesByCategory.slice(0, 3).map((c, idx) => {
                const meta = FINANCE_CATEGORY_META[c.category as keyof typeof FINANCE_CATEGORY_META];
                const label = meta?.label ?? c.category;
                const color = meta?.color ?? "var(--text-secondary)";

                return (
                  <div key={c.category} className="flex items-center justify-between border-b border-line/40 pb-2 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-semibold text-muted text-[10px] w-4">#{idx + 1}</span>
                      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="truncate font-semibold text-content">{label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-content">{formatBRL(c.amount)}</span>
                      <span className="text-[10px] text-muted bg-panel px-1.5 py-0.5 rounded font-semibold">
                        {c.percentage}% do total
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Savings Goals details list */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Coins className="size-5 text-success" />
            <CardTitle className="text-base font-semibold">Economia Necessária por Meta</CardTitle>
          </div>

          {activeGoals.length === 0 ? (
            <p className="text-xs text-muted py-6 text-center">Nenhuma meta ativa necessitando de economia.</p>
          ) : (
            <div className="space-y-3">
              {activeGoals.map((g) => {
                if (!g.deadline) return null;
                const days = daysUntil(g.deadline);
                const months = Math.max(1, Math.ceil(days / 30));
                const remaining = Math.max(0, g.targetAmount - g.currentAmount);
                const perMonth = remaining / months;

                return (
                  <div key={g.id} className="flex items-center justify-between border-b border-line/40 pb-2 text-xs">
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="truncate font-semibold text-content block">{g.title}</span>
                      <span className="text-[10px] text-muted block mt-0.5">
                        Faltam {formatBRL(remaining)} · {months} meses restantes
                      </span>
                    </div>
                    <span className="font-bold text-success text-right shrink-0">
                      {formatBRL(perMonth)}/mês
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Alertas section (debts summary check) */}
      {activeDebts.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="size-5 text-amber-500" />
            <CardTitle className="text-base font-semibold">Alertas de Vencimentos</CardTitle>
          </div>
          <div className="grid gap-2 text-xs">
            {activeDebts.map((d) => {
              const today = new Date().getDate();
              const diff = d.dueDay - today;
              const installmentValue = d.totalAmount / d.installmentsTotal;
              
              let msg = "";
              let variant: "urgent" | "normal" = "normal";

              if (diff === 0) {
                msg = `Vence hoje! Parcela de ${formatBRL(installmentValue)}`;
                variant = "urgent";
              } else if (diff === 1) {
                msg = `Vence amanhã. Parcela de ${formatBRL(installmentValue)}`;
                variant = "urgent";
              } else if (diff > 1 && diff <= 7) {
                msg = `Vencimento em ${diff} dias. Parcela de ${formatBRL(installmentValue)}`;
                variant = "urgent";
              } else if (diff > 7) {
                msg = `Próximo vencimento dia ${d.dueDay} (em ${diff} dias).`;
              } else {
                msg = `Parcela atrasada há ${Math.abs(diff)} dias para o dia ${d.dueDay}.`;
                variant = "urgent";
              }

              return (
                <div key={d.id} className="flex items-center justify-between border-b border-line/30 pb-2">
                  <span className="font-semibold text-content">{d.name}</span>
                  <span className={`font-medium ${variant === "urgent" ? "text-danger font-semibold" : "text-muted"}`}>
                    {msg}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
