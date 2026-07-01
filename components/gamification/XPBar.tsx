"use client";

import { levelProgress } from "@/lib/gamification";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface XPBarProps {
  xp: number;
  compact?: boolean;
}

export function XPBar({ xp, compact = false }: XPBarProps) {
  const { current, next, pct, intoLevel, span } = levelProgress(xp);

  return (
    <div className="w-full space-y-1.5">
      {compact ? (
        <ProgressBar value={pct} height={6} color="var(--brand-purple)" />
      ) : (
        <>
          <div className="flex items-center gap-3">
            {/* Current Level */}
            <span className="text-xs font-black text-content shrink-0 bg-panel border border-line/45 rounded px-1.5 py-0.5">
              Nv {current.level}
            </span>
            {/* Bar */}
            <div className="flex-1">
              <ProgressBar value={pct} height={8} color="var(--brand-purple)" />
            </div>
            {/* Next Level */}
            <span className="text-xs font-black text-muted shrink-0 bg-panel/30 border border-line/35 rounded px-1.5 py-0.5">
              Nv {next ? next.level : current.level + 1}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-muted px-0.5">
            <span>{current.title}</span>
            <span>
              {next ? `${intoLevel} / ${span} XP (${pct}%)` : "Nível Máximo! 🏆"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
