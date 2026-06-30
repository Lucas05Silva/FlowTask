import { levelFromXp } from "@/lib/gamification";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  xp: number;
  size?: number;
  showTitle?: boolean;
  className?: string;
}

export function LevelBadge({ xp, size = 28, showTitle = false, className }: LevelBadgeProps) {
  const info = levelFromXp(xp);
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="grid place-items-center rounded-full font-[family-name:var(--font-poppins)] font-bold text-white shadow-soft"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.42,
          background: "linear-gradient(135deg, #ad88ed, #312199)",
        }}
        title={`Nível ${info.level} — ${info.title}`}
      >
        {info.level}
      </span>
      {showTitle && (
        <span className="text-sm font-medium text-content">
          Nv {info.level} · <span className="text-muted">{info.title}</span>
        </span>
      )}
    </span>
  );
}
