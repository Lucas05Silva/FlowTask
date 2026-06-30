import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  hover?: boolean;
}

export function Card({ className, padded = true, hover = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface shadow-soft",
        padded && "p-5",
        hover && "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex items-center justify-between gap-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold text-content", className)} {...props} />;
}
