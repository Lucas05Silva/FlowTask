"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Link2,
  MoreVertical,
  History,
  Trash2,
} from "lucide-react";
import type { Investment } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { INVESTMENT_TYPE_META, INDEX_META, LIQUIDITY_META } from "@/lib/investment-calculator";
import { formatBRL, formatDate, daysUntil, cn } from "@/lib/utils";

interface InvestmentCardProps {
  investment: Investment;
  linkedGoalTitle?: string | null;
  onAddContribution: (inv: Investment) => void;
  onEdit: (inv: Investment) => void;
  onDelete: (id: string) => void;
  onViewContributions: (inv: Investment) => void;
}

export function InvestmentCard({
  investment,
  linkedGoalTitle,
  onAddContribution,
  onEdit,
  onDelete,
  onViewContributions,
}: InvestmentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const closeMenu = () => {
    setMenuOpen(false);
    setConfirmDelete(false);
  };

  const meta = INVESTMENT_TYPE_META[investment.type];
  const gain = investment.currentValue - investment.investedAmount;
  const gainPct = investment.investedAmount > 0 ? (gain / investment.investedAmount) * 100 : 0;
  const positive = gain >= 0;

  const daysToMaturity = investment.maturityDate ? daysUntil(investment.maturityDate) : null;
  const maturitySoon = daysToMaturity !== null && daysToMaturity >= 0 && daysToMaturity <= 90;

  // Progress toward maturity (0–100), derived from day counts (no clock read here).
  let maturityPct: number | null = null;
  if (investment.maturityDate && daysToMaturity !== null) {
    const start = new Date(investment.purchaseDate).getTime();
    const end = new Date(investment.maturityDate).getTime();
    const totalDays = (end - start) / 86400000;
    if (totalDays > 0) {
      const elapsed = totalDays - daysToMaturity;
      maturityPct = Math.max(0, Math.min(100, (elapsed / totalDays) * 100));
    }
  }

  const rateLabel =
    investment.index === "cdi"
      ? `${investment.rate}% do CDI`
      : investment.index === "prefixado"
        ? `${investment.rate}% a.a.`
        : `${INDEX_META[investment.index].label}${investment.rate ? ` + ${investment.rate}%` : ""}`;

  return (
    <Card hover className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-input"
            style={{ backgroundColor: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
          >
            <TrendingUp className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-content">{investment.name}</h3>
            <span className="text-xs text-muted">{meta.label}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Badge color={meta.color} className="text-[10px] uppercase">
            {INDEX_META[investment.index].label}
          </Badge>
          {investment.isEmergencyFund && (
            <Badge color="var(--success)" className="text-[10px] uppercase">
              <ShieldCheck className="size-3" /> Reserva
            </Badge>
          )}
          {maturitySoon && (
            <Badge
              color={daysToMaturity! <= 30 ? "var(--danger)" : "var(--warning)"}
              className="text-[10px] uppercase"
            >
              Vence em {daysToMaturity}d
            </Badge>
          )}
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-3 gap-2 rounded-input bg-panel/50 p-3">
        <div>
          <p className="text-[11px] text-muted">Aportado</p>
          <p className="text-sm font-semibold text-content">{formatBRL(investment.investedAmount)}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted">Valor atual</p>
          <p className="text-sm font-semibold text-content">{formatBRL(investment.currentValue)}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted">Rendimento</p>
          <p className={cn("flex items-center gap-0.5 text-sm font-bold", positive ? "text-success" : "text-danger")}>
            {positive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            {positive ? "+" : ""}
            {formatBRL(gain)}
          </p>
        </div>
      </div>

      {/* Meta line */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
        <span>
          Início: <span className="font-medium text-content">{formatDate(investment.purchaseDate)}</span>
        </span>
        <span>
          Vencimento:{" "}
          <span className="font-medium text-content">
            {investment.maturityDate ? formatDate(investment.maturityDate) : "—"}
          </span>
        </span>
        <span>
          Liquidez: <span className="font-medium text-content">{LIQUIDITY_META[investment.liquidity].label}</span>
        </span>
        <span>
          Taxa: <span className="font-medium text-content">{rateLabel}</span>
        </span>
      </div>

      <span className={cn("text-xs font-semibold", positive ? "text-success" : "text-danger")}>
        {positive ? "+" : ""}
        {gainPct.toFixed(1)}% de rentabilidade estimada
      </span>

      {linkedGoalTitle && (
        <span className="inline-flex items-center gap-1 text-[11px] text-brand">
          <Link2 className="size-3" /> Meta: {linkedGoalTitle}
        </span>
      )}

      {/* Maturity progress */}
      {maturityPct !== null && (
        <div>
          <div className="mb-1 flex items-center justify-between text-[10px] text-muted">
            <span>Progresso até o vencimento</span>
            <span className="font-semibold">{Math.round(maturityPct)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel">
            <div className="h-full rounded-full" style={{ width: `${maturityPct}%`, backgroundColor: meta.color }} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-1 flex items-center justify-end gap-2 border-t border-line pt-3">
        <Button size="sm" variant="outline" icon={Plus} onClick={() => onAddContribution(investment)}>
          Aporte
        </Button>

        <div className="relative">
          <button
            type="button"
            aria-label="Mais opções"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="grid size-9 place-items-center rounded-input text-muted transition-colors hover:bg-panel hover:text-content"
          >
            <MoreVertical className="size-5" />
          </button>

          {menuOpen && (
            <>
              {/* click-outside backdrop */}
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                onClick={closeMenu}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div
                role="menu"
                className="absolute bottom-full right-0 z-50 mb-1 w-48 overflow-hidden rounded-input border border-line bg-surface p-1 shadow-pop"
              >
                {confirmDelete ? (
                  <div className="p-2">
                    <p className="mb-2 text-xs text-danger">Excluir este investimento e seus aportes?</p>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                        Não
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          onDelete(investment.id);
                          closeMenu();
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <MenuItem
                      icon={Pencil}
                      label="Editar"
                      onClick={() => {
                        onEdit(investment);
                        closeMenu();
                      }}
                    />
                    <MenuItem
                      icon={History}
                      label="Ver aportes"
                      onClick={() => {
                        onViewContributions(investment);
                        closeMenu();
                      }}
                    />
                    <MenuItem icon={Trash2} label="Excluir" danger onClick={() => setConfirmDelete(true)} />
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[6px] px-3 py-2 text-sm font-medium transition-colors",
        danger ? "text-danger hover:bg-danger/10" : "text-content hover:bg-panel",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {label}
    </button>
  );
}
