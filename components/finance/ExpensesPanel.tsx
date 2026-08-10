"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, CalendarClock, ChevronDown, ArrowRight } from "lucide-react";
import type { MonthlyExpense, MonthlyExpenseCategory } from "@/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { useMonthlyExpenses, daysUntilDueDay } from "@/hooks/useMonthlyExpenses";
import { useGamification } from "@/components/providers/GamificationProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { ExpenseModal } from "./ExpenseModal";
import { EXPENSE_CATEGORY_META } from "./expenseMeta";
import { formatBRL, cn } from "@/lib/utils";

type SortBy = "vencimento" | "valor";

interface ExpensesPanelProps {
  /** Fixed income available for bills — colours the "due this week" widget. */
  availableIncome: number;
}

function dueBadge(dueDay: number | null | undefined) {
  const d = daysUntilDueDay(dueDay);
  if (d === null) return null;
  if (d <= 1) return { color: "var(--danger)", label: d === 0 ? "Vence hoje" : "Vence amanhã" };
  if (d <= 7) return { color: "var(--warning)", label: `Vence em ${d}d` };
  return { color: "var(--text-secondary)", label: `dia ${dueDay}` };
}

export function ExpensesPanel({ availableIncome }: ExpensesPanelProps) {
  const {
    recurringExpenses,
    getTotalExpenses,
    getExpensesByCategory,
    getExpensesDueThisWeek,
    addExpense,
    updateExpense,
    removeExpense,
    advanceInstallment,
  } = useMonthlyExpenses();
  const { celebrate } = useGamification();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MonthlyExpense | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dueOpen, setDueOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"todos" | MonthlyExpenseCategory>("todos");
  const [sortBy, setSortBy] = useState<SortBy>("vencimento");

  const total = getTotalExpenses();
  const byCategory = getExpensesByCategory();
  const dueThisWeek = getExpensesDueThisWeek();
  const dueTotal = dueThisWeek.reduce((s, e) => s + e.amount, 0);
  const dueFits = dueTotal <= availableIncome;

  const filtered = useMemo(() => {
    let list = categoryFilter === "todos" ? recurringExpenses : recurringExpenses.filter((e) => e.category === categoryFilter);
    list = [...list].sort((a, b) => {
      if (sortBy === "valor") return b.amount - a.amount;
      const da = daysUntilDueDay(a.dueDay);
      const db = daysUntilDueDay(b.dueDay);
      return (da ?? 999) - (db ?? 999);
    });
    return list;
  }, [recurringExpenses, categoryFilter, sortBy]);

  const groups = useMemo(() => {
    const today: MonthlyExpense[] = [];
    const week: MonthlyExpense[] = [];
    const rest: MonthlyExpense[] = [];
    for (const e of filtered) {
      const d = daysUntilDueDay(e.dueDay);
      if (d === 0) today.push(e);
      else if (d !== null && d <= 7) week.push(e);
      else rest.push(e);
    }
    return [
      { key: "today", label: "⚠ Vence hoje", items: today },
      { key: "week", label: "Próximos 7 dias", items: week },
      { key: "rest", label: "Restante do mês", items: rest },
    ].filter((g) => g.items.length > 0);
  }, [filtered]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (e: MonthlyExpense) => {
    setEditing(e);
    setModalOpen(true);
  };
  const handleCreate = (form: Parameters<typeof addExpense>[0]) => {
    const res = addExpense(form);
    if (res) celebrate(res);
  };
  const handleAdvance = (e: MonthlyExpense) => {
    const { celebration, quitadoName } = advanceInstallment(e.id);
    if (quitadoName) toast({ variant: "success", title: `🎉 ${quitadoName} quitado!`, description: "Dívida parcelada concluída." });
    if (celebration) celebrate(celebration, { big: true });
  };

  return (
    <>
      <Card>
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Meus Gastos Mensais</CardTitle>
            <p className="text-sm font-bold text-content">{formatBRL(total)}/mês</p>
          </div>
          <Button size="sm" icon={Plus} onClick={openCreate}>
            Adicionar
          </Button>
        </div>

        {/* Due-this-week alert */}
        {dueThisWeek.length > 0 && (
          <div
            className="mb-4 rounded-input border p-3"
            style={{
              borderColor: dueFits ? "var(--warning)" : "var(--danger)",
              backgroundColor: `color-mix(in srgb, ${dueFits ? "var(--warning)" : "var(--danger)"} 8%, transparent)`,
            }}
          >
            <button
              type="button"
              onClick={() => setDueOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-content">
                <CalendarClock className="size-4" style={{ color: dueFits ? "var(--warning)" : "var(--danger)" }} />
                {dueThisWeek.length} {dueThisWeek.length === 1 ? "conta vence" : "contas vencem"} nos próximos 7 dias
              </span>
              <span className="flex items-center gap-2 text-xs text-muted">
                Total: <strong className="text-content">{formatBRL(dueTotal)}</strong>
                <ChevronDown className={cn("size-4 transition-transform", dueOpen && "rotate-180")} />
              </span>
            </button>
            {dueOpen && (
              <div className="mt-2 space-y-1 border-t border-line/60 pt-2">
                {dueThisWeek.map((e) => (
                  <div key={e.id} className="flex justify-between text-xs">
                    <span className="text-muted">
                      {e.name} · dia {e.dueDay}
                    </span>
                    <span className="font-semibold text-content">{formatBRL(e.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="mb-3 flex flex-wrap gap-2">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
            className="h-8 w-auto min-w-[130px] text-xs"
          >
            <option value="todos">Todas categorias</option>
            {byCategory.map((c) => (
              <option key={c.category} value={c.category}>
                {EXPENSE_CATEGORY_META[c.category].label}
              </option>
            ))}
          </Select>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="h-8 w-auto min-w-[130px] text-xs"
          >
            <option value="vencimento">Ordenar: Vencimento</option>
            <option value="valor">Ordenar: Valor</option>
          </Select>
        </div>

        {/* Grouped list */}
        {recurringExpenses.length === 0 ? (
          <p className="rounded-input border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
            Nenhum gasto cadastrado. Clique em “Adicionar”.
          </p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.key}>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">{group.label}</p>
                <div className="space-y-1.5">
                  {group.items.map((e) => {
                    const meta = EXPENSE_CATEGORY_META[e.category];
                    const Icon = meta.icon;
                    const badge = dueBadge(e.dueDay);
                    const parceled = e.recurrence === "parcelado" && e.installmentsTotal;
                    return (
                      <div key={e.id} className="rounded-input border border-line p-2.5">
                        <div className="flex items-center gap-3">
                          <span
                            className="grid size-8 shrink-0 place-items-center rounded-full"
                            style={{ backgroundColor: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
                          >
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-content">{e.name}</p>
                            <span className="text-[11px] text-muted">{meta.label}</span>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-bold text-content">{formatBRL(e.amount)}</p>
                            {badge && (
                              <span className="text-[10px] font-semibold" style={{ color: badge.color }}>
                                {badge.label}
                              </span>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => openEdit(e)}
                              aria-label="Editar gasto"
                              className="rounded-input p-1.5 text-muted transition-colors hover:bg-panel hover:text-content"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            {confirmId === e.id ? (
                              <button
                                type="button"
                                onClick={() => {
                                  removeExpense(e.id);
                                  setConfirmId(null);
                                }}
                                className="rounded-input bg-danger/10 px-1.5 py-1 text-[10px] font-bold text-danger"
                              >
                                Excluir?
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmId(e.id)}
                                aria-label="Excluir gasto"
                                className="rounded-input p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {parceled && (
                          <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2">
                            <span className="text-[11px] font-medium text-muted">
                              Parcela {e.installmentsPaid}/{e.installmentsTotal}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdvance(e)}
                              className="inline-flex items-center gap-1 rounded-input px-2 py-0.5 text-[11px] font-semibold text-brand transition-colors hover:bg-brand/10"
                            >
                              Avançar parcela <ArrowRight className="size-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="flex items-center justify-between border-t border-line pt-3">
              <span className="text-sm font-medium text-muted">Total mensal</span>
              <span className="text-sm font-bold text-content">{formatBRL(total)}</span>
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {byCategory.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Distribuição por categoria</p>
            <div className="space-y-2.5">
              {byCategory.map((c) => {
                const meta = EXPENSE_CATEGORY_META[c.category];
                return (
                  <div key={c.category} className="flex items-center gap-3 text-xs">
                    <span className="w-24 shrink-0 truncate font-medium text-content">{meta.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel">
                      <div className="h-full rounded-full" style={{ width: `${c.percentage}%`, backgroundColor: meta.color }} />
                    </div>
                    <span className="w-8 shrink-0 text-right font-semibold text-muted">{c.percentage}%</span>
                    <span className="w-20 shrink-0 text-right font-bold text-content">{formatBRL(c.amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <ExpenseModal
        open={modalOpen}
        expense={editing}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
        onUpdate={updateExpense}
        onDelete={removeExpense}
      />
    </>
  );
}
