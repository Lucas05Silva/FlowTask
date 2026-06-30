import { Wallet } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function FinanceiroPage() {
  return (
    <ModulePlaceholder
      title="Financeiro"
      subtitle="Entradas, saídas, dívidas e metas de economia."
      icon={Wallet}
      emptyTitle="O módulo Financeiro chega já já 💰"
      emptyDescription="Gráficos de entradas vs saídas, controle de dívidas, metas financeiras e sugestões de economia."
    />
  );
}
