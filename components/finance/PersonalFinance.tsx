"use client";

import { useState } from "react";
import { Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Assignee, FinanceEntry } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FINANCE_CATEGORY_META } from "@/lib/constants";
import { formatBRL, formatDate, cn } from "@/lib/utils";
import { MonthYearFilter } from "./MonthYearFilter";
import { useAuth } from "@/components/providers/AuthProvider";
import { KNOWN_USERS } from "@/lib/data/initialState";

interface PersonalFinanceProps {
  lucasEntries: FinanceEntry[];
  thaianeEntries: FinanceEntry[];
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onCreate: (owner: Assignee) => void;
  onEdit: (entry: FinanceEntry) => void;
}

const PEOPLE: { owner: Assignee; name: string; emoji: string; color: string }[] = [
  { owner: "lucas", name: "Lucas", emoji: "💜", color: "var(--brand-purple)" },
  { owner: "thaiane", name: "Thaiane", emoji: "💙", color: "var(--brand-cyan-dark)" },
];

function PersonColumn({
  name,
  emoji,
  color,
  entries,
  canCreate,
  onCreate,
  onEdit,
}: {
  canCreate: boolean;
  name: string;
  emoji: string;
  color: string;
  entries: FinanceEntry[];
  onCreate: () => void;
  onEdit: (entry: FinanceEntry) => void;
}) {
  const balance = entries.reduce((s, e) => s + (e.type === "income" ? e.amount : -e.amount), 0);
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  return (
    <Card className="flex flex-col gap-4 border-t-4" style={{ borderTopColor: color }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-content">
            {emoji} {name}
          </h3>
          <p className="mt-2 text-xs font-medium text-muted">Saldo pessoal do mês</p>
          <p className={cn("text-2xl font-bold", balance >= 0 ? "text-success" : "text-danger")}>{formatBRL(balance)}</p>
        </div>
        {canCreate && (
          <Button size="sm" icon={Plus} onClick={onCreate}>
            Lançar
          </Button>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-input border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
          Nenhum lançamento pessoal neste mês.
        </p>
      ) : (
        <ul className="divide-y divide-line/60">
          {sorted.map((e) => {
            const isIncome = e.type === "income";
            const meta = FINANCE_CATEGORY_META[e.category as keyof typeof FINANCE_CATEGORY_META];
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onEdit(e)}
                  className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-panel/40"
                >
                  <span className={cn("grid size-7 shrink-0 place-items-center rounded-full", isIncome ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>
                    {isIncome ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-content">{e.description}</span>
                    <span className="text-[11px] text-muted">
                      {formatDate(e.date)} · {meta?.label ?? e.category}
                    </span>
                  </span>
                  <span className={cn("shrink-0 text-sm font-bold", isIncome ? "text-success" : "text-danger")}>
                    {isIncome ? "+" : "-"}
                    {formatBRL(e.amount)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function PersonalFinance({
  lucasEntries,
  thaianeEntries,
  month,
  year,
  onMonthChange,
  onYearChange,
  onCreate,
  onEdit,
}: PersonalFinanceProps) {
  // Mobile shows one person at a time; desktop shows both side by side.
  const { user } = useAuth();
  const me: Assignee | null = user?.id === KNOWN_USERS[0].id ? "lucas" : user?.id === KNOWN_USERS[1].id ? "thaiane" : null;
  const [mobileOwner, setMobileOwner] = useState<Assignee>(me ?? "lucas");
  const entriesFor = (owner: Assignee) => (owner === "lucas" ? lucasEntries : thaianeEntries);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthYearFilter month={month} year={year} onMonthChange={onMonthChange} onYearChange={onYearChange} />
        <p className="text-xs text-muted">Os dois veem tudo — cada um lança só na própria coluna.</p>
      </div>

      <div className="flex rounded-input bg-panel p-1 md:hidden">
        {PEOPLE.map((p) => (
          <button
            key={p.owner}
            type="button"
            onClick={() => setMobileOwner(p.owner)}
            className={cn(
              "flex-1 rounded-[6px] py-1.5 text-sm font-medium transition-all",
              mobileOwner === p.owner ? "bg-surface text-content shadow-soft font-semibold" : "text-muted",
            )}
          >
            {p.emoji} {p.name}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {PEOPLE.map((p) => (
          <div key={p.owner} className={cn(mobileOwner !== p.owner && "hidden md:block")}>
            <PersonColumn
              name={p.name}
              emoji={p.emoji}
              color={p.color}
              entries={entriesFor(p.owner)}
              canCreate={me === p.owner}
              onCreate={() => onCreate(p.owner)}
              onEdit={onEdit}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
