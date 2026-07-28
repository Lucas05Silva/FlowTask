"use client";

import { useMemo } from "react";
import { ExternalLink, LineChart as LineChartIcon, PieChart as PieChartIcon } from "lucide-react";
import type { Investment, PatrimonySnapshot, InvestmentType } from "@/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatBRL } from "@/lib/utils";
import { INVESTMENT_TYPE_META, REFERENCE_RATES } from "@/lib/investment-calculator";

interface InvestmentOverviewProps {
  investments: Investment[];
  snapshots: PatrimonySnapshot[];
  totalInvested: number;
  totalCurrent: number;
}

const MONTH_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const monthShortLabel = (ym: string) => MONTH_SHORT[parseInt(ym.slice(5, 7), 10) - 1] ?? ym;

export function InvestmentOverview({
  investments,
  snapshots,
  totalInvested,
  totalCurrent,
}: InvestmentOverviewProps) {
  /* --- Evolution series (append current live totals as the latest point) --- */
  const series = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const points = snapshots.map((s) => ({
      month: s.month,
      invested: s.totalInvested,
      current: s.totalCurrent,
    }));
    // Ensure the current month reflects live totals.
    const idx = points.findIndex((p) => p.month === currentMonth);
    if (idx >= 0) points[idx] = { month: currentMonth, invested: totalInvested, current: totalCurrent };
    else if (investments.length > 0)
      points.push({ month: currentMonth, invested: totalInvested, current: totalCurrent });
    return points.sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
  }, [snapshots, totalInvested, totalCurrent, investments.length]);

  const chart = useMemo(() => {
    if (series.length === 0) return null;
    const w = 520;
    const h = 180;
    const padX = 8;
    const padY = 12;
    const maxVal = Math.max(1, ...series.flatMap((p) => [p.invested, p.current]));
    const n = series.length;
    const x = (i: number) => (n === 1 ? w / 2 : padX + (i * (w - padX * 2)) / (n - 1));
    const y = (v: number) => h - padY - (v / maxVal) * (h - padY * 2);
    const toPath = (key: "invested" | "current") =>
      series.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(" ");
    return {
      w,
      h,
      maxVal,
      investedPath: toPath("invested"),
      currentPath: toPath("current"),
      points: series.map((p, i) => ({ ...p, cx: x(i), cyCurrent: y(p.current), cyInvested: y(p.invested) })),
    };
  }, [series]);

  /* --- Distribution by type --- */
  const distribution = useMemo(() => {
    const map = new Map<InvestmentType, number>();
    for (const inv of investments) map.set(inv.type, (map.get(inv.type) ?? 0) + inv.currentValue);
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    const circ = 2 * Math.PI * 30;
    let acc = 0;
    const segments = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, amount]) => {
        const percentage = total > 0 ? (amount / total) * 100 : 0;
        const strokeLength = (percentage / 100) * circ;
        const strokeOffset = circ - (acc / 100) * circ;
        acc += percentage;
        return { type, amount, percentage, strokeLength, strokeOffset };
      });
    return { segments, total, circ };
  }, [investments]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Evolution */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <LineChartIcon className="size-5 text-brand" />
            <CardTitle className="text-base">Evolução do patrimônio</CardTitle>
          </div>
          {!chart ? (
            <div className="flex h-52 items-center justify-center text-center text-sm text-muted">
              Volte mês que vem para ver sua evolução 📈
            </div>
          ) : (
            <>
              <svg viewBox={`0 0 ${chart.w} ${chart.h}`} className="h-52 w-full" preserveAspectRatio="none">
                {[0, 0.5, 1].map((r) => (
                  <line
                    key={r}
                    x1={0}
                    x2={chart.w}
                    y1={12 + r * (chart.h - 24)}
                    y2={12 + r * (chart.h - 24)}
                    stroke="var(--border)"
                    strokeWidth={1}
                  />
                ))}
                <path d={chart.investedPath} fill="none" stroke="var(--success)" strokeWidth={2} strokeDasharray="5 4" />
                <path d={chart.currentPath} fill="none" stroke="var(--brand-purple)" strokeWidth={2.5} />
                {chart.points.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.cx} cy={p.cyCurrent} r={3} fill="var(--brand-purple)" />
                    <title>{`${monthShortLabel(p.month)}: ${formatBRL(p.current)}`}</title>
                  </g>
                ))}
              </svg>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex gap-4 text-xs font-medium">
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <span className="h-0.5 w-3 rounded-full bg-success" /> Aportado
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <span className="h-0.5 w-3 rounded-full bg-brand" /> Valor atual
                  </span>
                </div>
                <div className="flex gap-3 text-[10px] uppercase tracking-wider text-muted">
                  {chart.points.map((p, i) => (
                    <span key={i}>{monthShortLabel(p.month)}</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Distribution donut */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <PieChartIcon className="size-5 text-brand" />
            <CardTitle className="text-base">Distribuição por tipo</CardTitle>
          </div>
          {distribution.total === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm text-muted">
              Cadastre investimentos para ver a distribuição.
            </div>
          ) : (
            <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
              <div className="flex justify-center">
                <svg width="160" height="160" viewBox="0 0 100 100" className="rotate-[-90deg]">
                  <circle cx="50" cy="50" r="30" fill="transparent" stroke="var(--border)" strokeWidth="12" />
                  {distribution.segments.map((seg) => (
                    <circle
                      key={seg.type}
                      cx="50"
                      cy="50"
                      r="30"
                      fill="transparent"
                      stroke={INVESTMENT_TYPE_META[seg.type].color}
                      strokeWidth="12"
                      strokeDasharray={`${seg.strokeLength} ${distribution.circ}`}
                      strokeDashoffset={seg.strokeOffset}
                      strokeLinecap="butt"
                    >
                      <title>{`${INVESTMENT_TYPE_META[seg.type].label}: ${seg.percentage.toFixed(0)}%`}</title>
                    </circle>
                  ))}
                  <g transform="rotate(90 50 50)">
                    <text x="50" y="47" textAnchor="middle" className="fill-content text-[8px] font-bold">
                      Patrimônio
                    </text>
                    <text x="50" y="58" textAnchor="middle" className="fill-brand text-[7px] font-extrabold">
                      {formatBRL(distribution.total)}
                    </text>
                  </g>
                </svg>
              </div>
              <div className="space-y-2.5">
                {distribution.segments.map((seg) => (
                  <div key={seg.type} className="flex items-center justify-between text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: INVESTMENT_TYPE_META[seg.type].color }}
                      />
                      <span className="truncate font-medium text-content">{INVESTMENT_TYPE_META[seg.type].label}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-right">
                      <span className="font-semibold text-content">{formatBRL(seg.amount)}</span>
                      <span className="rounded bg-panel px-1.5 py-0.5 text-[10px] font-medium text-muted">
                        {seg.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Reference rates */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Selic", value: REFERENCE_RATES.selic },
              { label: "IPCA", value: REFERENCE_RATES.ipca },
              { label: "CDI", value: REFERENCE_RATES.cdi },
            ].map((r) => (
              <div key={r.label} className="rounded-input border border-line bg-panel/40 px-4 py-2">
                <p className="text-[11px] font-medium text-muted">{r.label}</p>
                <p className="text-base font-bold text-content">
                  {r.value.toFixed(2).replace(".", ",")}% <span className="text-xs font-normal text-muted">a.a.</span>
                </p>
              </div>
            ))}
            <span className="self-center rounded-badge bg-panel px-2.5 py-1 text-[10px] font-medium text-muted">
              Estimativa
            </span>
          </div>
          <a
            href="https://www.tesourodireto.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 self-start text-xs font-semibold text-brand hover:underline sm:self-center"
          >
            Saiba mais <ExternalLink className="size-3.5" />
          </a>
        </div>
      </Card>
    </div>
  );
}
