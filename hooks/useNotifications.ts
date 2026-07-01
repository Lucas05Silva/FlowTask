"use client";

import { useCallback, useMemo } from "react";
import type { AppNotification, NotificationType } from "@/types";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/components/providers/AuthProvider";
import { updateData } from "@/lib/data/store";
import { todayISO, daysUntil, uid } from "@/lib/utils";

export function useNotifications() {
  const data = useData();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const notifications = useMemo(() => {
    if (!userId) return [];
    return (data.notifications || [])
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data.notifications, userId]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Helper: calculate days until dueDay of the month
  const getDaysUntilDueDay = (dueDay: number): number => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueThisMonth = new Date(now.getFullYear(), now.getMonth(), dueDay);

    if (dueThisMonth.getTime() === today.getTime()) {
      return 0;
    } else if (dueThisMonth.getTime() > today.getTime()) {
      return Math.round((dueThisMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      const dueNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
      return Math.round((dueNextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
  };

  // Add individual notification (in-app + console log preparing Supabase stub)
  const addNotification = useCallback(
    (notif: { type: NotificationType; title: string; message: string; link?: string; icon?: string }) => {
      if (!userId) return;

      const dateStr = todayISO();
      // Deduplicate: type + title + same day
      const isDuplicate = (data.notifications || []).some(
        (n) =>
          n.userId === userId &&
          n.type === notif.type &&
          n.title === notif.title &&
          n.createdAt.startsWith(dateStr) &&
          !n.isRead
      );

      if (isDuplicate) return;

      const newNotif: AppNotification = {
        id: uid("n"),
        userId,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        isRead: false,
        link: notif.link,
        icon: notif.icon,
        createdAt: new Date().toISOString(),
      };

      updateData((d) => {
        const list = [newNotif, ...(d.notifications || [])];
        // Limit: keep at most 100
        const limited = list.slice(0, 100);
        return {
          ...d,
          notifications: limited,
        };
      });
    },
    [userId, data.notifications]
  );

  // Run batch checking of tasks, projects, apartment, wedding, debts, goals, and streak risks
  const generateNotifications = useCallback(() => {
    if (!userId || !user) return;

    const newNotifications: Array<{
      type: NotificationType;
      title: string;
      message: string;
      link?: string;
    }> = [];

    // 1. Tasks
    (data.tasks || []).forEach((t) => {
      if (t.status === "concluida" || !t.dueDate) return;
      const d = daysUntil(t.dueDate);
      let type: NotificationType | null = null;
      let title = "";
      let message = "";

      if (d === 3) {
        type = "prazo";
        title = "Prazo de tarefa";
        message = `📋 '${t.title}' vence em 3 dias`;
      } else if (d === 1) {
        type = "prazo";
        title = "Tarefa vence amanhã";
        message = `📋 '${t.title}' vence amanhã!`;
      } else if (d === 0) {
        type = "prazo";
        title = "Tarefa vence hoje";
        message = `⚡ '${t.title}' vence HOJE!`;
      } else if (d < 0) {
        type = "atrasado";
        title = "Tarefa atrasada";
        message = `🚨 '${t.title}' está atrasada! Venceu há ${Math.abs(d)} dias`;
      }

      if (type) newNotifications.push({ type, title, message, link: "/tarefas" });
    });

    // 2. Projects
    (data.projects || []).forEach((p) => {
      if (p.status === "feito" || !p.deadline) return;
      const d = daysUntil(p.deadline);
      let type: NotificationType | null = null;
      let title = "";
      let message = "";

      if (d === 3) {
        type = "prazo";
        title = "Prazo de projeto";
        message = `💼 Projeto '${p.projectName}' vence em 3 dias`;
      } else if (d === 1) {
        type = "prazo";
        title = "Projeto vence amanhã";
        message = `💼 Projeto '${p.projectName}' vence amanhã!`;
      } else if (d === 0) {
        type = "prazo";
        title = "Projeto vence hoje";
        message = `⚡ Projeto '${p.projectName}' vence HOJE!`;
      } else if (d < 0) {
        type = "atrasado";
        title = "Projeto atrasado";
        message = `🚨 Projeto '${p.projectName}' está atrasado! Venceu há ${Math.abs(d)} dias`;
      }

      if (type) newNotifications.push({ type, title, message, link: "/projetos" });
    });

    // 3. Apartment Items
    (data.apartmentItems || []).forEach((i) => {
      if (i.status === "comprado" || i.status === "entregue" || !i.purchaseDeadline) return;
      const d = daysUntil(i.purchaseDeadline);
      let type: NotificationType | null = null;
      let title = "";
      let message = "";

      if (d === 3) {
        type = "prazo";
        title = "Compra de item do apê";
        message = `🏠 Item '${i.name}' planejado para compra em 3 dias`;
      } else if (d === 1) {
        type = "prazo";
        title = "Compra de item do apê";
        message = `🏠 Item '${i.name}' planejado para compra amanhã!`;
      } else if (d === 0) {
        type = "prazo";
        title = "Compra de item do apê";
        message = `⚡ Item '${i.name}' planejado para compra HOJE!`;
      } else if (d < 0) {
        type = "atrasado";
        title = "Compra de item atrasada";
        message = `🚨 Item '${i.name}' está atrasado para compra! Venceu há ${Math.abs(d)} dias`;
      }

      if (type) newNotifications.push({ type, title, message, link: "/apartamento" });
    });

    // 4. Wedding Tasks
    (data.weddingTasks || []).forEach((wt) => {
      if (wt.status === "concluida" || !wt.deadline) return;
      const d = daysUntil(wt.deadline);
      let type: NotificationType | null = null;
      let title = "";
      let message = "";

      if (d === 3) {
        type = "prazo";
        title = "Prazo do casamento";
        message = `💍 '${wt.title}' do casamento vence em 3 dias`;
      } else if (d === 1) {
        type = "prazo";
        title = "Prazo do casamento";
        message = `💍 '${wt.title}' do casamento vence amanhã!`;
      } else if (d === 0) {
        type = "prazo";
        title = "Prazo do casamento";
        message = `⚡ '${wt.title}' do casamento vence HOJE!`;
      } else if (d < 0) {
        type = "atrasado";
        title = "Casamento atrasado";
        message = `🚨 '${wt.title}' do casamento está atrasado! Venceu há ${Math.abs(d)} dias`;
      }

      if (type) newNotifications.push({ type, title, message, link: "/casamento" });
    });

    // 5. Debts
    (data.debts || []).forEach((db) => {
      if (db.status === "quitada") return;
      const diff = getDaysUntilDueDay(db.dueDay);
      if (diff <= 5) {
        let message = "";
        if (diff === 0) {
          message = `💰 Dívida '${db.name}' vence HOJE!`;
        } else {
          message = `💰 Dívida '${db.name}' vence dia ${db.dueDay} (em ${diff} dias)`;
        }
        newNotifications.push({
          type: "divida",
          title: "Vencimento de dívida",
          message,
          link: "/financeiro",
        });
      }
    });

    // 6. Goals
    (data.goals || []).forEach((g) => {
      if (g.status === "concluida" || !g.deadline) return;
      const pctVal = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
      if (pctVal < 80) {
        const d = daysUntil(g.deadline);
        if (d >= 0 && d <= 7) {
          newNotifications.push({
            type: "meta",
            title: "Meta próxima do prazo",
            message: `🎯 Meta '${g.title}' vence em ${d} dias e está em ${pctVal}%`,
            link: "/metas",
          });
        }
      }
    });

    // 7. Streak Risk
    if (user.streakCount > 0 && new Date().getHours() >= 18) {
      const today = todayISO();
      const isMe = (assignee: string) =>
        assignee === "ambos" || assignee === (user.name.toLowerCase() === "lucas" ? "lucas" : "thaiane");
      const completedToday = (data.tasks || []).some(
        (t) => t.status === "concluida" && t.completedAt?.startsWith(today) && (isMe(t.assignee) || t.createdBy === userId)
      );

      if (!completedToday) {
        newNotifications.push({
          type: "streak",
          title: "Streak em risco!",
          message: `🔥 Seu streak de ${user.streakCount} dias está em risco! Conclua uma tarefa hoje.`,
          link: "/tarefas",
        });
      }
    }

    // Insert only if not duplicate
    const dateStr = todayISO();
    const finalToInsert: AppNotification[] = [];

    newNotifications.forEach((n) => {
      const isDup = (data.notifications || []).some(
        (old) =>
          old.userId === userId &&
          old.type === n.type &&
          old.title === n.title &&
          old.createdAt.startsWith(dateStr) &&
          !old.isRead
      );

      if (!isDup) {
        finalToInsert.push({
          id: uid("n"),
          userId,
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: false,
          link: n.link,
          createdAt: new Date().toISOString(),
        });
      }
    });

    if (finalToInsert.length > 0) {
      updateData((d) => {
        const merged = [...finalToInsert, ...(d.notifications || [])];
        return {
          ...d,
          notifications: merged.slice(0, 100),
        };
      });
    }
  }, [userId, user, data.tasks, data.projects, data.apartmentItems, data.weddingTasks, data.debts, data.goals, data.notifications]);

  // Mark notification read
  const markAsRead = useCallback((id: string) => {
    updateData((d) => ({
      ...d,
      notifications: (d.notifications || []).map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    }));
  }, []);

  // Mark all notifications read
  const markAllAsRead = useCallback(() => {
    if (!userId) return;
    updateData((d) => ({
      ...d,
      notifications: (d.notifications || []).map((n) => (n.userId === userId ? { ...n, isRead: true } : n)),
    }));
  }, [userId]);

  // Remove read notifications
  const clearRead = useCallback(() => {
    if (!userId) return;
    updateData((d) => ({
      ...d,
      notifications: (d.notifications || []).filter((n) => n.userId !== userId || !n.isRead),
    }));
  }, [userId]);

  return {
    notifications,
    unreadCount,
    addNotification,
    generateNotifications,
    markAsRead,
    markAllAsRead,
    clearRead,
  };
}
