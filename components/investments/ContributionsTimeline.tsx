"use client";

import { useMemo, useState } from "react";
import { Plus, History, Trash2 } from "lucide-react";
import type { Investment, InvestmentContribution } from "@/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatBRL, formatDate } from "@/lib/utils";

interface ContributionsTimelineProps {
  contributions: InvestmentContribution[];
  investments: Investment[];
  onCreateAvulso: () => void;
  onDelete: (id: string) => void;
}

const MONTH_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function ContributionsTimeline({
  contributions,
  investments,
  onCreateAvulso,
  onDelete,
}: ContributionsTimelineProps) {
  const [investmentFilter, setInvestmentFilter] = useState<string>("todos");

  const nameById = useMemo(() => new Map(investments.map((i) => [i.id, i])), [investments]);

  const groups = useMemo(() => {
    const filtered =
      investmentFilter === "todos"
        ? contributions
        : contributions.filter((c) => c.investmentId === investmentFilter);

    const map = new Map<string, InvestmentContribution[]>();
    for (const c of filtered) {
      const key = c.date.slice(0, 7); // YYYY-MM
      const list = map.get(key) ?? [];
      list.push(c);
      map.set(key, list);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, items]) => ({
        month,
        label: `${MONTH_LABELS[parseInt(month.slice(5, 7), 10) - 1]} ${month.slice(0, 4)}`,
        total: items.reduce((s, c) => s + c.amount, 0),
        items: [...items].sort((a, b) => b.date.localeCompare(a.date)),
      }));
  }, [contributions, investmentFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Filtrar por investimento
          <Select
            value={investmentFilter}
            onChange={(e) => setInvestmentFilter(e.target.value)}
            className="h-9 w-auto min-w-[200px] text-sm"
          >
            <option value="todos">Todos</option>
            {investments.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
        </label>
        <Button size="sm" icon={Plus} onClick={onCreateAvulso} disabled={investments.length === 0}>
          Registrar Aporte Avulso
        </Button>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhum aporte registrado"
          description="Cada aporte que você registrar aparece aqui, agrupado por mês."
        />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.month}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-content">{group.label}</h3>
                <span className="text-sm font-semibold text-success">+{formatBRL(group.total)}</span>
              </div>
              <Card padded={false} className="divide-y divide-line/60 overflow-hidden">
                {group.items.map((c) => {
                  const inv = nameById.get(c.investmentId);
                  return (
                    <div key={c.id} className="group flex items-center gap-3 px-4 py-3">
                      <span className="w-12 shrink-0 text-xs font-medium text-muted">{formatDate(c.date)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-content">
                          {inv?.name ?? "Investimento removido"}
                          {inv?.isEmergencyFund && <span className="ml-1.5 text-[11px] text-success">(Reserva)</span>}
                        </p>
                        {c.notes && <p className="truncate text-[11px] text-muted">{c.notes}</p>}
                      </div>
                      <span className="shrink-0 text-sm font-bold text-success">+{formatBRL(c.amount)}</span>
                      <button
                        type="button"
                        onClick={() => onDelete(c.id)}
                        aria-label="Excluir aporte"
                        className="shrink-0 rounded-input p-1.5 text-muted opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
