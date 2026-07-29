"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Pencil,
  TrendingUp,
  Lock,
  Zap,
  Target,
  Briefcase,
  Gift,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Coins,
} from "lucide-react";
import type { IncomeSource } from "@/types";
import { useIncomeProfile } from "@/hooks/useIncomeProfile";
import { useInvestments } from "@/hooks/useInvestments";
import { useGamification } from "@/components/providers/GamificationProvider";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IncomeProfileModal } from "./IncomeProfileModal";
import {
  projectFutureValue,
  estimateMonthlyPassiveIncome,
  monthsToReach,
} from "@/lib/investment-calculator";
import { formatBRL, cn } from "@/lib/utils";

const MONTH_ABBR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const monthLabel = (ym: string) => `${MONTH_ABBR[parseInt(ym.slice(5, 7), 10) - 1]}/${ym.slice(0, 4)}`;

const RESERVE_TARGET = 6000;
const RESERVE_RATE = 10.5;
const PROJECTION_RATE = 10;

const TYPE_META: Record<IncomeSource["type"], { label: string; color: string; icon: typeof Briefcase }> = {
  fixo: { label: "FIXO", color: "var(--info)", icon: Briefcase },
  variavel: { label: "VARIÁVEL", color: "var(--warning)", icon: Zap },
  beneficio: { label: "BENEFÍCIO", color: "var(--text-secondary)", icon: Gift },
};

function futureDateLabel(monthsAhead: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  return `${MONTH_ABBR[d.getMonth()]}/${d.getFullYear()}`;
}

