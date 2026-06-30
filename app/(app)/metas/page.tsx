import { Target } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function MetasPage() {
  return (
    <ModulePlaceholder
      title="Metas"
      subtitle="O hub que reúne todas as metas da plataforma."
      icon={Target}
      emptyTitle="Suas metas vão morar aqui 🎯"
      emptyDescription="Metas financeiras, de projetos, pessoais, do apê e do casamento — com progresso e XP de recompensa."
    />
  );
}
