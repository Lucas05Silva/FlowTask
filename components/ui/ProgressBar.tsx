"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0–100
  color?: string; // CSS color/var
  className?: string;
  trackClassName?: string;
  height?: number;
  label?: string;
}

export function ProgressBar({
  value,
  color = "var(--brand-purple)",
  className,
  trackClassName,
  height = 8,
  label,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={className}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={cn("w-full overflow-hidden rounded-full bg-panel", trackClassName)}
        style={{ height }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
