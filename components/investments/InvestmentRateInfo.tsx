"use client";

import { useState } from "react";
import { Info, ChevronDown } from "lucide-react";
import { COPOM_INFO } from "@/lib/investment-calculator";
import { formatDate, cn } from "@/lib/utils";

/**
 * Compact, page-level banner with the current Selic/COPOM context.
 * Click to expand a short explanation of what the Selic rate means.
 */
export function InvestmentRateInfo() {
  const [open, setOpen] = useState(false);
  const selic = COPOM_INFO.selicRate.toFixed(2).replace(".", ",");

  return (
    <div className="rounded-card border border-brand/20 bg-brand/10 px-4 py-2.5 text-xs text-content">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <Info className="size-4 shrink-0 text-brand" aria-hidden />
        <span className="flex-1">
          <strong className="font-semibold">Taxa Selic: {selic}% a.a.</strong>{" "}
          <span className="text-muted">
            (desde {formatDate(COPOM_INFO.setAt)}) · Próxima reunião do Copom:{" "}
            <strong className="font-semibold text-content">{formatDate(COPOM_INFO.nextMeeting)}</strong>
          </span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <p className="mt-2 border-t border-brand/15 pt-2 leading-relaxed text-muted">
          A <strong className="text-content">Selic</strong> é a taxa básica de juros da economia, definida a cada ~45
          dias pelo Copom (Comitê de Política Monetária do Banco Central). Ela baliza o rendimento da renda fixa:
          Tesouro Selic e a maioria dos CDBs rendem próximos a ela. Quando a Selic sobe, seus investimentos
          conservadores rendem mais; quando cai, rendem menos.
        </p>
      )}
    </div>
  );
}
