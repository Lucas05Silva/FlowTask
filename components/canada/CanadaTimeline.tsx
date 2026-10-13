"use client";

import { Calendar } from "lucide-react";
import type { CanadaDecision } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, cn } from "@/lib/utils";
import type { CanadaProgress } from "@/hooks/useCanada";

interface CanadaTimelineProps {
  targetDepartureDate: string | null;
  progress: CanadaProgress;
  financialPct: number;
  decisions: CanadaDecision[];
}

type MilestoneStatus = "concluido" | "andamento" | "pendente";

const STATUS_STYLE: Record<MilestoneStatus, string> = {
  concluido: "border-success bg-success text-white",
  andamento: "border-warning bg-warning text-white",
  pendente: "border-line bg-surface text-muted",
};

export function CanadaTimeline({ targetDepartureDate, progress, financialPct, decisions }: CanadaTimelineProps) {
  if (!targetDepartureDate) {
    return (
      <EmptyState
        icon={Calendar}
        title="Configure sua data alvo na aba Decisões"
        description="Responda 'Qual nossa data alvo de partida?' para ver a timeline da jornada."
      />
    );
  }

  const departure = new Date(targetDepartureDate);
  const today = new Date();
  const addMonths = (d: Date, n: number) => {
    const copy = new Date(d);
    copy.setMonth(copy.getMonth() + n);
    return copy;
  };

  const visaDecided = decisions.some((d) => d.category === "visto" && d.status === "decidido");

  const milestones: { label: string; date: Date; done: boolean }[] = [
    { label: "Decisões tomadas", date: today, done: progress.decisions.pct === 100 },
    { label: "Documentos prontos", date: addMonths(departure, -12), done: progress.documents.pct === 100 },
    { label: "Reserva atingida", date: addMonths(departure, -6), done: financialPct >= 100 },
    { label: "Visto aprovado", date: addMonths(departure, -3), done: visaDecided },
    { label: "🍁 Canadá!", date: departure, done: false },
  ];

  const statusOf = (m: (typeof milestones)[number]): MilestoneStatus => {
    if (m.done) return "concluido";
    if (m.date.getTime() <= today.getTime()) return "andamento";
    return "pendente";
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Partida planejada para{" "}
        <span className="font-semibold text-content">{formatDate(targetDepartureDate, { day: "2-digit", month: "long", year: "numeric" })}</span>
        .
      </p>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[640px] items-start justify-between gap-2 px-2">
          {milestones.map((m, i) => {
            const status = statusOf(m);
            return (
              <div key={m.label} className="relative flex flex-1 flex-col items-center text-center">
                {i < milestones.length - 1 && (
                  <div
                    className="absolute left-1/2 top-3 h-0.5 w-full -translate-y-1/2"
                    style={{ backgroundColor: "var(--border)" }}
                  />
                )}
                <span className="mb-1.5 text-[11px] font-medium text-muted">{formatDate(m.date.toISOString())}</span>
                <span
                  className={cn("relative z-10 grid size-6 place-items-center rounded-full border-2 text-[10px] font-bold", STATUS_STYLE[status])}
                >
                  {status === "concluido" ? "✓" : ""}
                </span>
                <span className="mt-1.5 max-w-[110px] text-xs font-semibold text-content">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
