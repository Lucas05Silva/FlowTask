import type { FinanceEntry } from "@/types";

export interface MonthBucket {
  key: string; // yyyy-mm
  label: string; // "jun"
  income: number;
  expense: number;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_LABELS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Income/expense totals for the current calendar month. */
export function currentMonthTotals(entries: FinanceEntry[]): { income: number; expense: number; balance: number } {
  const now = new Date();
  const key = monthKey(now);
  let income = 0;
  let expense = 0;
  for (const e of entries) {
    if (monthKey(new Date(e.date)) !== key) continue;
    if (e.type === "income") income += e.amount;
    else expense += e.amount;
  }
  return { income, expense, balance: income - expense };
}

/** Buckets for the last `months` months (oldest → newest), for the bar chart. */
export function lastMonths(entries: FinanceEntry[], months = 6): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: monthKey(d), label: MONTH_LABELS[d.getMonth()], income: 0, expense: 0 });
  }
  const index = new Map(buckets.map((b) => [b.key, b]));
  for (const e of entries) {
    const b = index.get(monthKey(new Date(e.date)));
    if (!b) continue;
    if (e.type === "income") b.income += e.amount;
    else b.expense += e.amount;
  }
  return buckets;
}
