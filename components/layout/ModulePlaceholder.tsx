import type { LucideIcon } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

interface ModulePlaceholderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
}

export function ModulePlaceholder({
  title,
  subtitle,
  icon,
  emptyTitle,
  emptyDescription,
}: ModulePlaceholderProps) {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={title} subtitle={subtitle} />
      <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
    </div>
  );
}
