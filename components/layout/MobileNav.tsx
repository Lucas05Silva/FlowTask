"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal, X } from "lucide-react";
import { PRIMARY_MOBILE_ITEMS, DRAWER_ITEMS } from "@/lib/nav";
import { Ranking } from "@/components/gamification/Ranking";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-line bg-surface/95 backdrop-blur-md md:hidden">
        {PRIMARY_MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                active ? "text-brand" : "text-muted",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setDrawer(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted"
          aria-label="Mais módulos"
        >
          <MoreHorizontal className="size-5" />
          Mais
        </button>
      </nav>

      <AnimatePresence>
        {drawer && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-line bg-surface p-5 pb-8"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-content">Mais módulos</h3>
                <button onClick={() => setDrawer(false)} aria-label="Fechar" className="grid size-9 place-items-center rounded-input text-muted hover:bg-panel">
                  <X className="size-5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {DRAWER_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawer(false)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-card border border-line p-4 text-sm font-medium transition-colors",
                        isActive(item.href) ? "bg-brand/10 text-brand" : "text-content hover:bg-panel",
                      )}
                    >
                      <Icon className="size-6" aria-hidden />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              <div className="mt-5 rounded-card border border-line p-4">
                <Ranking variant="sidebar" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
