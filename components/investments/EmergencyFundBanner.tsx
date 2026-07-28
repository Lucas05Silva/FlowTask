"use client";

import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { formatBRL, cn } from "@/lib/utils";

interface EmergencyFundBannerProps {
  total: number;
  target: number;
  active: boolean;
  fromFinance: boolean; // target derived from finance data
  manualMonthly: number;
  onManualMonthlyChange: (v: number) => void;
  onToggleFilter: () => void;
}

export function EmergencyFundBanner({
  total,
  target,
  active,
  fromFinance,
  manualMonthly,
  onManualMonthlyChange,
  onToggleFilter,
}: EmergencyFundBannerProps) {
  const pct = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;
  const color = pct >= 100 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)";
  const needsInput = target <= 0;

  return (
    <Card
      className={cn(
        "border-l-4 transition-shadow",
        active && "ring-2 ring-brand/40",
      )}
      style={{ borderLeftColor: color }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full"
            style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
          >
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-content">Reserva de Emergência</p>
            <p className="text-xl font-bold" style={{ color }}>
              {formatBRL(total)}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 sm:max-w-md">
          {needsInput ? (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Informe seu gasto mensal para calcular a meta (4×):
              </label>
              <CurrencyInput
                value={manualMonthly}
                onChange={onManualMonthlyChange}
                className="h-9 text-sm"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>
                  Meta: <span className="font-semibold text-content">{formatBRL(target)}</span>
                  {fromFinance && <span className="ml-1 opacity-70">(4× gasto mensal)</span>}
                </span>
                <span className="font-bold" style={{ color }}>
                  {pct}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-panel">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </>
          )}
          <button
            type="button"
            onClick={onToggleFilter}
            className="self-start text-[11px] font-semibold text-brand hover:underline"
          >
            {active ? "← Mostrar todos os investimentos" : "Ver investimentos da reserva →"}
          </button>
        </div>
      </div>
    </Card>
  );
}
