"use client";

import { Trophy, Flame, Award, Shield } from "lucide-react";
import type { User } from "@/types";
import { useData } from "@/hooks/useData";
import { levelFromXp } from "@/lib/gamification";
import { Avatar } from "@/components/ui/Avatar";
import { LevelBadge } from "./LevelBadge";
import { StreakCounter } from "./StreakCounter";
import { cn } from "@/lib/utils";

function motivational(a: User, b: User): string {
  if (a.xp === b.xp) return "Vocês estão no mesmo ritmo! 🤝";
  if (a.streakCount >= 7 && b.streakCount >= 7) return "Dupla imparável! 💪";
  if (Math.abs(a.xp - b.xp) < 100) return "Disputa acirrada! 🔥";
  const leader = a.xp > b.xp ? a : b;
  const follower = a.xp > b.xp ? b : a;
  return `${leader.name} está liderando! Mas ${follower.name} está chegando! 🏃`;
}

interface RankingProps {
  variant?: "full" | "sidebar";
}

export function Ranking({ variant = "full" }: RankingProps) {
  const data = useData();
  const [a, b] = data.users;
  if (!a || !b) return null;

  const max = Math.max(a.xp, b.xp, 1);
  const ordered = [a, b].sort((x, y) => y.xp - x.xp);

  // Unlocked achievements count
  const achCount = (userId: string) => {
    return (data.userAchievements || []).filter((ua) => ua.userId === userId).length;
  };

  const aAch = achCount(a.id);
  const bAch = achCount(b.id);

  if (variant === "sidebar") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 px-1 text-xs font-bold text-muted uppercase tracking-wider">
          <Trophy className="size-3.5 text-pink-500" aria-hidden /> Ranking
        </div>
        {ordered.map((u, i) => (
          <div
            key={u.id}
            className={cn(
              "flex items-center gap-2 rounded-input px-2 py-2 border transition-all",
              i === 0
                ? "bg-gradient-to-r from-brand/5 to-pink-500/5 border-brand/20 shadow-sm"
                : "bg-transparent border-transparent"
            )}
          >
            <Avatar user={u} size={28} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-xs font-extrabold text-content">{u.name}</span>
                <StreakCounter count={u.streakCount} size="sm" />
              </div>
              <div className="text-[10px] text-muted font-semibold mt-0.5">
                Nv {levelFromXp(u.xp).level} · {u.xp} XP
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Side-by-side layout */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[a, b].map((u) => {
          const isLeader = u.xp === max && a.xp !== b.xp;
          const uLevel = levelFromXp(u.xp);
          const uAchCount = u.id === a.id ? aAch : bAch;

          return (
            <div
              key={u.id}
              className={cn(
                "relative rounded-card border p-4 bg-surface/50 transition-all",
                isLeader
                  ? "border-pink-300 bg-gradient-to-br from-pink-500/[0.02] to-brand/[0.02] shadow-[0_0_12px_rgba(244,114,182,0.08)]"
                  : "border-line"
              )}
            >
              {/* Leader Crown Badge */}
              {isLeader && (
                <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-pink-500 bg-pink-100 dark:bg-pink-950/45 px-2 py-0.5 rounded-full border border-pink-200 shadow-sm">
                  Líder 👑
                </span>
              )}

              <div className="flex items-center gap-3">
                <Avatar user={u} size={42} ring={isLeader} />
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sm text-content truncate">{u.name}</h4>
                  <p className="text-[11px] text-muted font-bold mt-0.5">
                    Nível {uLevel.level} — {uLevel.title}
                  </p>
                </div>
              </div>

              {/* Aggregated progress stats */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="bg-panel/40 border border-line/35 rounded p-2">
                  <span className="text-[10px] text-muted font-bold block uppercase tracking-wider">XP Total</span>
                  <span className="text-xs font-black text-content mt-1 block">{u.xp}</span>
                </div>
                <div className="bg-panel/40 border border-line/35 rounded p-2">
                  <span className="text-[10px] text-muted font-bold block uppercase tracking-wider">Streak</span>
                  <span className="inline-flex mt-1 text-content font-black text-xs">
                    <StreakCounter count={u.streakCount} size="sm" />
                  </span>
                </div>
                <div className="bg-panel/40 border border-line/35 rounded p-2">
                  <span className="text-[10px] text-muted font-bold block uppercase tracking-wider">Conquistas</span>
                  <span className="text-xs font-black text-content mt-1 block">{uAchCount}</span>
                </div>
              </div>

              {/* Progress visual bar representation */}
              <div className="mt-4 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-muted">
                  <span>Proporção de XP</span>
                  <span>{Math.round((u.xp / max) * 100)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-panel overflow-hidden border border-line/25">
                  <div
                    style={{ width: `${(u.xp / max) * 100}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isLeader ? "bg-gradient-to-r from-pink-500 to-brand" : "bg-muted-foreground/40"
                    )}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Motivational Phrase Box */}
      <p className="rounded-input border border-pink-100/15 bg-gradient-to-r from-pink-500/[0.03] to-purple-500/[0.03] px-4 py-3 text-center text-xs sm:text-sm font-extrabold text-pink-600 dark:text-pink-400">
        {motivational(a, b)}
      </p>
    </div>
  );
}
