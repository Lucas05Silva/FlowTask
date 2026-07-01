"use client";

import { motion } from "framer-motion";
import { pct } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface GoalProgressProps {
  current: number;
  target: number;
  color?: string; // CSS variable or hex color
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const SIZES = {
  sm: "h-2",
  md: "h-4.5",
  lg: "h-7",
};

export function GoalProgress({
  current,
  target,
  color = "var(--brand-purple)",
  size = "md",
  showLabel = false,
}: GoalProgressProps) {
  const percentage = pct(current, target);

  return (
    <div className="w-full flex items-center gap-3">
      {/* Outer track */}
      <div className={cn("relative w-full overflow-hidden rounded-full bg-panel border border-line/40", SIZES[size])}>
        {/* Animated fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ backgroundColor: color }}
          className="absolute inset-y-0 left-0 rounded-full"
        />
        
        {/* Centered label for large bar */}
        {size === "lg" && showLabel && (
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-content mix-blend-difference">
            {percentage}%
          </span>
        )}
      </div>

      {/* Label on the side for sm/md bar */}
      {size !== "lg" && showLabel && (
        <span className="text-xs font-bold text-content shrink-0 select-none">
          {percentage}%
        </span>
      )}
    </div>
  );
}
