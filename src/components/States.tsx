import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <p className="font-semibold">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Não consegui carregar",
  description = "Confira se o backend está no ar e tente de novo.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground"
        >
          Tentar de novo
        </button>
      ) : null}
    </div>
  );
}

/** Linhas de esqueleto para listas (histórico, top artistas, recentes). */
export function SkeletonList({ rows = 5, avatar = false }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {avatar ? <Skeleton className="size-11 shrink-0 rounded-xl" /> : null}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`h-32 rounded-2xl ${className}`} />
      ))}
    </>
  );
}
