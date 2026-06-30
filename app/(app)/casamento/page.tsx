import { HeartHandshake } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function CasamentoPage() {
  return (
    <ModulePlaceholder
      title="Casamento"
      subtitle="Tudo do grande dia: tarefas, orçamento, fornecedores e cronograma."
      icon={HeartHandshake}
      emptyTitle="Rumo ao 'sim, eu aceito' 💍"
      emptyDescription="Checklist do casamento, orçamento por categoria, fornecedores e contagem regressiva para a data."
    />
  );
}
