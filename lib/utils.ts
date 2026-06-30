/** Lightweight className combiner (truthy join). */
export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(" ");
}

/** Format a number as BRL currency. */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Format an ISO date string (yyyy-mm-dd or full ISO) to pt-BR short date. */
export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", opts ?? { day: "2-digit", month: "short" }).format(d);
}

/** Today's date as yyyy-mm-dd (local). */
export function todayISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/** Whole-day difference between an ISO date and today (positive = future). */
export function daysUntil(iso: string): number {
  const target = new Date(iso);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

/** Human countdown label, e.g. "Faltam 5 dias", "Hoje", "Atrasado 2 dias". */
export function countdownLabel(iso: string): string {
  const d = daysUntil(iso);
  if (d === 0) return "Hoje";
  if (d === 1) return "Amanhã";
  if (d === -1) return "Atrasado 1 dia";
  if (d < 0) return `Atrasado ${Math.abs(d)} dias`;
  return `Faltam ${d} dias`;
}

/** Crypto-safe-ish id for mock records. */
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/** Clamp a number between min and max. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/** Percentage (0–100) of part/whole, safe for whole=0. */
export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return clamp(Math.round((part / whole) * 100), 0, 100);
}
