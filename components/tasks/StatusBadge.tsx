"use client";

import { useState, useRef, useEffect } from "react";
import { Circle, PlayCircle, CheckCircle, ChevronDown } from "lucide-react";
import type { TaskStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: TaskStatus;
  onChange: (newStatus: TaskStatus) => void;
  disabled?: boolean;
}

const STATUS_CONFIG = {
  a_fazer: { 
    label: "A fazer", 
    colorClass: "bg-panel border-line text-muted-foreground hover:bg-panel/80", 
    icon: Circle 
  },
  fazendo: { 
    label: "Fazendo", 
    colorClass: "bg-brand/10 border-brand/20 text-brand-dark dark:text-brand-light hover:bg-brand/15", 
    icon: PlayCircle 
  },
  concluida: { 
    label: "Concluída", 
    colorClass: "bg-success/15 border-success/20 text-success hover:bg-success/20", 
    icon: CheckCircle 
  },
} as const;

export function StatusBadge({ status, onChange, disabled = false }: StatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const handleSelect = (newStatus: TaskStatus) => {
    if (disabled) return;
    onChange(newStatus);
    setOpen(false);
  };

  return (
    <div 
      ref={containerRef} 
      className="relative inline-block shrink-0"
      onClick={(e) => e.stopPropagation()} // Prevent click-through from selecting task card
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-badge border px-2.5 py-1 text-xs font-bold leading-none select-none transition-all shadow-sm shrink-0 cursor-pointer",
          config.colorClass,
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        <Icon className="size-3.5 shrink-0" />
        <span>{config.label}</span>
        <ChevronDown className="size-3 opacity-60 shrink-0 ml-0.5" />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 z-20 w-36 rounded-card border border-line bg-surface p-1.5 shadow-pop animate-in fade-in slide-in-from-top-1 duration-150">
          {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((statusKey) => {
            const opt = STATUS_CONFIG[statusKey];
            const OptIcon = opt.icon;
            const isCurrent = status === statusKey;

            return (
              <button
                key={statusKey}
                type="button"
                onClick={() => handleSelect(statusKey)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-input px-2.5 py-1.5 text-left text-xs font-semibold transition-colors cursor-pointer",
                  isCurrent 
                    ? "bg-brand/10 text-brand-dark dark:text-brand-light" 
                    : "text-muted hover:bg-panel hover:text-content"
                )}
              >
                <OptIcon className={cn("size-3.5 shrink-0", isCurrent ? "text-brand" : "text-muted-foreground")} />
                <span className="flex-1 truncate">{opt.label}</span>
                {isCurrent && <span className="size-1.5 rounded-full bg-brand shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default StatusBadge;
