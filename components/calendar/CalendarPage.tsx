"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { CalendarEvent } from "@/types";
import type { CalendarItem } from "@/lib/calendar";
import { MONTH_NAMES, dateFromKey } from "@/lib/calendar";
import { useCalendar } from "@/hooks/useCalendar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CalendarNavigation } from "./CalendarNavigation";
import { MonthView } from "./MonthView";
import { DayView } from "./DayView";
import { EventModal } from "./EventModal";

export function CalendarPage() {
  const router = useRouter();
  const cal = useCalendar();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const dayItems = useMemo(() => cal.getItemsForDate(cal.selectedKey), [cal]);

  const title = useMemo(() => {
    if (cal.viewMode === "month") {
      return `${MONTH_NAMES[cal.cursor.getMonth()]} ${cal.cursor.getFullYear()}`;
    }
    return dateFromKey(cal.selectedKey).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [cal.viewMode, cal.cursor, cal.selectedKey]);

  function openNew() {
    setEditingEvent(null);
    setModalOpen(true);
  }

  function handleItemClick(item: CalendarItem) {
    if (item.type === "event") {
      const ev = cal.events.find((e) => e.id === item.originalId) ?? null;
      setEditingEvent(ev);
      setModalOpen(true);
    } else if (item.type === "task") {
      router.push("/tarefas");
    }
  }

  const isMonth = cal.viewMode === "month";

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Calendário"
        subtitle="Tarefas, entregas e eventos — tudo num só lugar."
        action={
          <Button icon={Plus} onClick={openNew} className="hidden md:inline-flex">
            Novo evento
          </Button>
        }
      />

      <Card>
        <div className="mb-4">
          <CalendarNavigation
            title={title}
            view={cal.viewMode}
            onViewChange={cal.setView}
            onToday={cal.goToToday}
            onPrev={() => (isMonth ? cal.navigateMonth(-1) : cal.navigateDay(-1))}
            onNext={() => (isMonth ? cal.navigateMonth(1) : cal.navigateDay(1))}
            prevLabel={isMonth ? "Mês anterior" : "Dia anterior"}
            nextLabel={isMonth ? "Próximo mês" : "Próximo dia"}
          />
        </div>

        {isMonth ? (
          <MonthView
            cursor={cal.cursor}
            selectedKey={cal.selectedKey}
            monthItems={cal.monthItems}
            direction={cal.direction}
            onSelectDate={cal.selectDate}
          />
        ) : (
          <DayView
            selectedKey={cal.selectedKey}
            direction={cal.direction}
            dayItems={dayItems}
            onItemClick={handleItemClick}
            onNewEvent={openNew}
          />
        )}
      </Card>

      {/* Mobile FAB */}
      <button
        onClick={openNew}
        aria-label="Novo evento"
        className="fixed bottom-20 right-4 z-30 grid size-14 place-items-center rounded-full bg-brand text-white shadow-pop transition-transform hover:scale-105 active:scale-95 md:hidden"
      >
        <Plus className="size-6" />
      </button>

      <EventModal
        open={modalOpen}
        event={editingEvent}
        defaultDate={cal.selectedKey}
        onClose={() => setModalOpen(false)}
        onCreate={cal.createEvent}
        onUpdate={cal.updateEvent}
        onDelete={cal.deleteEvent}
      />
    </div>
  );
}
