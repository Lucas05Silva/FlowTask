"use client";

import { Trophy } from "lucide-react";
import type { User } from "@/types";
import { useData } from "@/hooks/useData";
import { levelFromXp } from "@/lib/gamification";
import { Avatar } from "@/components/ui/Avatar";
import { LevelBadge } from "./LevelBadge";
import { StreakCounter } from "./StreakCounter";
import { cn } from "@/lib/utils";

function motivational(a: User, b: User): string {
  const bothStreak = a.streakCount >= 7 && b.streakCount >= 7;
  if (bothStreak) return "Dupla dinâmica! Vocês estão arrasando juntos! 🔥";
  if (Math.abs(a.xp - b.xp) < 80) return "Páreo duro — tá quase empate! 💪";
  const leader = a.xp >= b.xp ? a : b;
  return `${leader.name} tá na frente, mas tem jogo! Bora alcançar 🚀`;
}

export function Ranking({ variant = "full" }: { variant?: "full" | "sidebar" }) {
  const data = useData();
  const [a, b] = data.users;
  if (!a || !b) return null;

  const max = Math.max(a.xp, b.xp, 1);
  const ordered = [a, b].sort((x, y) => y.xp - x.xp);

  if (variant === "sidebar") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 px-1 text-xs font-semibold text-muted">
          <Trophy className="size-3.5 text-brand" aria-hidden /> Ranking
        </div>
        {ordered.map((u, i) => (
          <div
            key={u.id}
            className={cn(
              "flex items-center gap-2 rounded-input px-2 py-1.5",
              i === 0 ? "bg-brand/10" : "bg-transparent",
            )}
          >
            <Avatar user={u} size={26} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-xs font-semibold text-content">{u.name}</span>
                <StreakCounter count={u.streakCount} size="sm" />
              </div>
              <div className="text-[11px] text-muted">
                Nv {levelFromXp(u.xp).level} · {u.xp} XP
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {[a, b].map((u) => (
        <div key={u.id} className="space-y-2">
          <div className="flex items-center gap-3">
            <Avatar user={u} size={40} ring={u.xp === max} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-content">{u.name}</span>
                <div className="flex items-center gap-2">
                  <StreakCounter count={u.streakCount} />
                  <LevelBadge xp={u.xp} size={24} />
                </div>
              </div>
              <div className="mt-1.5">
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>{u.xp} XP</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-panel">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-500"
                    style={{ width: `${(u.xp / max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      <p className="rounded-input bg-cyan/10 px-3 py-2 text-center text-sm font-medium text-cyan-dark">
        {motivational(a, b)}
      </p>
    </div>
  );
}
