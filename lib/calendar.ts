import type { CalendarEvent, Debt, FlowTaskData, Project, Task, ApartmentItem, WeddingTask } from "@/types";
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

function debtToItems(d: Debt): CalendarItem[] {
  if (d.status === "quitada") return [];
  const items: CalendarItem[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();

  for (let year = currentYear - 1; year <= currentYear + 1; year++) {
    for (let month = 0; month < 12; month++) {
      const lastDay = new Date(year, month + 1, 0).getDate();
      const targetDay = Math.min(d.dueDay, lastDay);
      const padStr = (n: number) => String(n).padStart(2, "0");
      const dateStr = `${year}-${padStr(month + 1)}-${padStr(targetDay)}`;

      items.push({
        id: `debt-${d.id}-${year}-${month}`,
        title: `Vencimento: ${d.name}`,
        date: dateStr,
        type: "debt",
        category: "financeiro",
        color: "var(--cat-financeiro)",
        icon: "DollarSign",
        isAllDay: true,
        originalId: d.id,
        originalModule: "financeiro",
      });
    }
  }
  return items;
}

function apartmentItemToItem(item: ApartmentItem): CalendarItem | null {
  if (!item.purchaseDeadline || item.status === "comprado" || item.status === "entregue") return null;
  return {
    id: `apartment-${item.id}`,
    title: `Comprar: ${item.name}`,
    date: item.purchaseDeadline,
    type: "task",
    category: "apartamento",
    color: "var(--cat-apartamento)",
    icon: "Home",
    isAllDay: true,
    originalId: item.id,
    originalModule: "apartamento",
  };
}

function weddingTaskToItem(task: WeddingTask): CalendarItem | null {
  if (!task.deadline || task.status === "concluida") return null;
  return {
    id: `wedding-task-${task.id}`,
    title: `Casamento: ${task.title}`,
    date: task.deadline,
    type: "wedding",
    category: "casamento",
    color: "var(--cat-casamento)",
    icon: "Heart",
    isAllDay: true,
    originalId: task.id,
    originalModule: "casamento",
  };
}

/**
 * Aggregate all sources into a flat CalendarItem list.
 * Wires Tasks + own Events + Project deadlines + Active debts.
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
  for (const d of data.debts) {
    items.push(...debtToItems(d));
  }
  for (const item of data.apartmentItems || []) {
    const calItem = apartmentItemToItem(item);
    if (calItem) items.push(calItem);
  }
  for (const t of data.weddingTasks || []) {
    const calItem = weddingTaskToItem(t);
    if (calItem) items.push(calItem);
  }
  if (data.weddingDate) {
    items.push({
      id: "wedding-day",
      title: "O Grande Dia! 💒",
      date: data.weddingDate,
      type: "wedding",
      category: "casamento",
      color: "var(--cat-casamento)",
      icon: "PartyPopper",
      isAllDay: true,
      originalId: "wedding-day",
      originalModule: "casamento",
    });
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
