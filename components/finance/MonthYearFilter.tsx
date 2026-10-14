"use client";

import { CalendarDays } from "lucide-react";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MONTHS, YEARS, monthLabel } from "@/lib/finance-filter";

interface MonthYearFilterProps {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  className?: string;
}

export function MonthYearFilter({ month, year, onMonthChange, onYearChange, className }: MonthYearFilterProps) {
  const now = new Date();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <div className={className ? `flex flex-wrap items-center gap-3 ${className}` : "flex flex-wrap items-center gap-3"}>
      <Select value={month} onChange={(e) => onMonthChange(parseInt(e.target.value, 10))} className="h-9 w-auto min-w-[140px] text-sm">
        {MONTHS.map((m) => (
          <option key={m.val} value={m.val}>
            {m.label}
          </option>
        ))}
      </Select>
      <Select value={year} onChange={(e) => onYearChange(parseInt(e.target.value, 10))} className="h-9 w-auto text-sm">
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
      {!isCurrentMonth && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            onMonthChange(now.getMonth() + 1);
            onYearChange(now.getFullYear());
          }}
        >
          Mês atual
        </Button>
      )}
      {!isCurrentMonth && (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning">
          <CalendarDays className="size-3.5" />
          Visualizando {monthLabel(month)}/{year}
        </span>
      )}
    </div>
  );
}
