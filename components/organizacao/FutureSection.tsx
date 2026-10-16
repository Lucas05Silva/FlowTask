"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { dreamEmoji, monthName, type GoalProjection } from "@/lib/organizacao";
import { formatBRL, cn } from "@/lib/utils";

interface FutureSectionProps {
  avgMonthlySavings: number;
  projections: GoalProjection[];
  history: { month: number; year: number; total: number }[];
  /** Dreams block (DreamsSection), rendered under the projection + chart. */
  children?: ReactNode;
}

/* ---- 3.1 Projeção ----------------------------------------------------------- */
function ProjectionCard({ avg, projections }: { avg: number; projections: GoalProjection[] }) {
  const open = projections.filter((p) => p.remaining > 0);
  // The biggest dream drives the advice line (usually the Canadá).
  const focus = open[0];

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold text-content">📊 Se continuar assim…</h3>
        <p className="mt-1 text-sm text-muted">
          Economia média/mês (últimos 3 meses):{" "}
          <strong className={cn(avg > 0 ? "text-success" : "text-danger")}>{formatBRL(avg)}</strong>
        </p>
      </div>

      {open.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma meta financeira em aberto. Que tal criar um sonho novo? ✨</p>
      ) : avg <= 0 ? (
        <p className="rounded-input bg-warning/10 px-3 py-2 text-sm text-warning">
          Sem economia positiva nos últimos 3 meses — registre entradas e saídas no Financeiro para ver os prazos.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {open.slice(0, 5).map((p) => (
            <li key={p.goal.id} className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="min-w-0 text-content">
                {dreamEmoji(p.goal)} {p.goal.title}{" "}
                <span className="text-xs text-muted">(faltam {formatBRL(p.remaining)})</span>
              </span>
              <span className="font-semibold text-content">
                → em {p.months} {p.months === 1 ? "mês" : "meses"}{" "}
                <span className="font-normal text-muted">({p.dateLabel})</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {focus && avg > 0 && focus.months !== null && (focus.monthsSavedWith300 || focus.extraFor3MonthsEarlier) && (
        <p className="rounded-input bg-brand/10 px-3 py-2.5 text-xs leading-relaxed text-brand-dark dark:text-brand-light">
          {dreamEmoji(focus.goal)} No ritmo atual, {focus.goal.title} chega em {focus.dateLabel}.
          {focus.monthsSavedWith300 ? ` Poupar R$ 300/mês a mais anteciparia em ${focus.monthsSavedWith300} ${focus.monthsSavedWith300 === 1 ? "mês" : "meses"}.` : ""}
          {focus.extraFor3MonthsEarlier ? ` Para chegar 3 meses antes: +${formatBRL(focus.extraFor3MonthsEarlier)}/mês.` : ""}
        </p>
      )}
    </Card>
  );
}

/* ---- 3.3 Patrimônio --------------------------------------------------------- */
function PatrimonyChart({ history }: { history: FutureSectionProps["history"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 600;
  const H = 180;
  const PAD = { l: 8, r: 8, t: 16, b: 24 };
  const max = Math.max(1, ...history.map((h) => h.total)) * 1.1;
  const n = history.length;
  const x = (i: number) => (n === 1 ? W / 2 : PAD.l + (i * (W - PAD.l - PAD.r)) / (n - 1));
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  const path = history.map((h, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(h.total).toFixed(1)}`).join(" ");
  const area = n > 1 ? `${path} L${x(n - 1)},${H - PAD.b} L${x(0)},${H - PAD.b} Z` : "";
  const shown = hover ?? n - 1;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-content">📈 Evolução do patrimônio</h3>
        {history[shown] && (
          <p className="text-sm text-muted">
            {monthName(history[shown].month)}/{history[shown].year}:{" "}
            <strong className="text-brand-dark dark:text-brand-light">{formatBRL(history[shown].total)}</strong>
          </p>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full overflow-visible" role="img" aria-label="Patrimônio mês a mês">
        <defs>
          <linearGradient id="org-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-purple)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--brand-purple)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="var(--border)" />
        {area && <motion.path d={area} fill="url(#org-area)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} />}
        {n > 1 && (
          <motion.path
            d={path}
            fill="none"
            stroke="var(--brand-purple)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          />
        )}
        {history.map((h, i) => {
          const isLast = i === n - 1;
          return (
            <g key={`${h.year}-${h.month}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={x(i) - 20} y={0} width={40} height={H} fill="transparent" />
              <circle
                cx={x(i)}
                cy={y(h.total)}
                r={isLast ? 6 : hover === i ? 5 : 3.5}
                fill={isLast ? "var(--brand-purple)" : "var(--bg-secondary)"}
                stroke="var(--brand-purple)"
                strokeWidth={2}
              />
              <text x={x(i)} y={H - 6} textAnchor="middle" className="fill-muted text-[11px]">
                {monthName(h.month).slice(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>

      {n < 3 && (
        <p className="text-xs text-muted">Continue registrando para ver sua curva crescer 📈 — um ponto novo a cada mês planejado.</p>
      )}
    </Card>
  );
}

export function FutureSection({ avgMonthlySavings, projections, history, children }: FutureSectionProps) {
  return (
    <section aria-labelledby="org-future" className="space-y-4">
      <h2 id="org-future" className="text-xs font-bold uppercase tracking-widest text-muted">
        Futuro
      </h2>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProjectionCard avg={avgMonthlySavings} projections={projections} />
        <PatrimonyChart history={history} />
      </div>

      {children}
    </section>
  );
}
