"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ListChecks,
  CalendarClock,
  Wallet,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/hooks/useData";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { Ranking } from "@/components/gamification/Ranking";
import { CATEGORY_META, PRIORITY_META } from "@/lib/constants";
import { currentMonthTotals, lastMonths } from "@/lib/finance-utils";
import {
  todayISO,
  daysUntil,
  countdownLabel,
  formatBRL,
  formatDate,
  pct,
} from "@/lib/utils";

function greeting(hour: number): string {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const data = useData();
  const today = todayISO();

  const todayTasks = useMemo(
    () => data.tasks.filter((t) => t.dueDate === today && t.status !== "concluida"),
    [data.tasks, today],
  );

  const todayEvents = useMemo(
    () =>
      data.events
        .filter((e) => e.startDatetime.slice(0, 10) === today)
        .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime)),
    [data.events, today],
  );

  const week = useMemo(() => {
    const days: { iso: string; label: string; weekday: string; items: { title: string; category: string }[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const tz = d.getTimezoneOffset() * 60000;
      const isoKey = new Date(d.getTime() - tz).toISOString().slice(0, 10);
      const tasks = data.tasks
        .filter((t) => t.dueDate === isoKey && t.status !== "concluida")
        .map((t) => ({ title: t.title, category: t.category }));
      const events = data.events
        .filter((e) => e.startDatetime.slice(0, 10) === isoKey)
        .map((e) => ({ title: e.title, category: e.category }));
      days.push({
        iso: isoKey,
        label: String(d.getDate()),
        weekday: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        items: [...tasks, ...events],
      });
    }
    return days;
  }, [data.tasks, data.events]);

  const activeProjects = useMemo(
    () =>
      data.projects
        .filter((p) => p.status !== "feito")
        .sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline)),
    [data.projects],
  );

  const nextDelivery = activeProjects[0];

  const finance = useMemo(() => currentMonthTotals(data.finances), [data.finances]);
  const months = useMemo(() => lastMonths(data.finances, 6), [data.finances]);
  const chartMax = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));

  const topGoals = useMemo(
    () =>
      data.goals
        .filter((g) => g.status === "em_andamento")
        .sort((a, b) => {
          const da = a.deadline ? daysUntil(a.deadline) : Infinity;
          const db = b.deadline ? daysUntil(b.deadline) : Infinity;
          return da - db;
        })
        .slice(0, 3),
    [data.goals],
  );

  if (!user) return null;
  const hour = new Date().getHours();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-7xl space-y-6">
      {/* Greeting */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-content sm:text-3xl">
          {greeting(hour)}, {user.name}! <span className="inline-block">👋</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ListChecks}
          label="Tarefas de hoje"
          value={`${todayTasks.length}`}
          hint={todayTasks.length ? "Bora concluir! 💪" : "Tudo em dia ✨"}
          accent="var(--cat-flowsys)"
        />
        <StatCard
          icon={CalendarClock}
          label="Próxima entrega"
          value={nextDelivery ? nextDelivery.projectName : "—"}
          hint={nextDelivery ? countdownLabel(nextDelivery.deadline) : "Nenhuma pendente"}
          accent="var(--cat-casamento)"
        />
        <StatCard
          icon={Wallet}
          label="Saldo do mês"
          value={formatBRL(finance.balance)}
          hint={`+${formatBRL(finance.income)} / -${formatBRL(finance.expense)}`}
          accent={finance.balance >= 0 ? "var(--success)" : "var(--danger)"}
        />
        <StatCard
          icon={Flame}
          label="Seu streak"
          value={`${user.streakCount} dias`}
          hint="Conclua 1 tarefa hoje p/ manter 🔥"
          accent="var(--prio-alta)"
        />
      </motion.div>

      {/* Hoje + Ranking */}
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Hoje</CardTitle>
              <Link href="/tarefas" className="text-sm font-medium text-brand hover:underline">
                Ver tudo
              </Link>
            </CardHeader>
            {todayTasks.length === 0 && todayEvents.length === 0 ? (
              <EmptyState icon={ListChecks} title="Agenda livre por hoje!" description="Aproveite ou adiante algo da semana 😉" />
            ) : (
              <ul className="space-y-2">
                {todayEvents.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 rounded-input border border-line p-3">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_META[e.category].color }} />
                    <span className="flex-1 truncate text-sm font-medium text-content">{e.title}</span>
                    <Badge>{e.isAllDay ? "Dia todo" : formatDate(e.startDatetime, { hour: "2-digit", minute: "2-digit" })}</Badge>
                  </li>
                ))}
                {todayTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 rounded-input border border-line p-3">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_META[t.category].color }} />
                    <span className="flex-1 truncate text-sm font-medium text-content">{t.title}</span>
                    <Badge color={PRIORITY_META[t.priority].color}>{PRIORITY_META[t.priority].label}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full">
            <CardTitle className="mb-4">Ranking</CardTitle>
            <Ranking variant="full" />
          </Card>
        </motion.div>
      </div>

      {/* Próximos 7 dias + Metas */}
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardTitle className="mb-4">Próximos 7 dias</CardTitle>
            <div className="grid grid-cols-7 gap-2">
              {week.map((d, i) => (
                <div
                  key={d.iso}
                  className={`rounded-input border p-2 text-center ${i === 0 ? "border-brand bg-brand/5" : "border-line"}`}
                >
                  <div className="text-[11px] uppercase text-muted">{d.weekday}</div>
                  <div className={`text-sm font-bold ${i === 0 ? "text-brand" : "text-content"}`}>{d.label}</div>
                  <div className="mt-2 flex flex-wrap justify-center gap-1">
                    {d.items.slice(0, 4).map((it, idx) => (
                      <span
                        key={idx}
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_META[it.category as keyof typeof CATEGORY_META]?.color ?? "var(--brand-purple)" }}
                        title={it.title}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Metas em destaque</CardTitle>
              <Link href="/metas" className="text-sm font-medium text-brand hover:underline">Ver</Link>
            </CardHeader>
            <div className="space-y-4">
              {topGoals.map((g) => (
                <div key={g.id}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-content">{g.title}</span>
                    <span className="shrink-0 text-xs text-muted">{pct(g.currentAmount, g.targetAmount)}%</span>
                  </div>
                  <ProgressBar value={pct(g.currentAmount, g.targetAmount)} />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Projetos + Financeiro */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Projetos FlowSys</CardTitle>
              <Link href="/projetos" className="text-sm font-medium text-brand hover:underline">Ver</Link>
            </CardHeader>
            <div className="space-y-3">
              {activeProjects.map((p) => {
                const done = p.steps.filter((s) => s.status === "concluido").length;
                return (
                  <div key={p.id} className="rounded-input border border-line p-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-content">{p.projectName}</p>
                        <p className="truncate text-xs text-muted">{p.clientName}</p>
                      </div>
                      <Badge color={daysUntil(p.deadline) <= 1 ? "var(--prio-urgente)" : "var(--cat-flowsys)"}>
                        {countdownLabel(p.deadline)}
                      </Badge>
                    </div>
                    <ProgressBar value={pct(done, p.steps.length)} />
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Financeiro rápido</CardTitle>
              <Link href="/financeiro" className="text-sm font-medium text-brand hover:underline">Ver</Link>
            </CardHeader>
            <div className="mb-4 flex gap-4 text-sm">
              <span className="inline-flex items-center gap-1 text-success">
                <ArrowUpRight className="size-4" /> {formatBRL(finance.income)}
              </span>
              <span className="inline-flex items-center gap-1 text-danger">
                <ArrowDownRight className="size-4" /> {formatBRL(finance.expense)}
              </span>
            </div>
            <div className="flex h-36 items-end justify-between gap-2">
              {months.map((m) => (
                <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-28 w-full items-end justify-center gap-1">
                    <div
                      className="w-1/2 rounded-t bg-success/80"
                      style={{ height: `${(m.income / chartMax) * 100}%` }}
                      title={`Entradas: ${formatBRL(m.income)}`}
                    />
                    <div
                      className="w-1/2 rounded-t bg-danger/70"
                      style={{ height: `${(m.expense / chartMax) * 100}%` }}
                      title={`Saídas: ${formatBRL(m.expense)}`}
                    />
                  </div>
                  <span className="text-[11px] capitalize text-muted">{m.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
