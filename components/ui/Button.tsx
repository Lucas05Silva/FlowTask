"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-soft hover:bg-brand-light hover:text-brand-dark",
  secondary:
    "bg-cyan-dark text-white hover:opacity-90",
  ghost:
    "bg-transparent text-content hover:bg-panel",
  outline:
    "bg-transparent text-content border border-line hover:bg-panel",
  danger:
    "bg-danger text-white hover:opacity-90",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-11 w-11 justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", icon: Icon, iconRight: IconRight, loading, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center rounded-input font-medium font-[family-name:var(--font-montserrat)]",
        "transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon className="size-4 shrink-0" aria-hidden />
      )}
      {children}
      {IconRight && <IconRight className="size-4 shrink-0" aria-hidden />}
    </button>
  );
});
