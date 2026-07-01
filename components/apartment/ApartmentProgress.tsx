"use client";

import { motion } from "framer-motion";
import { Card, CardTitle } from "@/components/ui/Card";
import { pct } from "@/lib/utils";

interface PriorityProgress {
  total: number;
  completed: number;
  percentage: number;
}

interface ApartmentProgressProps {
  total: number;
  completed: number;
  percentage: number;
  priorityBreakdown: Record<"essencial" | "importante" | "desejavel", PriorityProgress>;
}

export function ApartmentProgress({
  total,
  completed,
  percentage,
  priorityBreakdown,
}: ApartmentProgressProps) {
  const priorities = [
    { key: "essencial", label: "Essenciais", color: "var(--danger)" },
    { key: "importante", label: "Importantes", color: "var(--warning)" },
    { key: "desejavel", label: "Desejáveis", color: "var(--cat-pessoal)" },
  ] as const;

  return (
    <Card className="space-y-4 border-line bg-gradient-to-br from-panel/30 to-panel/70">
      <CardTitle className="text-sm font-semibold text-muted flex items-center justify-between">
        <span>Progresso Geral</span>
        <span className="font-bold text-content text-xs">
          {completed} de {total} itens ({percentage}%)
        </span>
      </CardTitle>

      {/* Main progress bar track */}
      <div className="relative h-4.5 w-full overflow-hidden rounded-full bg-surface border border-line/45">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 bg-brand rounded-full"
        />
      </div>

      {/* Breakdown by priority */}
      <div className="grid gap-4 sm:grid-cols-3 pt-2 text-xs">
        {priorities.map(({ key, label, color }) => {
          const stats = priorityBreakdown[key] || { total: 0, completed: 0, percentage: 0 };
          return (
            <div key={key} className="space-y-1.5 bg-surface/50 border border-line/30 rounded-input p-3">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-muted">{label}</span>
                <span className="text-content font-bold">
                  {stats.completed}/{stats.total} ({stats.percentage}%)
                </span>
              </div>

              {/* Mini track */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-panel">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.percentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{ backgroundColor: color }}
                  className="absolute inset-y-0 left-0 rounded-full"
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
