"use client";

import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CanadaPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Canadá 🍁" subtitle="A jornada rumo ao Canadá — em breve por aqui." />
      <EmptyState
        icon={MapPin}
        title="Seção em preparação"
        description="Em breve você poderá acompanhar tudo sobre a jornada para o Canadá aqui."
      />
    </div>
  );
}
