"use client";

/* Form state is intentionally re-synced from the selected event when the modal opens. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { Trash2, CalendarClock } from "lucide-react";
import type { Category, CalendarEvent } from "@/types";
import type { EventFormData } from "@/hooks/useCalendar";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { CATEGORY_META } from "@/lib/constants";
import { localKey, timeOf } from "@/lib/calendar";
import { todayISO, cn } from "@/lib/utils";

interface EventModalProps {
  open: boolean;
  event: CalendarEvent | null;
  defaultDate?: string;
  onClose: () => void;
  onCreate: (form: EventFormData) => void;
  onUpdate: (id: string, form: EventFormData) => void;
  onDelete: (id: string) => void;
}

function emptyForm(date: string): EventFormData {
  return {
    title: "",
    isAllDay: false,
    startDate: date,
    startTime: "09:00",
    endDate: date,
    endTime: "10:00",
    category: "flowsys",
    location: "",
    notes: "",
  };
}

function fromEvent(ev: CalendarEvent): EventFormData {
  const start = new Date(ev.startDatetime);
  const end = new Date(ev.endDatetime);
  return {
    title: ev.title,
    isAllDay: ev.isAllDay,
    startDate: localKey(start),
    startTime: timeOf(start),
    endDate: localKey(end),
    endTime: timeOf(end),
    category: ev.category,
    location: ev.location ?? "",
    notes: ev.notes ?? "",
  };
}

export function EventModal({ open, event, defaultDate, onClose, onCreate, onUpdate, onDelete }: EventModalProps) {
  const [form, setForm] = useState<EventFormData>(emptyForm(todayISO()));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = event !== null;

  useEffect(() => {
    if (open) {
      setForm(event ? fromEvent(event) : emptyForm(defaultDate ?? todayISO()));
      setError(null);
      setConfirmDelete(false);
    }
  }, [open, event, defaultDate]);

  function patch(p: Partial<EventFormData>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function handleSave() {
    if (!form.title.trim()) {
      setError("Dê um título ao evento.");
      return;
    }
    if (!form.isAllDay) {
      const s = `${form.startDate}T${form.startTime}`;
      const e = `${form.endDate}T${form.endTime}`;
      if (e <= s) {
        setError("O fim precisa ser depois do início.");
        return;
      }
    }
    if (isEdit && event) onUpdate(event.id, form);
    else onCreate(form);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar evento" : "Novo evento"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="ev-title">Título *</Label>
          <Input
            id="ev-title"
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Ex: Reunião com cliente"
            autoFocus
          />
          {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        </div>

        <div className="flex items-center justify-between rounded-input bg-panel px-3 py-2.5">
          <Label className="mb-0 flex items-center gap-1.5">
            <CalendarClock className="size-4" /> Dia inteiro
          </Label>
          <button
            type="button"
            role="switch"
            aria-checked={form.isAllDay}
            onClick={() => patch({ isAllDay: !form.isAllDay })}
            className={cn("relative h-6 w-11 rounded-full transition-colors", form.isAllDay ? "bg-brand" : "bg-surface border border-line")}
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-white shadow-soft transition-transform",
                form.isAllDay ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ev-start-date">Início</Label>
            <Input id="ev-start-date" type="date" value={form.startDate} onChange={(e) => patch({ startDate: e.target.value, endDate: form.endDate < e.target.value ? e.target.value : form.endDate })} />
          </div>
          {!form.isAllDay && (
            <div>
              <Label htmlFor="ev-start-time">Hora início</Label>
              <Input id="ev-start-time" type="time" value={form.startTime} onChange={(e) => patch({ startTime: e.target.value })} />
            </div>
          )}
          <div>
            <Label htmlFor="ev-end-date">Fim</Label>
            <Input id="ev-end-date" type="date" value={form.endDate} min={form.startDate} onChange={(e) => patch({ endDate: e.target.value })} />
          </div>
          {!form.isAllDay && (
            <div>
              <Label htmlFor="ev-end-time">Hora fim</Label>
              <Input id="ev-end-time" type="time" value={form.endTime} onChange={(e) => patch({ endTime: e.target.value })} />
            </div>
          )}
        </div>

        <div>
          <Label>Categoria</Label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_META) as Category[]).map((c) => {
              const active = form.category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => patch({ category: c })}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-badge border px-3 py-1.5 text-sm font-medium transition-colors",
                    active ? "border-transparent text-white" : "border-line text-muted hover:bg-panel hover:text-content",
                  )}
                  style={active ? { backgroundColor: CATEGORY_META[c].color } : undefined}
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: active ? "#fff" : CATEGORY_META[c].color }} />
                  {CATEGORY_META[c].label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label htmlFor="ev-loc">Local</Label>
          <Input id="ev-loc" value={form.location} onChange={(e) => patch({ location: e.target.value })} placeholder="Opcional" />
        </div>

        <div>
          <Label htmlFor="ev-notes">Notas</Label>
          <Textarea id="ev-notes" value={form.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="Opcional" />
        </div>

        {isEdit && event && (
          <div className="border-t border-line pt-4">
            {confirmDelete ? (
              <div className="flex items-center gap-2 rounded-input bg-danger/10 p-2">
                <span className="flex-1 text-sm text-danger">Excluir este evento?</span>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Não</Button>
                <Button variant="danger" size="sm" onClick={() => { onDelete(event.id); onClose(); }}>Sim, excluir</Button>
              </div>
            ) : (
              <Button variant="ghost" icon={Trash2} className="w-full justify-center text-danger" onClick={() => setConfirmDelete(true)}>
                Excluir evento
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
