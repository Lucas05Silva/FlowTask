"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

interface EmptyPlanStateProps {
  userName: string;
  monthLabel: string;
  onStart: (income: number) => void;
}

export function EmptyPlanState({ userName, monthLabel, onStart }: EmptyPlanStateProps) {
  const [income, setIncome] = useState(0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-card border border-brand/20 bg-gradient-to-br from-brand/10 via-surface to-cyan/10 px-6 py-12 text-center shadow-soft sm:px-12"
    >
      <div className="mx-auto max-w-md">
        <p className="text-4xl">📋</p>
        <h2 className="mt-3 text-2xl font-bold text-content">Seu plano de {monthLabel}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Bem-vindo à Organização{userName ? `, ${userName}` : ""}! Este é o seu espaço pessoal para planejar cada real do
          seu mês.
        </p>
        <p className="mt-6 text-sm font-semibold text-content">Quanto você espera receber em {monthLabel}?</p>
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            onStart(income);
          }}
        >
          <CurrencyInput value={income} onChange={setIncome} aria-label="Receita planejada" className="text-lg font-bold" autoFocus />
          <Button type="submit" iconRight={ArrowRight} className="shrink-0 justify-center">
            Começar a planejar
          </Button>
        </form>
        <p className="mt-3 text-[11px] text-muted">Se você planejou o mês anterior, os itens são copiados para cá.</p>
      </div>
    </motion.section>
  );
}
