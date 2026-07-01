"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Info } from "lucide-react";
import type { FinanceEntry, Debt } from "@/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatBRL, formatDate } from "@/lib/utils";
import { FINANCE_CATEGORY_META } from "@/lib/constants";

interface FinanceOverviewProps {
  finances: FinanceEntry[];
  debts: Debt[];
  monthlyTotals: { income: number; expense: number; balance: number };
  last6Months: { month: string; label: string; income: number; expense: number }[];
  expensesByCategory: { category: string; amount: number; percentage: number }[];
  projection: { avgIncome: number; avgExpense: number; projectedBalance: number };
  onOpenModal: (type: "income" | "expense") => void;
}

export function FinanceOverview({
  finances,
  debts,
  monthlyTotals,
  last6Months,
  expensesByCategory,
  projection,
  onOpenModal,
}: FinanceOverviewProps) {
  const [hoveredBar, setHoveredBar] = useState<{ month: string; type: "income" | "expense"; amount: number } | null>(null);

  // 1. Total active debts
  const totalActiveDebts = useMemo(() => {
    return debts
      .filter((d) => d.status === "ativa")
      .reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
  }, [debts]);

  // 2. Recent transactions (last 5)
  const recentTransactions = useMemo(() => {
    return [...finances]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
  }, [finances]);

  // Calculations for 6 Months Bar Chart scale
  const barChartMax = useMemo(() => {
    const maxVal = Math.max(100, ...last6Months.flatMap((m) => [m.income, m.expense]));
    // round up to a nice number
    return Math.ceil(maxVal / 500) * 500;
  }, [last6Months]);

  // Donut chart path calculations
  const donutSegments = useMemo(() => {
    const radius = 30;
    const circ = 2 * Math.PI * radius; // ~188.495
    let accumulatedPercent = 0;

    return expensesByCategory.map((c) => {
      const percentage = c.percentage;
      const strokeLength = (percentage / 100) * circ;
      const strokeOffset = circ - ((accumulatedPercent / 100) * circ);
      accumulatedPercent += percentage;

      return {
        ...c,
        strokeLength,
        strokeOffset,
      };
    });
  }, [expensesByCategory]);

  return (
    <div className="space-y-6">
      {/* 4 Cards Resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Saldo */}
        <Card className="relative overflow-hidden border-line">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Saldo do mês</span>
            <span
              className={`rounded-full p-2 ${
                monthlyTotals.balance >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
              }`}
            >
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className={`text-2xl font-bold ${monthlyTotals.balance >= 0 ? "text-success" : "text-danger"}`}>
              {formatBRL(monthlyTotals.balance)}
            </h3>
            <p className="mt-1 text-xs text-muted">Total líquido disponível</p>
          </div>
        </Card>

        {/* Entradas */}
        <Card
          className="relative overflow-hidden cursor-pointer hover:border-success/30 hover:bg-success/[0.01] transition-all"
          onClick={() => onOpenModal("income")}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Entradas</span>
            <span className="rounded-full bg-success/10 text-success p-2">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-bold text-content">{formatBRL(monthlyTotals.income)}</h3>
            <p className="mt-1 text-xs text-muted hover:underline">Registrar receita &rarr;</p>
          </div>
        </Card>

        {/* Saídas */}
        <Card
          className="relative overflow-hidden cursor-pointer hover:border-danger/30 hover:bg-danger/[0.01] transition-all"
          onClick={() => onOpenModal("expense")}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Saídas</span>
            <span className="rounded-full bg-danger/10 text-danger p-2">
              <ArrowDownRight className="size-4" />
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-bold text-content">{formatBRL(monthlyTotals.expense)}</h3>
            <p className="mt-1 text-xs text-muted hover:underline">Registrar despesa &rarr;</p>
          </div>
        </Card>

        {/* Dívidas */}
        <Card className="relative overflow-hidden border-line">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Dívidas Pendentes</span>
            <span className="rounded-full bg-amber-500/10 text-amber-500 p-2">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-bold text-amber-500">{formatBRL(totalActiveDebts)}</h3>
            <p className="mt-1 text-xs text-muted">Soma de todas as parcelas ativas</p>
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Entradas vs Saídas (6 Meses) */}
        <Card>
          <CardTitle className="mb-4 text-base font-semibold">Entradas vs Saídas (Últimos 6 meses)</CardTitle>
          <div className="relative flex h-60 flex-col justify-between pt-4">
            {/* Grid background lines */}
            <div className="absolute inset-x-0 bottom-8 top-4 flex flex-col justify-between pointer-events-none">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <div key={ratio} className="relative w-full border-t border-line/70">
                  <span className="absolute -top-2 left-0 text-[10px] text-muted/65 bg-surface pr-1.5 font-medium">
                    {formatBRL(barChartMax * (1 - ratio))}
                  </span>
                </div>
              ))}
            </div>

            {/* Bars container */}
            <div className="relative z-10 flex h-48 items-end justify-around pl-14 pr-2">
              {last6Months.map((m) => {
                const incomePct = (m.income / barChartMax) * 100;
                const expensePct = (m.expense / barChartMax) * 100;

                return (
                  <div key={m.month} className="flex flex-col items-center gap-1.5">
                    <div className="flex items-end gap-1.5 h-36 w-12 justify-center">
                      {/* Income bar */}
                      <div
                        className="w-4 rounded-t-sm bg-brand cursor-pointer transition-all hover:brightness-95 hover:scale-x-105"
                        style={{ height: `${Math.max(2, incomePct)}%` }}
                        onMouseEnter={() => setHoveredBar({ month: m.label, type: "income", amount: m.income })}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                      {/* Expense bar */}
                      <div
                        className="w-4 rounded-t-sm bg-cyan-dark cursor-pointer transition-all hover:brightness-95 hover:scale-x-105"
                        style={{ height: `${Math.max(2, expensePct)}%` }}
                        onMouseEnter={() => setHoveredBar({ month: m.label, type: "expense", amount: m.expense })}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted mt-1">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Tooltip Overlay */}
            {hoveredBar && (
              <div className="absolute top-2 right-2 rounded-input bg-surface border border-line shadow-pop p-2 text-xs">
                <p className="font-semibold text-content uppercase tracking-wider text-[10px]">{hoveredBar.month}</p>
                <p className="text-muted mt-0.5">
                  {hoveredBar.type === "income" ? "Receitas: " : "Despesas: "}
                  <strong className={hoveredBar.type === "income" ? "text-success" : "text-danger"}>
                    {formatBRL(hoveredBar.amount)}
                  </strong>
                </p>
              </div>
            )}

            {/* Chart Legend */}
            <div className="flex justify-center gap-6 text-xs font-medium border-t border-line/40 pt-2.5">
              <span className="inline-flex items-center gap-1.5 text-muted">
                <span className="size-2.5 rounded-sm bg-brand" /> Receitas
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted">
                <span className="size-2.5 rounded-sm bg-cyan-dark" /> Despesas
              </span>
            </div>
          </div>
        </Card>

        {/* Categoria Donut (Mês Atual) */}
        <Card>
          <CardTitle className="mb-4 text-base font-semibold">Gastos por Categoria (Mês Atual)</CardTitle>
          {expensesByCategory.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm text-muted">
              Nenhuma despesa registrada neste mês.
            </div>
          ) : (
            <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
              {/* Donut SVG */}
              <div className="flex justify-center">
                <svg width="160" height="160" viewBox="0 0 100 100" className="rotate-[-90deg]">
                  {/* Empty base circle */}
                  <circle cx="50" cy="50" r="30" fill="transparent" stroke="var(--border)" strokeWidth="12" />

                  {/* Render segments */}
                  {donutSegments.map((seg, idx) => {
                    const color = FINANCE_CATEGORY_META[seg.category as keyof typeof FINANCE_CATEGORY_META]?.color ?? "var(--text-secondary)";
                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="30"
                        fill="transparent"
                        stroke={color}
                        strokeWidth="12"
                        strokeDasharray={`${seg.strokeLength} 188.495`}
                        strokeDashoffset={seg.strokeOffset}
                        strokeLinecap="butt"
                        className="transition-all duration-300"
                      >
                        <title>{`${seg.category}: ${seg.percentage}%`}</title>
                      </circle>
                    );
                  })}

                  {/* Hole text */}
                  <g transform="rotate(90 50 50)">
                    <text x="50" y="47" textAnchor="middle" className="fill-content font-bold text-[9px]">
                      Total Saídas
                    </text>
                    <text x="50" y="58" textAnchor="middle" className="fill-danger font-extrabold text-[8px]">
                      {formatBRL(monthlyTotals.expense)}
                    </text>
                  </g>
                </svg>
              </div>

              {/* Legends */}
              <div className="space-y-2.5">
                {expensesByCategory.slice(0, 5).map((seg) => {
                  const meta = FINANCE_CATEGORY_META[seg.category as keyof typeof FINANCE_CATEGORY_META];
                  const color = meta?.color ?? "var(--text-secondary)";
                  const label = meta?.label ?? seg.category;

                  return (
                    <div key={seg.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        <span className="truncate font-medium text-content">{label}</span>
                      </div>
                      <div className="flex gap-2 items-center text-right shrink-0">
                        <span className="font-semibold text-content">{formatBRL(seg.amount)}</span>
                        <span className="text-muted font-medium bg-panel px-1.5 py-0.5 rounded text-[10px]">
                          {seg.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Projeção + Últimas Movimentações */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Projeção */}
        <Card className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="size-5 text-brand" />
              <CardTitle className="text-base font-semibold">Projeção do Mês</CardTitle>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-4">
              Com base no seu padrão dos últimos 3 meses, a estimativa esperada para este mês é:
            </p>

            <div className="space-y-3">
              <div className="flex justify-between border-b border-line pb-2">
                <span className="text-xs font-medium text-muted">Receitas Esperadas</span>
                <span className="text-xs font-bold text-success">+{formatBRL(projection.avgIncome)}</span>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <span className="text-xs font-medium text-muted">Despesas Esperadas</span>
                <span className="text-xs font-bold text-danger">-{formatBRL(projection.avgExpense)}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-xs font-medium text-muted">Saldo Projetado</span>
                <span
                  className={`text-xs font-bold ${projection.projectedBalance >= 0 ? "text-success" : "text-danger"}`}
                >
                  {formatBRL(projection.projectedBalance)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-input bg-panel/60 border border-line p-3 flex gap-2.5 items-start">
            <Info className="size-4 shrink-0 text-brand mt-0.5" />
            <p className="text-[11px] text-muted leading-relaxed">
              Média baseada no histórico. Controlar despesas fixas aumenta o saldo líquido projetado.
            </p>
          </div>
        </Card>

        {/* Últimas Movimentações */}
        <Card className="lg:col-span-2">
          <CardTitle className="mb-4 text-base font-semibold">Últimos Lançamentos</CardTitle>
          {recentTransactions.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted">
              Nenhuma transação lançada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-muted uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 font-semibold">Data</th>
                    <th className="py-2.5 font-semibold">Descrição</th>
                    <th className="py-2.5 font-semibold">Categoria</th>
                    <th className="py-2.5 text-right font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {recentTransactions.map((e) => {
                    const isIncome = e.type === "income";
                    const meta = FINANCE_CATEGORY_META[e.category as keyof typeof FINANCE_CATEGORY_META];
                    const label = meta?.label ?? e.category;
                    const color = meta?.color ?? "var(--text-secondary)";

                    return (
                      <tr key={e.id} className="hover:bg-panel/40">
                        <td className="py-3 text-muted font-medium">{formatDate(e.date)}</td>
                        <td className="py-3 font-semibold text-content truncate max-w-[150px]">
                          {e.description}
                          {e.isRecurring && (
                            <Badge className="ml-1.5 text-[9px]" color="var(--brand-purple)">
                              Fixa
                            </Badge>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1.5 font-medium text-muted">
                            <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                            {label}
                          </span>
                        </td>
                        <td className={`py-3 text-right font-bold ${isIncome ? "text-success" : "text-danger"}`}>
                          {isIncome ? "+" : "-"}
                          {formatBRL(e.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
