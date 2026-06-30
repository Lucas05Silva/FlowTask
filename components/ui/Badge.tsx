import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Solid color via CSS var (e.g. "var(--cat-flowsys)"). Renders a soft tinted pill. */
  color?: string;
  variant?: "soft" | "solid" | "outline";
}

export function Badge({ color, variant = "soft", className, style, children, ...props }: BadgeProps) {
  const base =
    "inline-flex items-center gap-1.5 rounded-badge px-2.5 py-0.5 text-xs font-medium leading-5";

  if (color && variant === "soft") {
    return (
      <span
        className={cn(base, className)}
        style={{ color, backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`, ...style }}
        {...props}
      >
        {children}
      </span>
    );
  }
  if (color && variant === "solid") {
    return (
      <span className={cn(base, "text-white", className)} style={{ backgroundColor: color, ...style }} {...props}>
        {children}
      </span>
    );
  }
  if (color && variant === "outline") {
    return (
      <span className={cn(base, "border", className)} style={{ color, borderColor: color, ...style }} {...props}>
        {children}
      </span>
    );
  }
  return (
    <span className={cn(base, "bg-panel text-muted", className)} style={style} {...props}>
      {children}
    </span>
  );
}
