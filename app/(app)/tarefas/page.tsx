import { CheckSquare } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function TarefasPage() {
  return (
    <ModulePlaceholder
      title="Tarefas"
      subtitle="Organize o dia a dia da dupla, por categoria e prioridade."
      icon={CheckSquare}
      emptyTitle="O módulo de Tarefas chega na próxima fase! 🚀"
      emptyDescription="Aqui você vai criar tarefas com subtarefas, prioridades, recorrência, drag-and-drop e ganhar XP ao concluir."
    />
  );
}
