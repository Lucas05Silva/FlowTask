"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type { Distribution } from "@/lib/organizacao";
import { formatBRL, cn } from "@/lib/utils";

interface MonthOverviewProps {
  income: number;
  distribution: Distribution;
  hasItems: boolean;
  readOnly: boolean;
  onIncomeChange: (value: number) => void;
}

export function MonthOverview({ income, distribution: d, hasItems, readOnly, onIncomeChange }: MonthOverviewProps) {
  // Local draft so typing doesn't write on every keystroke — saved on blur.
  const [draft, setDraft] = useState(income);
  const [syncedIncome, setSyncedIncome] = useState(income);
  if (syncedIncome !== income) {
    // Income changed elsewhere (another device / month switch) — resync the draft.
    setSyncedIncome(income);
    setDraft(income);
  }

  const overBudget = d.livre < 0;
  const planned = hasItems && !overBudget && d.comprometido + d.poupado > 0;

  const cards = [
    { emoji: "📌", label: "Comprometido", value: d.comprometido, hint: `${d.pctComprometido}% da receita`, color: "var(--brand-purple)" },
    {
      emoji: overBudget ? "⚠️" : "✅",
      label: "Livre",
      value: d.livre,
      hint: overBudget ? "Passou da receita" : `${d.pctLivre}% da receita`,
      color: overBudget ? "var(--danger)" : "var(--text-secondary)",
    },
    { emoji: "🌱", label: "Poupado", value: d.poupado, hint: `${d.pctPoupado}% da receita`, color: "var(--success)" },
  ];

  return (
    <section aria-labelledby="org-month" className="space-y-4">
      <h2 id="org-month" className="text-xs font-bold uppercase tracking-widest text-muted">
        Visão do mês
      </h2>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Receita planejada — editable */}
        <Card className="col-span-2 flex flex-col gap-1.5 border-brand/30 lg:col-span-1">
          <span className="text-xs font-medium text-muted">💰 Receita planejada</span>
          {readOnly ? (
            <p className="text-2xl font-bold text-content">{formatBRL(income)}</p>
          ) : (
            <CurrencyInput
              value={draft}
              onChange={setDraft}
              onBlur={() => draft !== income && onIncomeChange(draft)}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              aria-label="Receita planejada do mês"
              className="h-10 border-transparent bg-panel/50 px-2 text-xl font-bold hover:border-line"
            />
          )}
          <span className="text-[11px] text-muted">o que você espera receber</span>
        </Card>

        {cards.map((c) => (
          <Card key={c.label} className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">
              {c.emoji} {c.label}
            </span>
            <p className="text-2xl font-bold tabular-nums" style={{ color: c.label === "Livre" ? undefined : c.color }}>
              <span className={cn(c.label === "Livre" && (overBudget ? "text-danger" : "text-content"))}>{formatBRL(c.value)}</span>
            </p>
            <span className="text-[11px] text-muted">{c.hint}</span>
          </Card>
        ))}
      </div>

      {/* Distribution bar — the month's 100% */}
      <div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-panel" role="img" aria-label={`${d.pctComprometido}% contas, ${d.pctPoupado}% poupança, ${d.pctLivre}% livre`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, d.pctComprometido)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-brand"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100 - Math.min(100, d.pctComprometido), d.pctPoupado)}%` }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="h-full bg-success"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-brand" />{d.pctComprometido}% contas</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-success" />{d.pctPoupado}% poupança</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-panel ring-1 ring-line" />{d.pctLivre}% livre</span>
        </div>
      </div>

      {planned && !readOnly && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-input bg-brand/10 px-4 py-2.5 text-sm font-medium text-brand-dark dark:text-brand-light"
        >
          Mês planejado! Agora é só executar 💜
        </motion.p>
      )}
      {overBudget && (
        <p className="rounded-input bg-danger/10 px-4 py-2.5 text-sm font-medium text-danger">
          O planejado passou da receita em {formatBRL(Math.abs(d.livre))}. Vale revisar algum item.
        </p>
      )}
    </section>
  );
}
