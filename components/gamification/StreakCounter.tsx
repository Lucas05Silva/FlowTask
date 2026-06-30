import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCounterProps {
  count: number;
  active?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function StreakCounter({ count, active = true, className, size = "md" }: StreakCounterProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold",
        size === "sm" ? "text-xs" : "text-sm",
        active ? "text-prio-alta" : "text-muted",
        className,
      )}
      title={`Sequência de ${count} dias`}
    >
      <Flame className={cn(size === "sm" ? "size-3.5" : "size-4", active && "fill-prio-alta/20")} aria-hidden />
      {count}
    </span>
  );
}
