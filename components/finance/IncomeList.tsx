"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Calendar, Tag, Trash2, ArrowUpRight, DollarSign } from "lucide-react";
import type { FinanceEntry, FinanceCategory, IncomeCategory } from "@/types";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { MonthYearFilter } from "./MonthYearFilter";
import { formatBRL, formatDate } from "@/lib/utils";
import { INCOME_CATEGORY_META } from "@/lib/constants";

interface IncomeListProps {
  /** Already filtered by the shared month/year + visibility filter (FinancePage). */
  entries: FinanceEntry[];
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onCreateClick: () => void;
  onEditClick: (entry: FinanceEntry) => void;
  onDeleteClick: (id: string) => void;
}

export function IncomeList({
  entries,
  month,
  year,
  onMonthChange,
  onYearChange,
  onCreateClick,
  onEditClick,
  onDeleteClick,
}: IncomeListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Filters logic
  const filteredEntries = useMemo(() => {
    return entries
      .filter((e) => e.type === "income")
      .filter((e) => !selectedCategory || e.category === selectedCategory)
      .filter((e) => !searchQuery || e.description.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, selectedCategory, searchQuery]);

  const totalMonthlyIncome = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredEntries]);

  const categoryKeys = Object.keys(INCOME_CATEGORY_META) as IncomeCategory[];

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            placeholder="Pesquisar entrada..."
          />
        </div>

        {/* Month & Year (shared across tabs) */}
        <MonthYearFilter month={month} year={year} onMonthChange={onMonthChange} onYearChange={onYearChange} />

        {/* Category */}
        <Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-44"
        >
          <option value="">Todas categorias</option>
          {categoryKeys.map((cat) => (
            <option key={cat} value={cat}>
              {INCOME_CATEGORY_META[cat]?.label ?? cat}
            </option>
          ))}
        </Select>
      </Card>

      {/* Monthly Total banner */}
      <div className="flex items-center justify-between rounded-input bg-success/5 border border-success/15 px-4 py-3">
        <span className="text-sm font-semibold text-success flex items-center gap-1.5">
          <DollarSign className="size-4" /> Total de Entradas (Filtro)
        </span>
        <span className="text-lg font-bold text-success">{formatBRL(totalMonthlyIncome)}</span>
      </div>

      {/* Incomes list */}
      {filteredEntries.length === 0 ? (
        <EmptyState
          icon={ArrowUpRight}
          title="Nenhuma entrada registrada"
          description="Nenhuma movimentação registrada para os filtros selecionados. Comece adicionando sua primeira entrada! 💰"
          action={
            <Button size="sm" icon={Plus} onClick={onCreateClick}>
              Nova entrada
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredEntries.map((e) => {
            const meta = INCOME_CATEGORY_META[e.category as IncomeCategory];
            const label = meta?.label ?? e.category;
            const color = meta?.color ?? "var(--text-secondary)";

            return (
              <div
                key={e.id}
                onClick={() => onEditClick(e)}
                className="group flex cursor-pointer items-center justify-between rounded-card border border-line bg-surface p-4 transition-all hover:border-success/30 hover:shadow-soft"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Category circular icon */}
                  <span
                    className="grid size-10 place-items-center rounded-full text-white"
                    style={{ backgroundColor: color }}
                  >
                    <ArrowUpRight className="size-5" />
                  </span>

                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-content truncate group-hover:text-success transition-colors">
                      {e.description}
                    </h4>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(e.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="size-3" />
                        {label}
                      </span>
                      {e.isRecurring && <Badge color="var(--brand-purple)">Fixa</Badge>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-base font-bold text-success">+{formatBRL(e.amount)}</span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (confirm("Excluir esta entrada?")) onDeleteClick(e.id);
                    }}
                    className="grid size-9 place-items-center rounded-input text-muted opacity-0 group-hover:opacity-100 hover:bg-danger/10 hover:text-danger transition-all"
                    aria-label="Excluir entrada"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
