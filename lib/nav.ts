import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CheckSquare,
  Briefcase,
  Wallet,
  TrendingUp,
  Target,
  HeartHandshake,
  NotebookPen,
  MapPin,
  ClipboardList,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom tab bar (max 5). */
  primaryMobile?: boolean;
  /** Small pill next to the label (e.g. "Pessoal" for per-user pages). */
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, primaryMobile: true },
  { href: "/tarefas", label: "Tarefas", icon: CheckSquare, primaryMobile: true },
  { href: "/projetos", label: "Projetos", icon: Briefcase, primaryMobile: true },
  { href: "/canada", label: "Canadá", icon: MapPin, primaryMobile: true },
  { href: "/financeiro", label: "Financeiro", icon: Wallet, primaryMobile: true },
  { href: "/investimentos", label: "Investimentos", icon: TrendingUp },
  { href: "/organizacao", label: "Organização", icon: ClipboardList, badge: "Pessoal" },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/notas", label: "Notas", icon: NotebookPen },
  { href: "/casamento", label: "Casamento", icon: HeartHandshake },
];

export const PRIMARY_MOBILE_ITEMS = NAV_ITEMS.filter((i) => i.primaryMobile);
export const DRAWER_ITEMS = NAV_ITEMS.filter((i) => !i.primaryMobile);
