import {
  Home,
  Utensils,
  Car,
  HeartPulse,
  GraduationCap,
  Gamepad2,
  CreditCard,
  Landmark,
  Repeat,
  TrendingUp,
  Package,
  type LucideIcon,
} from "lucide-react";
import type { MonthlyExpenseCategory, ExpenseRecurrence } from "@/types";

export const EXPENSE_CATEGORY_META: Record<
  MonthlyExpenseCategory,
  { label: string; color: string; icon: LucideIcon }
> = {
  moradia: { label: "Moradia", color: "var(--cat-apartamento)", icon: Home },
  alimentacao: { label: "Alimentação", color: "var(--cat-financeiro)", icon: Utensils },
  transporte: { label: "Transporte", color: "var(--cat-pessoal)", icon: Car },
  saude: { label: "Saúde", color: "var(--danger)", icon: HeartPulse },
  educacao: { label: "Educação", color: "var(--info)", icon: GraduationCap },
  lazer: { label: "Lazer", color: "var(--cat-casamento)", icon: Gamepad2 },
  cartao: { label: "Cartão", color: "var(--brand-purple)", icon: CreditCard },
  financiamento: { label: "Financ.", color: "var(--brand-purple-deep)", icon: Landmark },
  assinatura: { label: "Assinatura", color: "var(--cyan-dark)", icon: Repeat },
  investimento: { label: "Investimento", color: "var(--success)", icon: TrendingUp },
  outro: { label: "Outro", color: "var(--text-secondary)", icon: Package },
};

export const EXPENSE_CATEGORY_OPTIONS = (Object.keys(EXPENSE_CATEGORY_META) as MonthlyExpenseCategory[]).filter(
  (c) => c !== "investimento", // aportes são calculados automaticamente — não editáveis aqui
);

export const RECURRENCE_META: Record<ExpenseRecurrence, { label: string }> = {
  mensal: { label: "Mensal" },
  parcelado: { label: "Parcelado" },
  eventual: { label: "Eventual" },
};
