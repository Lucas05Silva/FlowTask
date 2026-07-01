"use client";

import { Flame } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StreakCounterProps {
  count: number;
  active?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function StreakCounter({ count, active = true, className, size = "md" }: StreakCounterProps) {
  // Determine flame colors and effects based on streak tier
  const isGold = count >= 30;
  const isStrongOrange = count >= 7 && count < 30;

  const colorClass = isGold
    ? "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.55)]"
    : isStrongOrange
    ? "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.45)]"
    : "text-amber-600";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-extrabold select-none",
        size === "sm" ? "text-xs" : "text-sm",
        active ? colorClass : "text-muted",
        className
      )}
      title={`${count} dias consecutivos! Continue! 🔥`}
    >
      {active ? (
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="shrink-0"
        >
          <Flame className={cn(size === "sm" ? "size-4" : "size-5", "fill-current")} />
        </motion.div>
      ) : (
        <Flame className={cn(size === "sm" ? "size-4" : "size-5")} />
      )}
      <span>{count}</span>
    </span>
  );
}
