import { CheckSquare, Calendar, Briefcase, DollarSign, Heart, type LucideIcon } from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  CheckSquare,
  Calendar,
  Briefcase,
  DollarSign,
  Heart,
};

/** Resolve a Lucide icon component from a CalendarItem icon name. */
export function iconFor(name: string): LucideIcon {
  return MAP[name] ?? Calendar;
}
