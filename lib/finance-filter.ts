/**
 * Shared month/year + owner (visibility) filter helpers for the Financeiro
 * module — deduplicates what used to be copy-pasted local state inside
 * IncomeList.tsx and ExpenseList.tsx (Ajuste 1 + 3).
 */
import type { FinanceEntry } from "@/types";

export const MONTHS: { val: number; label: string }[] = [
  { val: 1, label: "Janeiro" },
  { val: 2, label: "Fevereiro" },
  { val: 3, label: "Março" },
  { val: 4, label: "Abril" },
  { val: 5, label: "Maio" },
  { val: 6, label: "Junho" },
  { val: 7, label: "Julho" },
  { val: 8, label: "Agosto" },
  { val: 9, label: "Setembro" },
  { val: 10, label: "Outubro" },
  { val: 11, label: "Novembro" },
  { val: 12, label: "Dezembro" },
];

export const YEARS = [2024, 2025, 2026, 2027];

export function monthLabel(month: number): string {
  return MONTHS.find((m) => m.val === month)?.label ?? "";
}

/** Who's lançamentos to show on Visão Geral / Entradas / Saídas. */
export type OwnerFilter = "compartilhado" | "lucas" | "thaiane" | "tudo";

export const OWNER_FILTER_OPTIONS: { value: OwnerFilter; label: string }[] = [
  { value: "compartilhado", label: "Compartilhado" },
  { value: "lucas", label: "Lucas" },
  { value: "thaiane", label: "Thaiane" },
  { value: "tudo", label: "Tudo" },
];

export function matchesOwnerFilter(entry: FinanceEntry, filter: OwnerFilter): boolean {
  if (filter === "tudo") return true;
  if (filter === "compartilhado") return entry.owner == null;
  return entry.owner === filter;
}
