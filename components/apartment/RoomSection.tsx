"use client";

import { useState } from "react";
import { Sofa, Bed, Utensils, Bath, Wind, Laptop, DoorClosed, ChevronDown, ChevronUp } from "lucide-react";
import type { ApartmentItem } from "@/types";
import { ApartmentItemCard } from "./ApartmentItemCard";
import { GoalProgress } from "../goals/GoalProgress";
import { cn } from "@/lib/utils";

interface RoomSectionProps {
  roomName: string;
  items: ApartmentItem[];
  onItemClick: (item: ApartmentItem) => void;
}

const ROOM_ICONS: Record<string, any> = {
  sala: Sofa,
  quarto: Bed,
  cozinha: Utensils,
  banheiro: Bath,
  lavanderia: Wind,
  escritório: Laptop,
  escritorio: Laptop,
};

export function RoomSection({ roomName, items, onItemClick }: RoomSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const totalCount = items.length;
  const completedCount = items.filter((i) => i.status === "comprado" || i.status === "entregue").length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const IconComponent = ROOM_ICONS[roomName.toLowerCase()] || DoorClosed;

  if (totalCount === 0) return null;

  return (
    <div className="border border-line rounded-card bg-surface overflow-hidden shadow-soft">
      {/* Collapsible Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex cursor-pointer items-center justify-between px-5 py-4 bg-panel/30 border-b border-line/40 hover:bg-panel/60 transition-colors select-none"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="grid size-9 place-items-center rounded-lg bg-surface border border-line text-brand-dark shadow-sm shrink-0">
            <IconComponent className="size-5" />
          </span>
          <div className="min-w-0 flex-1 pr-4">
            <h3 className="font-bold text-sm text-content capitalize truncate">{roomName}</h3>
            <div className="flex items-center gap-3 mt-1 text-[11px] font-semibold text-muted">
              <span>
                {completedCount} de {totalCount} itens ({percentage}%)
              </span>
              {/* Mini progress bar track */}
              <div className="w-20">
                <GoalProgress current={completedCount} target={totalCount} size="sm" />
              </div>
            </div>
          </div>
        </div>

        <button className="grid size-8 place-items-center rounded-input hover:bg-panel text-muted transition-colors">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {/* Grid of Items */}
      {isOpen && (
        <div className="p-4 bg-surface">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ApartmentItemCard key={item.id} item={item} onClick={onItemClick} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
