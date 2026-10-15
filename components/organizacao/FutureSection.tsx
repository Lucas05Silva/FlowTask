"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { dreamEmoji, monthName, type GoalProjection } from "@/lib/organizacao";
import { formatBRL, cn } from "@/lib/utils";

interface FutureSectionProps {
  avgMonthlySavings: number;
  projections: GoalProjection[];
  history: { month: number; year: number; total: number }[];
}

const compact = (v: number) =>
  v >= 1000 ? `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: v >= 10000 ? 0 : 1 })}k` : `${Math.round(v)}`;

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

/* ---- 3.2 Sonhos com prazo --------------------------------------------------- */
function DreamCard({ p, index }: { p: GoalProjection; index: number }) {
  const tone =
    p.pct >= 75 ? { bar: "var(--success)", text: "text-success", line: "quase lá! 🎉" }
    : p.pct >= 40 ? { bar: "var(--brand-purple)", text: "text-brand", line: "na metade do caminho 💜" }
    : { bar: "var(--text-secondary)", text: "text-muted", line: "cada depósito conta 🌱" };
  const isCanada = dreamEmoji(p.goal) === "🍁";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface p-4 shadow-soft transition-shadow hover:shadow-pop"
    >
      <span className="text-3xl" aria-hidden>{dreamEmoji(p.goal)}</span>
      <h4 className="mt-2 truncate text-sm font-extrabold uppercase tracking-wide text-content">{p.goal.title}</h4>
      <p className="text-[11px] text-muted">
        {p.remaining === 0 ? "Conquistado! 🏆" : isCanada ? "Canadá está chegando 🍁" : tone.line}
      </p>

      <div className="mt-3">
        {p.remaining === 0 ? (
          <p className="text-xl font-bold text-success">Atingida</p>
        ) : p.months !== null ? (
          <>
            <p className="text-xl font-bold text-content">
              {p.months} {p.months === 1 ? "mês" : "meses"}
            </p>
            <p className="text-xs text-muted">{p.dateLabel}</p>
          </>
        ) : (
          <p className="text-sm font-semibold text-muted">Prazo a definir</p>
        )}
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-panel">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${p.pct}%` }}
          transition={{ duration: 0.8, delay: 0.15 + index * 0.06, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: tone.bar }}
        />
      </div>
      <p className="mt-1.5 flex justify-between text-[11px] text-muted">
        <span>
          {formatBRL(p.goal.currentAmount)} / {compact(p.goal.targetAmount)}
        </span>
        <span className={cn("font-bold", tone.text)}>{p.pct}%</span>
      </p>

      {p.monthsSavedWith300 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-brand px-4 py-2.5 text-[11px] font-medium text-white transition-transform duration-200 group-hover:translate-y-0">
          Poupar +R$ 300/mês acelera em {p.monthsSavedWith300} {p.monthsSavedWith300 === 1 ? "mês" : "meses"}
        </div>
      )}
    </motion.div>
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

export function FutureSection({ avgMonthlySavings, projections, history }: FutureSectionProps) {
  return (
    <section aria-labelledby="org-future" className="space-y-4">
      <h2 id="org-future" className="text-xs font-bold uppercase tracking-widest text-muted">
        Futuro
      </h2>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProjectionCard avg={avgMonthlySavings} projections={projections} />
        <PatrimonyChart history={history} />
      </div>

      {projections.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-content">✨ Sonhos com prazo</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {projections.map((p, i) => (
              <DreamCard key={p.goal.id} p={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
