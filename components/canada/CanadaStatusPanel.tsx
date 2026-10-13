"use client";

import { HelpCircle, FileCheck, DollarSign, MapPin } from "lucide-react";
import { GoalProgress } from "@/components/goals/GoalProgress";
import { formatDate, pct } from "@/lib/utils";
import type { CanadaProgress } from "@/hooks/useCanada";

interface CanadaStatusPanelProps {
  progress: CanadaProgress;
  financial: { current: number; target: number };
  targetDepartureDate: string | null;
}

export function CanadaStatusPanel({ progress, financial, targetDepartureDate }: CanadaStatusPanelProps) {
  const financialPct = pct(financial.current, financial.target);
  const overall = Math.round((progress.decisions.pct + progress.documents.pct + financialPct + progress.checklist.pct) / 4);

  const blocks = [
    {
      label: "Decisões",
      value: `${progress.decisions.done}/${progress.decisions.total}`,
      pct: progress.decisions.pct,
      icon: HelpCircle,
      color: "var(--brand-purple)",
    },
    {
      label: "Documentos",
      value: `${progress.documents.done}/${progress.documents.total}`,
      pct: progress.documents.pct,
      icon: FileCheck,
      color: "var(--brand-cyan-dark)",
    },
    {
      label: "Financeiro",
      value: `${financialPct}%`,
      pct: financialPct,
      icon: DollarSign,
      color: "var(--success)",
    },
    {
      label: "Logística",
      value: `${progress.checklist.done}/${progress.checklist.total}`,
      pct: progress.checklist.pct,
      icon: MapPin,
      color: "#D52B1E",
    },
  ];

  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-content sm:text-3xl">
            🍁 Canadá
          </h1>
          <p className="mt-1 text-sm text-muted">Sua jornada começa aqui.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-muted">Progresso geral</p>
          <p className="text-2xl font-bold text-content">{overall}%</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {blocks.map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.label} className="rounded-input bg-panel/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                  <Icon className="size-3.5" style={{ color: b.color }} aria-hidden />
                  {b.label}
                </span>
                <span className="text-xs font-bold text-content">{b.value}</span>
              </div>
              <div className="mt-2">
                <GoalProgress current={b.pct} target={100} color={b.color} size="sm" />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-muted">
        Data alvo:{" "}
        <span className="font-medium text-content">
          {targetDepartureDate ? formatDate(targetDepartureDate, { day: "2-digit", month: "long", year: "numeric" }) : "não definida ainda"}
        </span>
      </p>
    </div>
  );
}
