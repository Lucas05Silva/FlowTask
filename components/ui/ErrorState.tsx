import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Não foi possível carregar os dados.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-danger/40 bg-surface/50 px-6 py-12 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="size-7" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-content">Ops, algo deu errado</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="outline" icon={RotateCw} className="mt-5" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
