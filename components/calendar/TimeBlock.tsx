"use client";

/* Icons resolve from a stable module-level map, so aliasing to <Icon> is safe. */
/* eslint-disable react-hooks/static-components */

import { motion } from "framer-motion";
import type { CalendarItem } from "@/lib/calendar";
import { CATEGORY_META } from "@/lib/constants";
import { iconFor } from "./icons";
import { cn } from "@/lib/utils";

interface TimeBlockProps {
  item: CalendarItem;
  onClick: (item: CalendarItem) => void;
  /** Compact single-line layout (short events / all-day chips). */
  dense?: boolean;
}

export function TimeBlock({ item, onClick, dense = false }: TimeBlockProps) {
  const Icon = iconFor(item.icon);
  const catLabel = CATEGORY_META[item.category as keyof typeof CATEGORY_META]?.label ?? item.category;

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(item)}
      aria-label={`${item.title}${item.startTime ? `, ${item.startTime} às ${item.endTime}` : ", dia inteiro"}`}
      className={cn(
        "flex h-full w-full items-start gap-2 overflow-hidden rounded-input border-l-4 p-2 text-left transition-transform hover:scale-[1.01] hover:shadow-soft",
        dense && "items-center py-1",
      )}
      style={{
        borderLeftColor: item.color,
        backgroundColor: `color-mix(in srgb, ${item.color} 12%, transparent)`,
      }}
    >
      <Icon className="mt-0.5 size-3.5 shrink-0" style={{ color: item.color }} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium leading-tight text-content">{item.title}</span>
        {!dense && (
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
            {item.startTime && <span>{item.startTime}–{item.endTime}</span>}
            <span className="truncate">· {catLabel}</span>
          </span>
        )}
      </span>
    </motion.button>
  );
}
