"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/hooks/useData";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}

export function Header() {
  const { user, logout } = useAuth();
  const data = useData();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const notifRef = useClickOutside<HTMLDivElement>(() => setNotifOpen(false));
  const menuRef = useClickOutside<HTMLDivElement>(() => setMenuOpen(false));

  const myNotifs = useMemo(
    () => data.notifications.filter((n) => n.userId === user?.id).slice(0, 8),
    [data.notifications, user?.id],
  );
  const unread = myNotifs.filter((n) => !n.isRead).length;

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/80 px-4 backdrop-blur-md lg:px-6">
      <div className="md:hidden">
        <Logo showText={false} />
      </div>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          placeholder="Buscar tarefas, projetos…"
          className="h-10 w-full rounded-input border border-line bg-panel/60 pl-9 pr-3 text-sm text-content placeholder:text-muted focus:border-brand focus-visible:outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            aria-label="Notificações"
            className="relative grid size-11 place-items-center rounded-input text-muted transition-colors hover:bg-panel hover:text-content"
          >
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute right-2 top-2 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-13 w-80 overflow-hidden rounded-card border border-line bg-surface shadow-pop">
              <div className="border-b border-line px-4 py-3 text-sm font-semibold text-content">
                Notificações
              </div>
              <div className="max-h-80 overflow-y-auto">
                {myNotifs.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted">Tudo em dia! 🎉</p>
                ) : (
                  myNotifs.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "border-b border-line px-4 py-3 last:border-0",
                        !n.isRead && "bg-brand/5",
                      )}
                    >
                      <p className="text-sm font-medium text-content">{n.title}</p>
                      <p className="text-xs text-muted">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu do perfil"
            className="ml-1 rounded-full transition-transform hover:scale-105"
          >
            <Avatar user={user} size={36} ring />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 w-52 overflow-hidden rounded-card border border-line bg-surface shadow-pop">
              <div className="border-b border-line px-4 py-3">
                <p className="text-sm font-semibold text-content">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              <Link
                href="/perfil"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-content transition-colors hover:bg-panel"
              >
                <UserIcon className="size-4" /> Meu perfil
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger transition-colors hover:bg-panel"
              >
                <LogOut className="size-4" /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
