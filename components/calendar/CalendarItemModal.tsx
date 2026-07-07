"use client";

/* Icons resolve from a stable module-level map, so aliasing to <Icon> is safe. */
/* eslint-disable react-hooks/static-components */

import { CalendarDays, Clock, MapPin, FileText, ArrowUpRight, Pencil } from "lucide-react";
import type { CalendarEvent } from "@/types";
import type { CalendarItem } from "@/lib/calendar";
import { dateFromKey } from "@/lib/calendar";
import { CATEGORY_META } from "@/lib/constants";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { iconFor } from "./icons";

const MODULE: Record<string, { label: string; route: string }> = {
  tarefas: { label: "Tarefas", route: "/tarefas" },
  calendario: { label: "Calendário", route: "/calendario" },
  projetos: { label: "Projetos", route: "/projetos" },
  financeiro: { label: "Financeiro", route: "/financeiro" },
  apartamento: { label: "Apartamento", route: "/apartamento" },
  casamento: { label: "Casamento", route: "/casamento" },
};

const TYPE_LABEL: Record<CalendarItem["type"], string> = {
  event: "Evento",
  task: "Tarefa",
  project: "Entrega de projeto",
  debt: "Vencimento",
  wedding: "Casamento",
};

interface CalendarItemModalProps {
  open: boolean;
  item: CalendarItem | null;
  event: CalendarEvent | null;
  onClose: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onOpenModule: (route: string) => void;
}

function Row({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-content">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
      <span className="min-w-0">{children}</span>
    </div>
  );
}

export function CalendarItemModal({ open, item, event, onClose, onEditEvent, onOpenModule }: CalendarItemModalProps) {
  if (!item) return null;

  const Icon = iconFor(item.icon);
  const cat = CATEGORY_META[item.category as keyof typeof CATEGORY_META];
  const dateLabel = dateFromKey(item.date).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeLabel = item.startTime ? `${item.startTime} – ${item.endTime}` : "Dia inteiro";
  const mod = MODULE[item.originalModule] ?? MODULE.calendario;
  const isEvent = item.type === "event" && event !== null;

  return (
    <Modal open={open} onClose={onClose} title="Detalhes">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full"
            style={{ backgroundColor: `color-mix(in srgb, ${item.color} 18%, transparent)`, color: item.color }}
          >
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold leading-snug text-content">{item.title}</h3>
            <span className="mt-1 inline-flex items-center gap-2">
              {cat && <Badge color={cat.color}>{cat.label}</Badge>}
              <span className="text-xs text-muted">{TYPE_LABEL[item.type]}</span>
            </span>
          </div>
        </div>

        <div className="space-y-2 rounded-input border border-line bg-panel/40 p-3">
          <Row icon={CalendarDays}>
            <span className="capitalize">{dateLabel}</span>
          </Row>
          <Row icon={Clock}>{timeLabel}</Row>
          {isEvent && event.location && <Row icon={MapPin}>{event.location}</Row>}
          {isEvent && event.notes && <Row icon={FileText}>{event.notes}</Row>}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          {isEvent ? (
            <Button icon={Pencil} onClick={() => onEditEvent(event)}>Editar evento</Button>
          ) : (
            <Button variant="outline" iconRight={ArrowUpRight} onClick={() => onOpenModule(mod.route)}>
              Ver em {mod.label}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
