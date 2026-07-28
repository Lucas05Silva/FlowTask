"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Trophy, TrendingUp } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatBRL } from "@/lib/utils";
import {
  projectFutureValue,
  estimateMonthlyPassiveIncome,
  monthsToReach,
} from "@/lib/investment-calculator";

interface ProjectionTabProps {
  currentValue: number;
  suggestedRate: number;
}

function monthsLabel(months: number | null): string {
  if (months === null) return "além de 60 anos";
  if (months < 12) return `${months} ${months === 1 ? "mês" : "meses"}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${years} ${years === 1 ? "ano" : "anos"}` : `${years}a ${rem}m`;
}

export function ProjectionTab({ currentValue, suggestedRate }: ProjectionTabProps) {
  const [patrimony, setPatrimony] = useState(Math.round(currentValue));
  const [monthly, setMonthly] = useState(290);
  const [rate, setRate] = useState(Math.round(suggestedRate * 10) / 10 || 10.5);
  const [years, setYears] = useState(10);

  // Keep patrimony in sync when the portfolio value loads/changes.
  useEffect(() => {
    setPatrimony(Math.round(currentValue));
  }, [currentValue]);

  const result = useMemo(() => {
    const future = projectFutureValue(patrimony, monthly, rate, years);
    const totalContributed = patrimony + monthly * years * 12;
    const gain = future - totalContributed;
    return {
      future,
      totalContributed,
      gain,
      gainPct: totalContributed > 0 ? (gain / totalContributed) * 100 : 0,
      passive: estimateMonthlyPassiveIncome(future),
    };
  }, [patrimony, monthly, rate, years]);

  const yearlyBars = useMemo(() => {
    const bars: { year: number; contributed: number; gain: number; total: number }[] = [];
    for (let y = 1; y <= years; y++) {
      const total = projectFutureValue(patrimony, monthly, rate, y);
      const contributed = patrimony + monthly * y * 12;
      bars.push({ year: y, contributed, gain: Math.max(0, total - contributed), total });
    }
    return bars;
  }, [patrimony, monthly, rate, years]);

  const maxBar = Math.max(1, ...yearlyBars.map((b) => b.total));

  const milestones = useMemo(
    () => [
      { icon: "🏆", label: "Você atinge R$ 10.000", months: monthsToReach(patrimony, monthly, rate, 10000) },
      {
        icon: "🏆",
        label: "Renda passiva de R$ 1.000/mês",
        months: monthsToReach(patrimony, monthly, rate, (1000 * 12) / 0.04),
      },
      {
        icon: "🏆",
        label: "Liberdade financeira (R$ 2.500/mês passivo)",
        months: monthsToReach(patrimony, monthly, rate, (2500 * 12) / 0.04),
      },
    ],
    [patrimony, monthly, rate],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Calculator className="size-5 text-brand" />
            <CardTitle className="text-base">Simule seu futuro</CardTitle>
          </div>
          <div className="space-y-5">
            <SliderField
              label="Patrimônio atual"
              value={patrimony}
              min={0}
              max={Math.max(100000, Math.round(patrimony * 2))}
              step={100}
              onChange={setPatrimony}
              format={(v) => formatBRL(v)}
            />
            <SliderField
              label="Aporte mensal"
              value={monthly}
              min={0}
              max={5000}
              step={10}
              onChange={setMonthly}
              format={(v) => formatBRL(v)}
            />
            <SliderField
              label="Taxa anual estimada"
              value={rate}
              min={0}
              max={20}
              step={0.1}
              onChange={setRate}
              format={(v) => `${v.toFixed(1)}% a.a.`}
            />
            <SliderField
              label="Período"
              value={years}
              min={1}
              max={30}
              step={1}
              onChange={setYears}
              format={(v) => `${v} ${v === 1 ? "ano" : "anos"}`}
            />
          </div>
        </Card>

        {/* Outputs */}
        <Card className="flex flex-col justify-center bg-gradient-to-br from-brand/5 to-cyan/5">
          <p className="text-sm text-muted">
            Em {years} {years === 1 ? "ano" : "anos"} você terá:
          </p>
          <p className="mt-1 text-4xl font-bold text-brand-dark dark:text-brand-light">{formatBRL(result.future)}</p>

          <div className="mt-5 space-y-2.5">
            <Row label="Total aportado" value={formatBRL(result.totalContributed)} />
            <Row
              label="Rendimento"
              value={`+${formatBRL(result.gain)}  (+${result.gainPct.toFixed(0)}%)`}
              accent="text-success"
            />
            <Row label="Renda passiva estimada" value={`~ ${formatBRL(result.passive)}/mês`} accent="text-brand" />
          </div>
          <p className="mt-4 text-[11px] text-muted">Estimativa pela regra dos 4% ao ano.</p>
        </Card>
      </div>

      {/* Stacked bar chart */}
      <Card>
        <CardTitle className="mb-4 text-base">Evolução ano a ano</CardTitle>
        <div className="flex h-56 items-end gap-1.5 overflow-x-auto pb-2">
          {yearlyBars.map((b) => (
            <div key={b.year} className="flex min-w-[26px] flex-1 flex-col items-center gap-1">
              <div className="flex h-44 w-full max-w-[38px] flex-col justify-end" title={formatBRL(b.total)}>
                <div
                  className="w-full rounded-t-sm bg-brand"
                  style={{ height: `${(b.gain / maxBar) * 100}%` }}
                />
                <div
                  className="w-full bg-cyan-dark"
                  style={{ height: `${(b.contributed / maxBar) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-muted">{b.year}º</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center gap-6 border-t border-line/40 pt-3 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 text-muted">
            <span className="size-2.5 rounded-sm bg-cyan-dark" /> Aportado
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted">
            <span className="size-2.5 rounded-sm bg-brand" /> Rendimento
          </span>
        </div>
      </Card>

      {/* Milestones */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="size-5 text-amber-500" />
          <CardTitle className="text-base">Seus marcos</CardTitle>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {milestones.map((m) => (
            <div key={m.label} className="rounded-input border border-line bg-panel/40 p-3">
              <p className="text-sm font-medium text-content">{m.label}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <TrendingUp className="size-3.5 text-success" /> em {monthsLabel(m.months)}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line/50 pb-2 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-sm font-bold ${accent ?? "text-content"}`}>{value}</span>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-content">{label}</label>
        <span className="text-sm font-bold text-brand">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-panel accent-[var(--brand-purple)]"
        aria-label={label}
      />
    </div>
  );
}
