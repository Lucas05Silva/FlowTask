"use client";

import { cn } from "@/lib/utils";
import type { Note } from "@/types";

export const NOTE_COLOR_MAP: Record<
  Note["color"],
  { name: string; classes: string; dotClass: string }
> = {
  default: {
    name: "Padrão",
    classes: "bg-surface text-content border border-line/60 shadow-soft",
    dotClass: "bg-surface border border-line hover:border-muted",
  },
  purple: {
    name: "Roxo",
    classes: "bg-[#EDE9FE] text-[#4C1D95] dark:bg-[#2D1B69] dark:text-[#DDD6FE] shadow-soft",
    dotClass: "bg-[#ad88ed] border border-transparent",
  },
  cyan: {
    name: "Ciano",
    classes: "bg-[#CFFAFE] text-[#155E75] dark:bg-[#164E63] dark:text-[#A5F3FC] shadow-soft",
    dotClass: "bg-[#5bbcc9] border border-transparent",
  },
  amber: {
    name: "Amarelo",
    classes: "bg-[#FEF3C7] text-[#78350F] dark:bg-[#78350F] dark:text-[#FDE68A] shadow-soft",
    dotClass: "bg-[#f59e0b] border border-transparent",
  },
  pink: {
    name: "Rosa",
    classes: "bg-[#FCE7F3] text-[#831843] dark:bg-[#831843] dark:text-[#FCE7F3] shadow-soft",
    dotClass: "bg-[#f472b6] border border-transparent",
  },
  green: {
    name: "Verde",
    classes: "bg-[#D1FAE5] text-[#064E3B] dark:bg-[#064E3B] dark:text-[#A7F3D0] shadow-soft",
    dotClass: "bg-[#10b981] border border-transparent",
  },
};

interface NoteColorPickerProps {
  selectedColor: Note["color"];
  onChange: (color: Note["color"]) => void;
}

export function NoteColorPicker({ selectedColor, onChange }: NoteColorPickerProps) {
  return (
    <div className="flex items-center gap-1.5" aria-label="Seletor de cor">
      {(Object.keys(NOTE_COLOR_MAP) as Array<Note["color"]>).map((colorKey) => {
        const color = NOTE_COLOR_MAP[colorKey];
        const isSelected = selectedColor === colorKey;

        return (
          <button
            key={colorKey}
            type="button"
            title={color.name}
            onClick={() => onChange(colorKey)}
            className={cn(
              "size-6.5 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0",
              isSelected 
                ? "ring-2 ring-brand ring-offset-2 dark:ring-offset-canvas scale-110" 
                : "hover:scale-105 active:scale-95"
            )}
          >
            <span className={cn("size-5 rounded-full block shadow-sm", color.dotClass)} />
          </button>
        );
      })}
    </div>
  );
}
