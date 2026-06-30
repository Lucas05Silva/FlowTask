import { levelProgress } from "@/lib/gamification";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface XPBarProps {
  xp: number;
  compact?: boolean;
}

export function XPBar({ xp, compact = false }: XPBarProps) {
  const { current, next, pct, intoLevel, span } = levelProgress(xp);
  return (
    <div className="w-full">
      {!compact && (
        <div className="mb-1 flex items-center justify-between text-xs text-muted">
          <span>Nv {current.level} · {current.title}</span>
          <span>
            {next ? `${intoLevel}/${span} XP` : "Nível máximo!"}
          </span>
        </div>
      )}
      <ProgressBar value={pct} height={compact ? 5 : 8} label={`Progresso de XP: ${pct}%`} />
    </div>
  );
}
