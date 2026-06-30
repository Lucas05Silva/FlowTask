import { Calendar } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function CalendarioPage() {
  return (
    <ModulePlaceholder
      title="Calendário"
      subtitle="Visão mensal e diária de tarefas, eventos e entregas."
      icon={Calendar}
      emptyTitle="O Calendário está a caminho 📅"
      emptyDescription="Visões mensal e diária, com tarefas e prazos aparecendo automaticamente por categoria."
    />
  );
}
