import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Briefcase,
  Wallet,
  Target,
  Sofa,
  HeartHandshake,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom tab bar (max 5). */
  primaryMobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, primaryMobile: true },
  { href: "/tarefas", label: "Tarefas", icon: CheckSquare, primaryMobile: true },
  { href: "/calendario", label: "Calendário", icon: Calendar, primaryMobile: true },
  { href: "/projetos", label: "Projetos", icon: Briefcase, primaryMobile: true },
  { href: "/financeiro", label: "Financeiro", icon: Wallet, primaryMobile: true },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/apartamento", label: "Apê", icon: Sofa },
  { href: "/casamento", label: "Casamento", icon: HeartHandshake },
];

export const PRIMARY_MOBILE_ITEMS = NAV_ITEMS.filter((i) => i.primaryMobile);
export const DRAWER_ITEMS = NAV_ITEMS.filter((i) => !i.primaryMobile);
