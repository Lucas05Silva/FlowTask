"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import type { AppNotification } from "@/types";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationDropdown } from "./NotificationDropdown";

export function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, generateNotifications, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const didGenerate = useRef(false);

  // Run the batch check once, shortly after mount (login / app open).
  useEffect(() => {
    if (didGenerate.current) return;
    didGenerate.current = true;
    const id = setTimeout(() => generateNotifications(), 400);
    return () => clearTimeout(id);
  }, [generateNotifications]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleItemClick(n: AppNotification) {
    markAsRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notificações${unreadCount > 0 ? `, ${unreadCount} não lidas` : ""}`}
        aria-expanded={open}
        className="relative grid size-11 place-items-center rounded-input text-muted transition-colors hover:bg-panel hover:text-content"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0.5 }}
            animate={{ scale: [1.4, 1] }}
            transition={{ duration: 0.35 }}
            className="absolute right-1.5 top-1.5 grid min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40 bg-black/20 sm:hidden" onClick={() => setOpen(false)} aria-hidden />
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onItemClick={handleItemClick}
              onMarkAll={markAllAsRead}
              onSeeAll={() => {
                setOpen(false);
                router.push("/notificacoes");
              }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
