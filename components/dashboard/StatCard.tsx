import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  accent?: string; // CSS color/var
}

export function StatCard({ icon: Icon, label, value, hint, accent = "var(--brand-purple)" }: StatCardProps) {
  return (
    <Card hover className="flex items-center gap-4">
      <span
        className="grid size-12 shrink-0 place-items-center rounded-input"
        style={{ backgroundColor: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="truncate text-xl font-bold text-content">{value}</p>
        {hint && <p className="truncate text-xs text-muted">{hint}</p>}
      </div>
    </Card>
  );
}
