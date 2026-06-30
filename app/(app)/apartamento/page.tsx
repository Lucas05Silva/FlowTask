import { Sofa } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function ApartamentoPage() {
  return (
    <ModulePlaceholder
      title="Apartamento"
      subtitle="Planejamento da mobília do apê, cômodo por cômodo."
      icon={Sofa}
      emptyTitle="Vamos mobiliar o ninho 🛋️"
      emptyDescription="Checklist de itens por cômodo, orçamento estimado vs gasto e progresso geral do apartamento."
    />
  );
}
