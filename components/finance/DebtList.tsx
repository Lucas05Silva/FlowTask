"use client";

import { useMemo, useState } from "react";
import { Plus, CheckCircle, ChevronDown, ChevronRight, Calendar, AlertCircle, Percent, Coins, Trash2 } from "lucide-react";
import type { Debt } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatBRL, pct } from "@/lib/utils";

interface DebtListProps {
  debts: Debt[];
  onCreateClick: () => void;
  onEditClick: (debt: Debt) => void;
  onPayInstallment: (id: string) => any;
  onDeleteClick: (id: string) => void;
  onCelebrate: (result: any) => void;
}

export function DebtList({
  debts,
  onCreateClick,
  onEditClick,
  onPayInstallment,
  onDeleteClick,
  onCelebrate,
}: DebtListProps) {
  const [showPaidDebts, setShowPaidDebts] = useState(false);

  const activeDebts = useMemo(() => debts.filter((d) => d.status === "ativa"), [debts]);
  const quitadaDebts = useMemo(() => debts.filter((d) => d.status === "quitada"), [debts]);

  const totalActiveValue = useMemo(() => {
    return activeDebts.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
  }, [activeDebts]);

  function getDueCountdown(dueDay: number): { text: string; urgent: boolean; past: boolean } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(today.getFullYear(), today.getMonth(), dueDay);
    target.setHours(0, 0, 0, 0);

    let diff = Math.round((target.getTime() - today.getTime()) / 86400000);

    if (diff === 0) {
      return { text: "Vence hoje ⚠️", urgent: true, past: false };
    }
    if (diff === 1) {
      return { text: "Vence amanhã ⏳", urgent: true, past: false };
    }
    if (diff > 1) {
      return { text: `Vence em ${diff} dias`, urgent: diff <= 7, past: false };
    }

    // if diff < 0 (day has passed in the current month)
    // we assume it is delayed for this month
    return { text: `Atrasada há ${Math.abs(diff)} dias 🚨`, urgent: true, past: true };
  }

  function handleQuickPay(e: React.MouseEvent, debt: Debt) {
    e.stopPropagation();
    const res = onPayInstallment(debt.id);
    if (res) {
      onCelebrate(res);
    }
  }

  return (
    <div className="space-y-5">
      {/* Overview stats & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-input bg-amber-500/5 border border-amber-500/15 px-4 py-3 flex-1 flex justify-between items-center max-w-lg">
          <span className="text-sm font-semibold text-amber-600 flex items-center gap-1.5">
            <Coins className="size-4" /> Dívidas Pendentes Totais
          </span>
          <span className="text-lg font-bold text-amber-600">{formatBRL(totalActiveValue)}</span>
        </div>

        <Button icon={Plus} onClick={onCreateClick} className="self-start sm:self-auto bg-amber-500 hover:bg-amber-600">
          Nova dívida
        </Button>
      </div>

      {/* Active debts */}
      {activeDebts.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="Sem dívidas por aqui — continue assim! 🎉"
          description="Você quitou todas as suas pendências e parcelamentos ou não possui nenhum cadastrado."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {activeDebts.map((d) => {
            const p = pct(d.paidAmount, d.totalAmount);
            const countdown = getDueCountdown(d.dueDay);
            const installmentValue = d.totalAmount / d.installmentsTotal;

            return (
              <Card
                key={d.id}
                onClick={() => onEditClick(d)}
                className="group relative cursor-pointer overflow-hidden border-line hover:border-amber-500/30 hover:shadow-soft transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-base text-content group-hover:text-amber-500 transition-colors truncate">
                      {d.name}
                    </h4>
                    <p className="mt-1 text-xs text-muted">
                      Vence todo dia <strong className="text-content">{d.dueDay}</strong>
                    </p>
                  </div>
                  <Badge color={countdown.past ? "var(--prio-urgente)" : countdown.urgent ? "var(--prio-alta)" : "var(--border)"}>
                    {countdown.text}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted">
                      {formatBRL(d.paidAmount)} / {formatBRL(d.totalAmount)}
                    </span>
                    <span className="text-content">{p}%</span>
                  </div>
                  <ProgressBar value={p} className="bg-amber-500/20" />
                </div>

                {/* Additional details */}
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line/45 pt-3.5 text-xs text-muted font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {d.installmentsPaid}/{d.installmentsTotal} parcelas
                  </span>

                  {d.interestRate !== null && d.interestRate > 0 && (
                    <span className="flex items-center gap-1 text-danger">
                      <Percent className="size-3.5" />
                      {d.interestRate}% a.m.
                    </span>
                  )}

                  <span className="ml-auto text-content font-bold">
                    Parc: {formatBRL(installmentValue)}
                  </span>
                </div>

                {/* Action button bar */}
                <div className="mt-3.5 border-t border-line/45 pt-3 flex justify-between items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleQuickPay(e, d)}
                    className="flex-1 justify-center border-amber-500/20 text-amber-600 hover:bg-amber-500/5 py-1 text-xs h-8"
                  >
                    Pagar Parcela
                  </Button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (confirm("Excluir esta dívida?")) onDeleteClick(d.id);
                    }}
                    className="grid size-8 place-items-center rounded-input text-muted opacity-0 group-hover:opacity-100 hover:bg-danger/10 hover:text-danger transition-all shrink-0"
                    aria-label="Excluir dívida"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Collapsible Paid Debts */}
      {quitadaDebts.length > 0 && (
        <div className="border-t border-line/50 pt-4">
          <button
            type="button"
            onClick={() => setShowPaidDebts(!showPaidDebts)}
            className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-content transition-colors"
          >
            {showPaidDebts ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            Dívidas Quitadas ({quitadaDebts.length})
          </button>

          {showPaidDebts && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {quitadaDebts.map((d) => (
                <div
                  key={d.id}
                  onClick={() => onEditClick(d)}
                  className="group flex cursor-pointer items-center justify-between rounded-card border border-line bg-panel/40 p-4 opacity-70 hover:opacity-100 hover:bg-panel transition-all"
                >
                  <div>
                    <h5 className="font-semibold text-sm text-content line-through">{d.name}</h5>
                    <p className="mt-0.5 text-xs text-muted">
                      Total: {formatBRL(d.totalAmount)} · {d.installmentsTotal} parcelas
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color="var(--success)">Quitada 🎉</Badge>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (confirm("Excluir esta dívida?")) onDeleteClick(d.id);
                      }}
                      className="grid size-8 place-items-center rounded-input text-muted opacity-0 group-hover:opacity-100 hover:bg-danger/10 hover:text-danger transition-all"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
