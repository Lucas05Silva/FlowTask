"use client";

import { useState } from "react";
import { Globe, PiggyBank } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { GoalProgress } from "@/components/goals/GoalProgress";
import { RESERVE_ESTIMATE_DEFAULTS, RESERVE_ESTIMATE_TOTAL } from "@/lib/canada-data";
import { formatBRL, pct } from "@/lib/utils";

interface CanadaFinanceiroProps {
  current: number;
  target: number;
  netMonthly: number;
  exteriorTotal: number;
  hasExteriorInvestment: boolean;
  onUpdateCurrent: (value: number) => void;
}

export function CanadaFinanceiro({
  current,
  target,
  netMonthly,
  exteriorTotal,
  hasExteriorInvestment,
  onUpdateCurrent,
}: CanadaFinanceiroProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(0);

  const progressPct = pct(current, target);
  const monthsToGoal = netMonthly > 0 && current < target ? Math.ceil((target - current) / netMonthly) : null;
  const projectionDate = (() => {
    if (monthsToGoal == null) return null;
    const d = new Date();
    d.setMonth(d.getMonth() + monthsToGoal);
    return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(d);
  })();

  function submitDraft() {
    onUpdateCurrent(draft);
    setEditing(false);
  }

  return (
    <div className="space-y-5">
      {/* Reference estimate */}
      <Card className="flex flex-col gap-3">
        <h3 className="flex items-center gap-2 font-semibold text-content">
          💵 Reserva recomendada para emigrar (estimativa)
        </h3>
        <div className="divide-y divide-line/60">
          {RESERVE_ESTIMATE_DEFAULTS.map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 text-sm">
              <span className="text-muted">{item.label}</span>
              <span className="font-medium text-content">~{formatBRL(item.amount)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="font-semibold text-content">TOTAL ESTIMADO</span>
          <span className="text-lg font-bold text-brand">~{formatBRL(RESERVE_ESTIMATE_TOTAL)}</span>
        </div>
        <p className="text-[11px] text-muted">Todos os valores são estimativas de referência.</p>
      </Card>

      {/* Linked goal */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-semibold text-content">
            <PiggyBank className="size-4.5 text-brand" /> Meta: Reserva Canadá
          </h3>
          <span className="text-sm font-bold text-content">
            {formatBRL(current)} / {formatBRL(target)} ({progressPct}%)
          </span>
        </div>
        <GoalProgress current={current} target={target} color="var(--brand-purple)" size="lg" />

        {projectionDate ? (
          <p className="text-xs text-muted">
            No ritmo atual de economia (
            <span className="font-medium text-content">{formatBRL(netMonthly)}/mês</span>), vocês chegam em{" "}
            <span className="font-medium text-content">
              {monthsToGoal} {monthsToGoal === 1 ? "mês" : "meses"} ({projectionDate})
            </span>
            .
          </p>
        ) : (
          <p className="text-xs text-muted">
            Registre entradas/saídas no módulo Financeiro para ver a projeção de quando atingem a meta.
          </p>
        )}

        {editing ? (
          <div className="flex items-center gap-2">
            <CurrencyInput value={draft} onChange={setDraft} className="h-9" autoFocus />
            <Button size="sm" onClick={submitDraft}>
              Atualizar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setDraft(current);
              setEditing(true);
            }}
          >
            Atualizar valor guardado
          </Button>
        )}
      </Card>

      {/* Exterior investments summary */}
      <Card className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-input bg-[#F59E0B]/16 text-[#F59E0B]">
            <Globe className="size-5" />
          </span>
          <div>
            <h3 className="font-semibold text-content">Investimentos no Exterior</h3>
            <p className="text-xs text-muted">
              {hasExteriorInvestment
                ? "Este valor pode ser direcionado para a reserva do Canadá quando for utilizado."
                : "Nenhum investimento no exterior cadastrado ainda."}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-lg font-bold text-content">{formatBRL(exteriorTotal)}</span>
      </Card>
    </div>
  );
}
