import { Briefcase } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function ProjetosPage() {
  return (
    <ModulePlaceholder
      title="Projetos FlowSys"
      subtitle="Controle das entregas de clientes da FlowSys LT."
      icon={Briefcase}
      emptyTitle="Projetos FlowSys em breve 💼"
      emptyDescription="Acompanhe clientes, etapas, deadlines e valores — com XP bônus a cada projeto entregue."
    />
  );
}
