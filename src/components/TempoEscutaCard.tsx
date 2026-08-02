import { useState } from "react";
import { Clock } from "lucide-react";

// ----------------------------------------------------------------------------
// Card de tempo de reprodução com alternância Horas / Minutos.
// Aceita valores nulos/indefinidos da API sem quebrar (fallback = 0).
// ----------------------------------------------------------------------------

type Unidade = "horas" | "minutos";

export function TempoEscutaCard({
  totalMinutos,
  carregando = false,
  label = "Tempo ouvido",
}: {
  totalMinutos: number | null | undefined;
  carregando?: boolean;
  label?: string;
}) {
  const [unidade, setUnidade] = useState<Unidade>("minutos");

  const minutos = Number.isFinite(Number(totalMinutos)) ? Math.max(0, Number(totalMinutos)) : 0;
  const horas = minutos / 60;

  const valor =
    unidade === "minutos"
      ? Math.round(minutos).toLocaleString("pt-BR")
      : horas.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  const dica =
    unidade === "minutos"
      ? `≈ ${horas.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`
      : `≈ ${Math.round(minutos).toLocaleString("pt-BR")} min`;

  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <Clock className="size-4 shrink-0 text-primary" />
      </div>

      <p className="mt-3 font-display text-2xl font-bold md:text-3xl">
        {carregando ? "…" : valor}
        <span className="ml-1 text-sm font-medium text-muted-foreground">
          {unidade === "minutos" ? "min" : "h"}
        </span>
      </p>

      <div
        className="mt-3 inline-flex rounded-full border border-border bg-surface-2 p-0.5"
        role="group"
        aria-label="Unidade do tempo de reprodução"
      >
        {(["horas", "minutos"] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setUnidade(u)}
            aria-pressed={unidade === u}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
              unidade === u
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {u}
          </button>
        ))}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">{carregando ? "carregando…" : dica}</p>
    </div>
  );
}
