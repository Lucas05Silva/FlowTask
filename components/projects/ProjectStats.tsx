"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Briefcase, CalendarCheck, CheckCircle2, Wallet, type LucideIcon } from "lucide-react";
import { useData } from "@/hooks/useData";
import { Card } from "@/components/ui/Card";
import { formatBRL } from "@/lib/utils";

function useCountUp(value: number, duration = 750): number {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

function StatTile({
  icon: Icon,
  label,
  value,
  display,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  display?: string;
  accent: string;
}) {
  const count = useCountUp(value);
  return (
    <Card padded={false} className="flex items-center gap-3 p-4">
      <span
        className="grid size-11 shrink-0 place-items-center rounded-input"
        style={{ backgroundColor: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-2xl font-bold leading-tight text-content">{display ?? count}</p>
        <p className="truncate text-xs text-muted">{label}</p>
      </div>
    </Card>
  );
}

export function ProjectStats() {
  const data = useData();

  const stats = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const active = data.projects.filter((p) => p.status === "fazendo");
    const thisMonth = data.projects.filter((p) => {
      if (!p.completedAt) return false;
      const d = new Date(p.completedAt);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    return {
      active: active.length,
      deliveredMonth: thisMonth.length,
      activeRevenue: active.reduce((sum, p) => sum + p.value, 0),
      deliveredTotal: data.projects.filter((p) => p.status === "feito").length,
    };
  }, [data.projects]);

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatTile icon={Briefcase} label="Projetos ativos" value={stats.active} accent="var(--brand-purple)" />
      <StatTile icon={CalendarCheck} label="Entregas este mes" value={stats.deliveredMonth} accent="var(--cat-flowsys)" />
      <StatTile
        icon={Wallet}
        label="Receita ativa"
        value={stats.activeRevenue}
        display={formatBRL(useCountUp(stats.activeRevenue))}
        accent="var(--success)"
      />
      <StatTile icon={CheckCircle2} label="Projetos entregues" value={stats.deliveredTotal} accent="var(--success)" />
    </div>
  );
}
