import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface/50 px-6 py-14 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-brand/10 text-brand">
        <Icon className="size-8" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-content">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
