"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CalendarItem } from "@/lib/calendar";
import { buildMonthGrid, WEEKDAYS_SHORT, localKey } from "@/lib/calendar";
import { CalendarDot } from "./CalendarDot";
import { cn } from "@/lib/utils";

interface MonthViewProps {
  cursor: Date;
  selectedKey: string;
  monthItems: Map<string, CalendarItem[]>;
  direction: number;
  onSelectDate: (key: string) => void;
}

export function MonthView({ cursor, selectedKey, monthItems, direction, onSelectDate }: MonthViewProps) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = buildMonthGrid(year, month);
  const todayKey = localKey(new Date());

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS_SHORT.map((w) => (
          <div key={w} className="py-1 text-center text-xs font-medium uppercase tracking-wide text-muted">
            {w}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${year}-${month}`}
          initial={{ opacity: 0, x: direction >= 0 ? 40 : -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction >= 0 ? -40 : 40 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="grid grid-cols-7 gap-1"
        >
          {cells.map((cell) => {
            const items = monthItems.get(cell.key) ?? [];
            const isToday = cell.key === todayKey;
            const isSelected = cell.key === selectedKey;
            return (
              <button
                key={cell.key}
                role="gridcell"
                aria-label={`${cell.date.getDate()} de ${WEEKDAYS_SHORT[cell.date.getDay()]}, ${items.length} ${items.length === 1 ? "item" : "itens"}`}
                onClick={() => onSelectDate(cell.key)}
                className={cn(
                  "flex min-h-[52px] flex-col items-stretch gap-1 rounded-input border p-1 text-left transition-colors sm:min-h-[80px] lg:min-h-[104px]",
                  cell.inMonth ? "border-line hover:bg-panel" : "border-transparent opacity-35 hover:opacity-60",
                  isSelected && !isToday && "border-brand",
                  items.length > 0 && cell.inMonth && "bg-panel/40",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 place-items-center justify-self-start rounded-full text-sm",
                    isToday ? "bg-brand font-bold text-white" : "font-medium text-content",
                  )}
                >
                  {cell.date.getDate()}
                </span>

                {/* Dots */}
                {items.length > 0 && (
                  <span className="flex flex-wrap items-center gap-1 px-0.5 lg:hidden">
                    {items.slice(0, 4).map((it) => (
                      <CalendarDot key={it.id} color={it.color} />
                    ))}
                    {items.length > 4 && <span className="text-[10px] text-muted">+{items.length - 4}</span>}
                  </span>
                )}

                {/* Titles (desktop) */}
                <span className="hidden flex-1 flex-col gap-0.5 lg:flex">
                  {items.slice(0, 3).map((it) => (
                    <span
                      key={it.id}
                      className="truncate rounded px-1 py-0.5 text-[11px] font-medium leading-tight"
                      style={{ color: it.color, backgroundColor: `color-mix(in srgb, ${it.color} 12%, transparent)` }}
                    >
                      {it.startTime ? `${it.startTime} ` : ""}
                      {it.title}
                    </span>
                  ))}
                  {items.length > 3 && <span className="px-1 text-[10px] text-muted">+{items.length - 3} mais</span>}
                </span>
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
