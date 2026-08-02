import { createFileRoute } from "@tanstack/react-router";
import { Lock, Trophy } from "lucide-react";

import { AppShell, PageHeader } from "@/components/AppShell";
import { SkeletonCards } from "@/components/States";
import { CATALOGO_CONQUISTAS, useCatalogoConquistas, usePerfilConquistas } from "@/lib/queries";

export const Route = createFileRoute("/conquistas")({
  head: () => ({
    meta: [
      { title: "Conquistas musicais — Sonora" },
      {
        name: "description",
        content:
          "Desbloqueie conquistas conforme explora artistas, gêneros e horários diferentes de audição.",
      },
      { property: "og:title", content: "Conquistas musicais — Sonora" },
      {
        property: "og:description",
        content: "Badges para quem leva a vida musical a sério.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Conquistas,
});

function Conquistas() {
  const { data: desbloqueadas = [], isLoading } = usePerfilConquistas();
  const porChave = new Map(desbloqueadas.map((c) => [c.chave, c]));

  // Catálogo vem do backend (33+ conquistas); a lista local é só fallback.
  const { data: catalogo } = useCatalogoConquistas();
  const achievements = (catalogo?.length ? catalogo : CATALOGO_CONQUISTAS).map((def) => ({
    ...def,
    desbloqueada: porChave.get(def.chave),
  }));
  const unlocked = achievements.filter((a) => a.desbloqueada).length;
  const pct = Math.round((unlocked / achievements.length) * 100);

  return (
    <AppShell>
      <PageHeader
        title="Conquistas"
        subtitle={
          isLoading ? "Carregando…" : `${unlocked} de ${achievements.length} desbloqueadas.`
        }
      />

      <div className="surface-card mb-4 p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Progresso geral</span>
          <span className="text-muted-foreground">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{ width: `${pct}%`, background: "var(--gradient-brand)" }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? <SkeletonCards count={6} /> : null}
        {!isLoading &&
          achievements.map((a) => (
            <div
              key={a.chave}
              className={`surface-card p-5 transition-transform hover:-translate-y-0.5 ${
                a.desbloqueada ? "glow-shadow" : "opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                    a.desbloqueada
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {a.desbloqueada ? <Trophy className="size-5" /> : <Lock className="size-5" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.titulo}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {a.desbloqueada
                      ? `Desbloqueada em ${new Date(
                          a.desbloqueada.desbloqueada_em,
                        ).toLocaleDateString("pt-BR")}`
                      : "Bloqueada"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{a.descricao}</p>
            </div>
          ))}
      </div>
    </AppShell>
  );
}
