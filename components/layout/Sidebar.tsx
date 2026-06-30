"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { Logo } from "@/components/Logo";
import { Ranking } from "@/components/gamification/Ranking";
import { cn } from "@/lib/utils";

/**
 * Sidebar — responsive collapse via CSS only (no hydration flicker):
 *  - <768px (mobile): hidden (MobileNav takes over)
 *  - 768–1023px (tablet): icons-only, 76px
 *  - ≥1024px (desktop): full width with labels + ranking
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-panel md:flex md:w-[76px] lg:w-64">
      <div className="flex h-16 items-center justify-center border-b border-line px-2 lg:justify-start lg:px-5">
        <span className="lg:hidden">
          <Logo showText={false} />
        </span>
        <span className="hidden lg:inline">
          <Logo />
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "group relative flex items-center justify-center gap-3 rounded-input px-0 py-2.5 text-sm font-medium transition-all lg:justify-start lg:px-3",
                active
                  ? "bg-surface text-brand-dark shadow-soft"
                  : "text-muted hover:scale-[1.02] hover:bg-surface/60 hover:text-content",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand" />
              )}
              <Icon className={cn("size-5 shrink-0", active && "text-brand")} aria-hidden />
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-line p-3 lg:block">
        <Ranking variant="sidebar" />
      </div>
    </aside>
  );
}
