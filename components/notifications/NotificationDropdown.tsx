"use client";

import { motion } from "framer-motion";
import { CheckCheck, BellOff } from "lucide-react";
import type { AppNotification } from "@/types";
import { NotificationItem } from "./NotificationItem";

interface NotificationDropdownProps {
  notifications: AppNotification[];
  unreadCount: number;
  onItemClick: (n: AppNotification) => void;
  onMarkAll: () => void;
  onSeeAll: () => void;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onItemClick,
  onMarkAll,
  onSeeAll,
}: NotificationDropdownProps) {
  const recent = notifications.slice(0, 20);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-x-2 top-16 z-50 max-h-[60vh] overflow-hidden rounded-card border border-line bg-surface shadow-pop sm:absolute sm:inset-x-auto sm:right-0 sm:top-13 sm:max-h-[480px] sm:w-[380px]"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-semibold text-content">Notificações</p>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAll}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand transition-colors hover:text-brand-dark"
          >
            <CheckCheck className="size-3.5" /> Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="max-h-[calc(60vh-96px)] overflow-y-auto sm:max-h-[384px]">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <BellOff className="size-8 text-muted opacity-50" aria-hidden />
            <p className="text-sm text-muted">Tudo em dia! 🎉</p>
          </div>
        ) : (
          recent.map((n) => <NotificationItem key={n.id} notification={n} onClick={onItemClick} />)
        )}
      </div>

      <button
        onClick={onSeeAll}
        className="w-full border-t border-line px-4 py-3 text-center text-sm font-medium text-brand transition-colors hover:bg-panel"
      >
        Ver todas
      </button>
    </motion.div>
  );
}
