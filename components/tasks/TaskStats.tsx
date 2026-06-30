"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ListTodo, CheckCircle2, Flame, Star, type LucideIcon } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/hooks/useData";
import { Card } from "@/components/ui/Card";
import { todayISO } from "@/lib/utils";

function useCountUp(value: number, duration = 800): number {
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

function StatTile({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: number; accent: string }) {
  const display = useCountUp(value);
  return (
    <Card padded={false} className="flex items-center gap-3 p-4">
      <span
        className="grid size-11 shrink-0 place-items-center rounded-input"
        style={{ backgroundColor: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight text-content">{display}</p>
        <p className="truncate text-xs text-muted">{label}</p>
      </div>
    </Card>
  );
}

export function TaskStats() {
  const { user } = useAuth();
  const data = useData();
  const today = todayISO();

  const stats = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const completedThisWeek = data.tasks.filter(
      (t) => t.status === "concluida" && t.completedAt && new Date(t.completedAt) >= weekAgo,
    );
    return {
      today: data.tasks.filter((t) => t.dueDate === today && t.status !== "concluida").length,
      doneWeek: completedThisWeek.length,
      streak: user?.streakCount ?? 0,
      xpWeek: completedThisWeek.reduce((sum, t) => sum + t.xpReward, 0),
    };
  }, [data.tasks, today, user?.streakCount]);

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatTile icon={ListTodo} label="Tarefas de hoje" value={stats.today} accent="var(--cat-flowsys)" />
      <StatTile icon={CheckCircle2} label="Concluídas na semana" value={stats.doneWeek} accent="var(--success)" />
      <StatTile icon={Flame} label="Streak atual" value={stats.streak} accent="var(--prio-alta)" />
      <StatTile icon={Star} label="XP ganho na semana" value={stats.xpWeek} accent="var(--brand-purple)" />
    </div>
  );
}
