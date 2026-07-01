"use client";

import {
  Clock,
  AlertTriangle,
  DollarSign,
  Target,
  Trophy,
  ArrowUp,
  Flame,
  Info,
  type LucideIcon,
} from "lucide-react";
import type { AppNotification, NotificationType } from "@/types";
import { relativeTime, cn } from "@/lib/utils";

const TYPE_META: Record<NotificationType, { icon: LucideIcon; color: string }> = {
  prazo: { icon: Clock, color: "var(--prio-alta)" },
  atrasado: { icon: AlertTriangle, color: "var(--danger)" },
  divida: { icon: DollarSign, color: "var(--prio-alta)" },
  meta: { icon: Target, color: "var(--brand-purple)" },
  conquista: { icon: Trophy, color: "#F59E0B" },
  levelup: { icon: ArrowUp, color: "var(--brand-purple)" },
  streak: { icon: Flame, color: "#F97316" },
  info: { icon: Info, color: "var(--cyan-dark)" },
};

interface NotificationItemProps {
  notification: AppNotification;
  onClick?: (n: AppNotification) => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const meta = TYPE_META[notification.type] ?? TYPE_META.info;
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={() => onClick?.(notification)}
      className={cn(
        "flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-0 hover:bg-panel",
        !notification.isRead && "bg-brand/5",
      )}
    >
      <span
        className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
      >
        <Icon className="size-4.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-content">{notification.title}</span>
          <span className="shrink-0 text-[11px] text-muted">{relativeTime(notification.createdAt)}</span>
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-muted">{notification.message}</span>
      </span>
      {!notification.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-label="Não lida" />}
    </button>
  );
}
