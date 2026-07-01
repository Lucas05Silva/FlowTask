import type { CalendarEvent, FlowTaskData, Project, Task } from "@/types";
import { CATEGORY_META } from "@/lib/constants";

/** Unified item consumed by the calendar views (aggregates every source). */
export interface CalendarItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD (local)
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  type: "task" | "event" | "project" | "debt" | "wedding";
  category: string;
  color: string;
  icon: string; // Lucide icon name
  isAllDay: boolean;
  originalId: string;
  originalModule: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Local YYYY-MM-DD key for a Date (avoids UTC drift). */
export function localKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Build a Date at local midnight from a YYYY-MM-DD key. */
export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function timeOf(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export interface MonthCell {
  date: Date;
  key: string;
  inMonth: boolean;
}

/** Grid of days for a month, padded with adjacent-month days (weeks start Sunday). */
export function buildMonthGrid(year: number, month: number): MonthCell[] {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows = Math.ceil((startWeekday + daysInMonth) / 7);
  const start = new Date(year, month, 1 - startWeekday);
  const cells: MonthCell[] = [];
  for (let i = 0; i < rows * 7; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({ date: d, key: localKey(d), inMonth: d.getMonth() === month });
  }
  return cells;
}

/* --------------------------------------------------------------------------- */
/* Source → CalendarItem converters                                            */
/* --------------------------------------------------------------------------- */

function taskToItem(task: Task): CalendarItem | null {
  if (!task.dueDate) return null;
  return {
    id: `task-${task.id}`,
    title: task.title,
    date: task.dueDate,
    type: "task",
    category: task.category,
    color: CATEGORY_META[task.category].color,
    icon: "CheckSquare",
    isAllDay: true, // tasks carry a due date, not a time slot
    originalId: task.id,
    originalModule: "tarefas",
  };
}

function eventToItem(ev: CalendarEvent): CalendarItem {
  const start = new Date(ev.startDatetime);
  const end = new Date(ev.endDatetime);
  return {
    id: `event-${ev.id}`,
    title: ev.title,
    date: localKey(start),
    startTime: ev.isAllDay ? undefined : timeOf(start),
    endTime: ev.isAllDay ? undefined : timeOf(end),
    type: "event",
    category: ev.category,
    color: CATEGORY_META[ev.category].color,
    icon: "Calendar",
    isAllDay: ev.isAllDay,
    originalId: ev.id,
    originalModule: "calendario",
  };
}

function projectToItem(p: Project): CalendarItem {
  return {
    id: `project-${p.id}`,
    title: `Entrega: ${p.projectName}`,
    date: p.deadline,
    type: "project",
    category: "flowsys",
    color: "var(--brand-purple-deep)",
    icon: "Briefcase",
    isAllDay: true,
    originalId: p.id,
    originalModule: "projetos",
  };
}

/**
 * Aggregate all sources into a flat CalendarItem list.
 * Wires Tasks + own Events + Project deadlines. Debts/wedding plug in here later.
 */
export function aggregateItems(data: FlowTaskData): CalendarItem[] {
  const items: CalendarItem[] = [];
  for (const t of data.tasks) {
    const item = taskToItem(t);
    if (item) items.push(item);
  }
  for (const e of data.events) items.push(eventToItem(e));
  for (const p of data.projects) {
    if (p.status !== "feito") items.push(projectToItem(p));
  }
  return items;
}

function sortItems(a: CalendarItem, b: CalendarItem): number {
  if (a.isAllDay !== b.isAllDay) return a.isAllDay ? -1 : 1;
  return (a.startTime ?? "").localeCompare(b.startTime ?? "");
}

export function itemsForDate(items: CalendarItem[], key: string): CalendarItem[] {
  return items.filter((i) => i.date === key).sort(sortItems);
}

/** Map of YYYY-MM-DD → items, limited to the given month. */
export function itemsForMonth(items: CalendarItem[], year: number, month: number): Map<string, CalendarItem[]> {
  const map = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const d = dateFromKey(item.date);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    const list = map.get(item.date);
    if (list) list.push(item);
    else map.set(item.date, [item]);
  }
  for (const list of map.values()) list.sort(sortItems);
  return map;
}