export function MinhaRendaTab() {
  const { celebrate } = useGamification();
  const {
    history,
    sources,
    monthlyExpenses,
    investmentGoalPct,
    flowsysInvestmentPct,
    getFixedIncome,
    getVariableIncome,
    getTotalIncome,
    getFlowsysContribution,
    getMonthlyInvestment,
    getTotalInvestment,
    getSurplus,
    seedIfEmpty,
    saveProfile,
  } = useIncomeProfile();
  const { getEmergencyFundTotal, getTotalCurrentValue } = useInvestments();

  const [modalOpen, setModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    seedIfEmpty();
  }, [seedIfEmpty]);

  const fixedIncome = getFixedIncome();
  const variableIncome = getVariableIncome();
  const totalIncome = getTotalIncome();
  const monthlyInvestment = getMonthlyInvestment();
  const flowsysContribution = getFlowsysContribution();
  const totalInvestment = getTotalInvestment();
  const surplus = getSurplus();

  // Allocation of the fixed income (base garantida).
  const alloc = useMemo(() => {
    const base = Math.max(fixedIncome, 1);
    const invest = totalInvestment;
    const spend = monthlyExpenses;
    const free = Math.max(0, surplus);
    return {
      base: fixedIncome,
      invest,
      spend,
      free,
      investPct: Math.round((invest / base) * 100),
      spendPct: Math.round((spend / base) * 100),
      freePct: Math.round((free / base) * 100),
    };
  }, [fixedIncome, totalInvestment, monthlyExpenses, surplus]);

  // Emergency fund (from the Investimentos module).
  const reserveCurrent = getEmergencyFundTotal();
  const reservePct = Math.min(100, Math.round((reserveCurrent / RESERVE_TARGET) * 100));
  const reserveColor = reservePct >= 100 ? "var(--success)" : reservePct >= 50 ? "var(--warning)" : "var(--danger)";
  const reserveMonthly = totalInvestment > 0 ? totalInvestment : monthlyInvestment;
  const reserveMonths = monthsToReach(reserveCurrent, reserveMonthly, RESERVE_RATE, RESERVE_TARGET);

  // Projection marks.
  const patrimonyToday = getTotalCurrentValue();
  const marks = useMemo(() => {
    const mk = (years: number) => projectFutureValue(patrimonyToday, totalInvestment, PROJECTION_RATE, years);
    const y1 = mk(1);
    const y3 = mk(3);
    const y10 = mk(10);
    return [
      { label: "Hoje", value: patrimonyToday, passive: null as number | null },
      { label: "Ano 1", value: y1, passive: null },
      { label: "Ano 3", value: y3, passive: estimateMonthlyPassiveIncome(y3) },
      { label: "Ano 10", value: y10, passive: estimateMonthlyPassiveIncome(y10) },
    ];
  }, [patrimonyToday, totalInvestment]);

  const initialForm = {
    sources: sources.map((s) => ({ ...s })),
    monthlyExpenses,
    investmentGoalPct,
    flowsysInvestmentPct,
  };

  const handleSave = (form: typeof initialForm) => {
    const res = saveProfile(form);
    if (res) celebrate(res);
  };

  const kpis = [
    { label: "Renda fixa", value: formatBRL(fixedIncome), hint: "Salário + Flowsys", color: "var(--info)" },
    { label: "Renda variável", value: formatBRL(variableIncome), hint: "Estágio por horas", color: "var(--warning)", badge: "VARIÁVEL" },
    { label: "Investindo/mês", value: formatBRL(totalInvestment), hint: `${investmentGoalPct}% fixo + ${flowsysInvestmentPct}% Flowsys`, color: "var(--brand-purple)" },
    {
      label: "Sobra estimada",
      value: formatBRL(surplus),
      hint: "Renda − gastos − investimento",
      color: surplus >= 0 ? "var(--success)" : "var(--danger)",
      valueColor: surplus >= 0 ? "text-success" : "text-danger",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-content">
            <TrendingUp className="size-5 text-brand" /> Minha Renda
          </h2>
          <p className="text-sm text-muted">
            Visão geral da sua renda, capacidade de investimento e progresso financeiro.
          </p>
        </div>
        <Button size="sm" variant="outline" icon={Pencil} onClick={() => setModalOpen(true)} className="self-start">
          Editar perfil de renda
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted sm:text-sm">{k.label}</span>
              {k.badge && (
                <Badge color="var(--warning)" className="text-[9px] uppercase">
                  {k.badge}
                </Badge>
              )}
            </div>
            <p className={cn("text-lg font-bold sm:text-2xl", k.valueColor ?? "text-content")}>{k.value}</p>
            <p className="text-[11px] text-muted">{k.hint}</p>
          </Card>
        ))}
      </div>

      {/* Composition + Allocation */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* De onde vem sua renda */}
        <Card>
          <CardTitle className="mb-4 text-base">De onde vem sua renda</CardTitle>
          <div className="space-y-3">
            {sources.length === 0 && <p className="text-sm text-muted">Nenhuma fonte cadastrada.</p>}
            {sources.map((s) => {
              const meta = TYPE_META[s.type];
              const Icon = meta.icon;
              const share = totalIncome > 0 ? Math.round((s.amount / totalIncome) * 100) : 0;
              const investBadge =
                s.id === "flowsys"
                  ? `${flowsysInvestmentPct}% → Investimento`
                  : s.note?.toLowerCase().includes("100%")
                    ? "100% → Investimento"
                    : null;
              return (
                <div key={s.id} className="rounded-input border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="grid size-8 shrink-0 place-items-center rounded-full"
                        style={{ backgroundColor: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-content">{s.label}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge color={meta.color} className="text-[9px] uppercase">
                            {meta.label}
                          </Badge>
                          {investBadge && (
                            <Badge color="var(--success)" className="text-[9px]">
                              {investBadge}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-content">{formatBRL(s.amount)}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-panel">
                    <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: meta.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="text-sm font-medium text-muted">Base garantida</span>
            <span className="text-sm font-bold text-content">{formatBRL(fixedIncome)}/mês</span>
          </div>
        </Card>

        {/* Onde vai sua renda */}
        <Card>
          <CardTitle className="mb-1 text-base">Onde vai sua renda</CardTitle>
          <p className="mb-4 text-xs text-muted">Alocação da base garantida ({formatBRL(fixedIncome)})</p>

          <div className="flex h-4 w-full overflow-hidden rounded-full bg-panel">
            <div style={{ width: `${alloc.investPct}%`, backgroundColor: "var(--brand-purple)" }} title="Investimentos" />
            <div style={{ width: `${alloc.spendPct}%`, backgroundColor: "var(--cat-financeiro)" }} title="Gastos" />
            <div style={{ width: `${alloc.freePct}%`, backgroundColor: "var(--success)" }} title="Sobra" />
          </div>

          <div className="mt-4 space-y-2.5">
            <AllocRow color="var(--brand-purple)" label="Investimentos" pct={alloc.investPct} value={alloc.invest} />
            <AllocRow color="var(--cat-financeiro)" label="Gastos mensais" pct={alloc.spendPct} value={alloc.spend} />
            <AllocRow color="var(--success)" label="Sobra livre" pct={alloc.freePct} value={alloc.free} />
          </div>
        </Card>
      </div>

      {/* Regras de ouro */}
      <div>
        <CardTitle className="mb-3 text-base">Suas regras de investimento</CardTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          <RuleCard
            icon={Lock}
            color="var(--info)"
            title="Flowsys"
            body={`${flowsysInvestmentPct}% vai direto para investimento`}
            highlight={`= ${formatBRL(flowsysContribution)}/mês`}
          />
          <RuleCard
            icon={Zap}
            color="var(--warning)"
            title="Horas do estágio"
            body="100% vai para investimento"
            highlight="(bônus — não conta na base)"
          />
          <RuleCard
            icon={Target}
            color="var(--brand-purple)"
            title="Meta mensal"
            body={`${investmentGoalPct}% da renda fixa + Flowsys`}
            highlight={`= ${formatBRL(monthlyInvestment)} + ${formatBRL(flowsysContribution)} = ${formatBRL(totalInvestment)}/mês`}
          />
        </div>
      </div>

      {/* Reserva de emergência */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5" style={{ color: reserveColor }} />
            <CardTitle className="text-base">Reserva de emergência</CardTitle>
          </div>
          <Link href="/investimentos" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
            Ver no módulo Investimentos <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span className="text-muted">
            Meta: <span className="font-semibold text-content">{formatBRL(RESERVE_TARGET)}</span>
          </span>
          <span className="text-muted">
            Atual: <span className="font-semibold text-content">{formatBRL(reserveCurrent)}</span>
          </span>
          <span className="font-bold" style={{ color: reserveColor }}>
            {reservePct}%
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-panel">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${reservePct}%`, backgroundColor: reserveColor }} />
        </div>
        <p className="mt-2 text-xs text-muted">
          {reserveMonths === null
            ? `Aumente os aportes para atingir a meta.`
            : reserveMonths === 0
              ? `Meta atingida! 🎉`
              : `Com ${formatBRL(reserveMonthly)}/mês → meta em ~${reserveMonths} meses (${futureDateLabel(reserveMonths)}).`}
        </p>
      </Card>

      {/* Projeção */}
      <Card>
        <CardTitle className="mb-4 text-base">Se você mantiver o ritmo…</CardTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {marks.map((m, i) => (
            <div key={m.label} className={cn("rounded-input border border-line p-3", i === 0 && "bg-panel/40")}>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-success" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{m.label}</span>
              </div>
              <p className="mt-1 text-lg font-bold text-content">{formatBRL(m.value)}</p>
              <p className="text-[10px] text-muted">patrimônio</p>
              {m.passive !== null && (
                <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-brand">
                  <Coins className="size-3" /> ~{formatBRL(m.passive)}/mês
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted">
          Estimativa com taxa média de {PROJECTION_RATE}% a.a. e aporte de {formatBRL(totalInvestment)}/mês. Não é
          recomendação de investimento.
        </p>
      </Card>

      {/* Histórico (accordion) */}
      <Card padded={false}>
        <button
          type="button"
          onClick={() => setHistoryOpen((o) => !o)}
          aria-expanded={historyOpen}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <CardTitle className="text-base">Histórico de renda</CardTitle>
          <ChevronDown className={cn("size-5 text-muted transition-transform", historyOpen && "rotate-180")} />
        </button>
        {historyOpen && (
          <div className="border-t border-line px-5 py-4">
            {history.length === 0 ? (
              <p className="text-sm text-muted">Nenhum registro ainda.</p>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="flex items-start gap-3 text-sm">
                    <span className="w-16 shrink-0 font-semibold text-muted">{monthLabel(h.month)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-content">
                        {h.note}{" "}
                        <span className="font-bold">= {formatBRL(h.totalFixed + h.totalVariable)}/mês</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Edit modal */}
      <IncomeProfileModal open={modalOpen} initial={initialForm} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  );
}

function AllocRow({ color, label, pct, value }: { color: string; label: string; pct: number; value: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="flex-1 font-medium text-content">{label}</span>
      <span className="w-10 text-right text-xs font-semibold text-muted">{pct}%</span>
      <span className="w-24 text-right font-bold text-content">{formatBRL(value)}</span>
    </div>
  );
}

function RuleCard({
  icon: Icon,
  color,
  title,
  body,
  highlight,
}: {
  icon: typeof Lock;
  color: string;
  title: string;
  body: string;
  highlight: string;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <span
        className="grid size-9 place-items-center rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
      >
        <Icon className="size-4" />
      </span>
      <p className="text-sm font-bold text-content">{title}</p>
      <p className="text-xs leading-relaxed text-muted">{body}</p>
      <p className="mt-auto text-sm font-semibold" style={{ color }}>
        {highlight}
      </p>
    </Card>
  );
}
