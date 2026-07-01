"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "./ThemeToggle";

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
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useClickOutside<HTMLDivElement>(() => setMenuOpen(false));

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

        <NotificationBell />

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
