"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Trash2, BellOff } from "lucide-react";
import type { AppNotification, NotificationType } from "@/types";
import { useNotifications } from "@/hooks/useNotifications";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotificationItem } from "./NotificationItem";
import { cn } from "@/lib/utils";

type Filter = "all" | "unread" | NotificationType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "unread", label: "Não lidas" },
  { value: "prazo", label: "Prazos" },
  { value: "atrasado", label: "Atrasados" },
  { value: "divida", label: "Dívidas" },
  { value: "meta", label: "Metas" },
  { value: "conquista", label: "Conquistas" },
  { value: "levelup", label: "Nível" },
  { value: "streak", label: "Streak" },
];

export function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "unread") return notifications.filter((n) => !n.isRead);
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const readCount = notifications.length - unreadCount;

  function handleItemClick(n: AppNotification) {
    markAsRead(n.id);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notificações"
        subtitle="Seu histórico de alertas, prazos e conquistas."
        action={
          <div className="hidden gap-2 sm:flex">
            <Button variant="ghost" size="sm" icon={CheckCheck} onClick={markAllAsRead} disabled={unreadCount === 0}>
              Marcar todas como lidas
            </Button>
            <Button variant="ghost" size="sm" icon={Trash2} onClick={clearRead} disabled={readCount === 0}>
              Limpar lidas
            </Button>
          </div>
        }
      />

      {/* Mobile actions */}
      <div className="mb-4 flex gap-2 sm:hidden">
        <Button variant="outline" size="sm" icon={CheckCheck} onClick={markAllAsRead} disabled={unreadCount === 0} className="flex-1 justify-center">
          Marcar lidas
        </Button>
        <Button variant="outline" size="sm" icon={Trash2} onClick={clearRead} disabled={readCount === 0} className="flex-1 justify-center">
          Limpar lidas
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-badge border px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.value
                ? "border-transparent bg-brand text-white"
                : "border-line text-muted hover:bg-panel hover:text-content",
            )}
          >
            {f.label}
            {f.value === "unread" && unreadCount > 0 && <span className="ml-1">({unreadCount})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={notifications.length === 0 ? "Nenhuma notificação" : "Nada por aqui"}
          description={
            notifications.length === 0
              ? "Quando houver prazos, conquistas ou alertas, eles aparecem aqui. 🔔"
              : "Nenhuma notificação corresponde a esse filtro."
          }
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          {filtered.map((n) => (
            <NotificationItem key={n.id} notification={n} onClick={handleItemClick} />
          ))}
        </Card>
      )}
    </div>
  );
}
