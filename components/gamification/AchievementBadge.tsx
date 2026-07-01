"use client";

import {
  Award,
  Footprints,
  Flame,
  Zap,
  Smile,
  Rocket,
  BadgeCheck,
  PiggyBank,
  Home,
  Heart,
  Users,
  Sparkles,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Achievement } from "@/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string | null;
}

const ICONS: Record<string, LucideIcon> = {
  Footprints,
  Flame,
  Zap,
  Smile,
  Rocket,
  BadgeCheck,
  PiggyBank,
  Home,
  Heart,
  Users,
  Sparkles,
};

export function AchievementBadge({ achievement, unlocked, unlockedAt }: AchievementBadgeProps) {
  const Icon = ICONS[achievement.icon] || Award;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative flex flex-col items-center gap-2.5 rounded-card border p-4 text-center select-none transition-all duration-200",
        unlocked
          ? "border-amber-400 bg-amber-500/[0.03] shadow-[0_0_12px_rgba(245,158,11,0.05)]"
          : "border-line bg-surface/50 opacity-40 grayscale"
      )}
      title={`${achievement.title}: ${achievement.description} ${
        unlocked && unlockedAt ? `(Conquistada em ${formatDate(unlockedAt)})` : "(Bloqueada)"
      }`}
    >
      {/* Icon frame with lock overlay if locked */}
      <div className="relative">
        <span
          className={cn(
            "grid size-12 place-items-center rounded-full border transition-colors",
            unlocked
              ? "bg-amber-100 border-amber-300 text-amber-600 dark:bg-amber-950/45 dark:border-amber-500/20 dark:text-amber-400 shadow-sm"
              : "bg-panel border-line text-muted"
          )}
        >
          <Icon className="size-6" />
        </span>

        {!unlocked && (
          <span className="absolute -bottom-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-surface border border-line text-muted shadow-sm">
            <Lock className="size-2.5" />
          </span>
        )}
      </div>

      <div>
        <span
          className={cn(
            "text-xs font-bold leading-tight block text-content",
            unlocked && "text-amber-600 dark:text-amber-400"
          )}
        >
          {achievement.title}
        </span>
        <span className="text-[10px] leading-tight text-muted block mt-1">
          {unlocked ? achievement.description : "???"}
        </span>
      </div>

      {/* Unlocked date */}
      {unlocked && unlockedAt && (
        <span className="text-[9px] text-muted italic font-medium mt-1">
          {formatDate(unlockedAt)}
        </span>
      )}
    </motion.div>
  );
}
