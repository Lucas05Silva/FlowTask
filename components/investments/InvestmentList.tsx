"use client";

import { useMemo, useState } from "react";
import { TrendingUp, Plus } from "lucide-react";
import type { Investment, Goal } from "@/types";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { InvestmentCard } from "./InvestmentCard";
import { daysUntil } from "@/lib/utils";

type TypeFilter = "todos" | "tesouro" | "cdb" | "lci_lca" | "fii" | "acao" | "crypto" | "outros";
type StatusFilter = "todos" | "reserva" | "vencimento";
type OrderBy = "valor" | "rendimento" | "recente";

interface InvestmentListProps {
  investments: Investment[];
  goals: Goal[];
  forceEmergencyFilter?: boolean;
  onCreate: () => void;
  onAddContribution: (inv: Investment) => void;
  onEdit: (inv: Investment) => void;
  onDelete: (id: string) => void;
  onViewContributions: (inv: Investment) => void;
}

const TESOURO = new Set(["tesouro_selic", "tesouro_ipca", "tesouro_prefixado"]);

export function InvestmentList({
  investments,
  goals,
  forceEmergencyFilter,
  onCreate,
  onAddContribution,
  onEdit,
  onDelete,
  onViewContributions,
}: InvestmentListProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("todos");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [orderBy, setOrderBy] = useState<OrderBy>("valor");

  const goalTitle = (id?: string | null) => (id ? goals.find((g) => g.id === id)?.title ?? null : null);

  const filtered = useMemo(() => {
    let list = [...investments];

    if (forceEmergencyFilter) list = list.filter((i) => i.isEmergencyFund);

    if (typeFilter !== "todos") {
      list = list.filter((i) => {
        if (typeFilter === "tesouro") return TESOURO.has(i.type);
        if (typeFilter === "outros") return i.type === "outro" || i.type === "poupanca";
        return i.type === typeFilter;
      });
    }

    if (statusFilter === "reserva") list = list.filter((i) => i.isEmergencyFund);
    if (statusFilter === "vencimento") {
      list = list.filter((i) => {
        if (!i.maturityDate) return false;
        const d = daysUntil(i.maturityDate);
        return d >= 0 && d <= 90;
      });
    }

    list.sort((a, b) => {
      if (orderBy === "valor") return b.currentValue - a.currentValue;
      if (orderBy === "rendimento") {
        const ra = a.investedAmount > 0 ? (a.currentValue - a.investedAmount) / a.investedAmount : 0;
        const rb = b.investedAmount > 0 ? (b.currentValue - b.investedAmount) / b.investedAmount : 0;
        return rb - ra;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });

    return list;
  }, [investments, typeFilter, statusFilter, orderBy, forceEmergencyFilter]);

  if (investments.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Nenhum investimento cadastrado ainda"
        description="Cadastre seu primeiro investimento e veja seu patrimônio crescer 📈"
        action={
          <Button icon={Plus} onClick={onCreate}>
            Novo Investimento
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Tipo
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="h-9 w-auto min-w-[150px] text-sm"
          >
            <option value="todos">Todos</option>
            <option value="tesouro">Tesouro Direto</option>
            <option value="cdb">CDB</option>
            <option value="lci_lca">LCI / LCA</option>
            <option value="fii">FII</option>
            <option value="acao">Ação</option>
            <option value="crypto">Cripto</option>
            <option value="outros">Outros</option>
          </Select>
        </label>

        {!forceEmergencyFilter && (
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Status
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-9 w-auto min-w-[180px] text-sm"
            >
              <option value="todos">Todos</option>
              <option value="reserva">Reserva de Emergência</option>
              <option value="vencimento">Vencimento próximo (&lt; 90 dias)</option>
            </Select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Ordenar por
          <Select
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value as OrderBy)}
            className="h-9 w-auto min-w-[150px] text-sm"
          >
            <option value="valor">Maior valor</option>
            <option value="rendimento">Maior rendimento</option>
            <option value="recente">Mais recente</option>
          </Select>
        </label>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-surface/50 px-6 py-10 text-center text-sm text-muted">
          Nenhum investimento corresponde a esses filtros.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((inv) => (
            <InvestmentCard
              key={inv.id}
              investment={inv}
              linkedGoalTitle={goalTitle(inv.goalId)}
              onAddContribution={onAddContribution}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewContributions={onViewContributions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
