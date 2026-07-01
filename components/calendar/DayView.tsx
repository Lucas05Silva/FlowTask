"use client";

/* The "now" line syncs to a 1-minute interval — setState in effect is intentional. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarOff, Plus, Truck } from "lucide-react";
import type { CalendarItem } from "@/lib/calendar";
import { localKey } from "@/lib/calendar";
import { Button } from "@/components/ui/Button";
import { TimeBlock } from "./TimeBlock";

const START_HOUR = 6;
const END_HOUR = 23;
const HOUR_H = 60; // px per hour → 1min = 1px
const TOTAL_H = (END_HOUR - START_HOUR + 1) * HOUR_H;

interface DayViewProps {
  selectedKey: string;
  direction: number;
  dayItems: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
  onNewEvent: () => void;
}

function blockPosition(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMin = Math.max(0, sh * 60 + sm - START_HOUR * 60);
  const endMin = Math.min(TOTAL_H, eh * 60 + em - START_HOUR * 60);
  return { top: startMin, height: Math.max(28, endMin - startMin) };
}

export function DayView({ selectedKey, direction, dayItems, onItemClick, onNewEvent }: DayViewProps) {
  const [nowMin, setNowMin] = useState<number | null>(null);
  const isToday = selectedKey === localKey(new Date());

  useEffect(() => {
    if (!isToday) {
      setNowMin(null);
      return;
    }
    const update = () => {
      const now = new Date();
      setNowMin(now.getHours() * 60 + now.getMinutes() - START_HOUR * 60);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [isToday, selectedKey]);

  const allDay = dayItems.filter((i) => i.isAllDay && i.type === "event");
  const deliveries = dayItems.filter((i) => i.type === "task");
  const timed = dayItems.filter((i) => !i.isAllDay && i.startTime && i.endTime);

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const showNow = nowMin !== null && nowMin >= 0 && nowMin <= TOTAL_H;

  if (dayItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line py-16 text-center">
        <CalendarOff className="mb-3 size-10 text-muted opacity-50" aria-hidden />
        <h3 className="text-lg font-semibold text-content">Nada agendado para este dia</h3>
        <p className="mt-1 text-sm text-muted">Aproveite o dia livre ou crie um novo evento 📅</p>
        <Button icon={Plus} className="mt-5" onClick={onNewEvent}>Novo evento</Button>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={selectedKey}
        initial={{ opacity: 0, x: direction >= 0 ? 30 : -30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction >= 0 ? -30 : 30 }}
        transition={{ duration: 0.22 }}
        className="space-y-4"
      >
        {allDay.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Dia inteiro</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {allDay.map((it) => (
                <TimeBlock key={it.id} item={it} onClick={onItemClick} dense />
              ))}
            </div>
          </section>
        )}

        {deliveries.length > 0 && (
          <section>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <Truck className="size-3.5" /> Entregas do dia
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {deliveries.map((it) => (
                <TimeBlock key={it.id} item={it} onClick={onItemClick} dense />
              ))}
            </div>
          </section>
        )}

        {/* Timeline */}
        <section className="relative" style={{ height: TOTAL_H }}>
          {hours.map((h) => (
            <div key={h} className="absolute inset-x-0 flex" style={{ top: (h - START_HOUR) * HOUR_H, height: HOUR_H }}>
              <span className="w-12 shrink-0 -translate-y-2 pr-2 text-right text-xs text-muted">
                {String(h).padStart(2, "0")}:00
              </span>
              <span className="flex-1 border-t border-line" />
            </div>
          ))}

          {/* Now line */}
          {showNow && (
            <div className="absolute inset-x-0 z-10 flex items-center" style={{ top: nowMin as number }}>
              <span className="w-12 shrink-0" />
              <motion.span
                className="size-2 -translate-x-1 rounded-full bg-danger"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="h-px flex-1 bg-danger" />
            </div>
          )}

          {/* Timed blocks */}
          <div className="absolute inset-y-0 left-12 right-0">
            {timed.map((it) => {
              const { top, height } = blockPosition(it.startTime!, it.endTime!);
              return (
                <div key={it.id} className="absolute left-1 right-1" style={{ top, height }}>
                  <TimeBlock item={it} onClick={onItemClick} />
                </div>
              );
            })}
          </div>
        </section>
      </motion.div>
    </AnimatePresence>
  );
}
