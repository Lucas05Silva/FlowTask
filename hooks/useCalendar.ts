"use client";

import { useCallback, useMemo, useState } from "react";
import type { Category, CalendarEvent } from "@/types";
import { updateData } from "@/lib/data/store";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  aggregateItems,
  dateFromKey,
  itemsForDate,
  itemsForMonth,
  localKey,
} from "@/lib/calendar";
import { uid } from "@/lib/utils";

export type CalendarViewMode = "month" | "day";

export interface EventFormData {
  title: string;
  isAllDay: boolean;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string;
  endTime: string;
  category: Category;
  location: string;
  notes: string;
}

function buildEvent(form: EventFormData): Omit<CalendarEvent, "id" | "createdBy" | "createdAt"> {
  const start = form.isAllDay ? `${form.startDate}T00:00:00` : `${form.startDate}T${form.startTime}:00`;
  const end = form.isAllDay ? `${form.endDate}T23:59:59` : `${form.endDate}T${form.endTime}:00`;
  return {
    title: form.title.trim(),
    startDatetime: start,
    endDatetime: end,
    category: form.category,
    location: form.location.trim() || null,
    notes: form.notes.trim() || null,
    isAllDay: form.isAllDay,
  };
}

export function useCalendar() {
  const data = useData();
  const { user } = useAuth();

  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [selectedKey, setSelectedKey] = useState<string>(() => localKey(new Date()));
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [direction, setDirection] = useState(0);

  const items = useMemo(() => aggregateItems(data), [data]);
  const monthItems = useMemo(
    () => itemsForMonth(items, cursor.getFullYear(), cursor.getMonth()),
    [items, cursor],
  );

  const focusMonthOf = (d: Date) => setCursor(new Date(d.getFullYear(), d.getMonth(), 1));

  const navigateMonth = useCallback((delta: number) => {
    setDirection(delta);
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }, []);

  const navigateDay = useCallback(
    (delta: number) => {
      setDirection(delta);
      const d = dateFromKey(selectedKey);
      d.setDate(d.getDate() + delta);
      setSelectedKey(localKey(d));
      focusMonthOf(d);
    },
    [selectedKey],
  );

  const goToToday = useCallback(() => {
    setDirection(0);
    const t = new Date();
    setSelectedKey(localKey(t));
    focusMonthOf(t);
  }, []);

  const selectDate = useCallback((key: string) => {
    setSelectedKey(key);
    focusMonthOf(dateFromKey(key));
    setViewMode("day");
  }, []);

  const setView = useCallback(
    (v: CalendarViewMode) => {
      if (v === "month") focusMonthOf(dateFromKey(selectedKey));
      setViewMode(v);
    },
    [selectedKey],
  );

  const toggleView = useCallback(() => setView(viewMode === "month" ? "day" : "month"), [viewMode, setView]);

  const createEvent = useCallback(
    (form: EventFormData) => {
      if (!user) return;
      const event: CalendarEvent = {
        ...buildEvent(form),
        id: uid("e"),
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      };
      updateData((d) => ({ ...d, events: [...d.events, event] }));
    },
    [user],
  );

  const updateEvent = useCallback((id: string, form: EventFormData) => {
    updateData((d) => ({
      ...d,
      events: d.events.map((e) => (e.id === id ? { ...e, ...buildEvent(form) } : e)),
    }));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    updateData((d) => ({ ...d, events: d.events.filter((e) => e.id !== id) }));
  }, []);

  const getItemsForDate = useCallback((key: string) => itemsForDate(items, key), [items]);

  return {
    cursor,
    selectedKey,
    viewMode,
    direction,
    items,
    monthItems,
    events: data.events,
    navigateMonth,
    navigateDay,
    goToToday,
    selectDate,
    setView,
    toggleView,
    getItemsForDate,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
