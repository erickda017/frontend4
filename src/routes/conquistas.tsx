import { createFileRoute } from "@tanstack/react-router";
import { Lock, Trophy } from "lucide-react";

import { AppShell, PageHeader } from "@/components/AppShell";
import { SkeletonCards } from "@/components/States";
import {
  CATALOGO_CONQUISTAS,
  useCatalogoConquistas,
  useConquistasDinamicasPreview,
  usePerfilConquistas,
} from "@/lib/queries";

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

const NOME_METRICA: Record<string, string> = {
  horas: "horas",
  plays: "plays",
  faixas: "faixas",
};

function Conquistas() {
  const { data: desbloqueadas = [], isLoading } = usePerfilConquistas();
  const porChave = new Map(desbloqueadas.map((c) => [c.chave, c]));

  // Catálogo vem do backend (conquistas FIXAS, com condição conhecida de antemão
  // — por isso dá pra mostrar até "bloqueadas"). Além dessas, existem conquistas
  // DINÂMICAS por artista/faixa/gênero (ex: "100 Horas do Alec"): como o texto
  // delas depende do histórico de CADA usuário, elas só existem de verdade
  // quando já sabemos quem é o artista/faixa/gênero em questão.
  const { data: catalogo } = useCatalogoConquistas();
  const catalogoBase = catalogo?.length ? catalogo : CATALOGO_CONQUISTAS;
  const chavesDoCatalogo = new Set(catalogoBase.map((c) => c.chave));

  // Conquistas dinâmicas desbloqueadas: qualquer coisa no banco que NÃO está
  // no catálogo fixo é, por definição, uma conquista por artista/faixa/gênero.
  const dinamicasDesbloqueadas = desbloqueadas.filter((c) => !chavesDoCatalogo.has(c.chave));

  // Preview: TODAS as conquistas dinâmicas aplicáveis ao usuário (com base no
  // artista/faixa/gênero real dele), desbloqueadas ou não, com atual/meta —
  // é o que permite mostrar "bloqueada, faltam 8 plays" em vez de escondê-la.
  const { data: preview = [], isLoading: carregandoPreview } = useConquistasDinamicasPreview();
  const chavesJaListadas = new Set(dinamicasDesbloqueadas.map((c) => c.chave));
  const dinamicasBloqueadasComProgresso = preview.filter(
    (c) => !c.desbloqueada && !chavesJaListadas.has(c.chave),
  );

  const achievements = [
    ...catalogoBase.map((def) => ({
      ...def,
      desbloqueada: porChave.get(def.chave),
      progresso: null as { atual: number; meta: number; metrica: string } | null,
    })),
    ...dinamicasDesbloqueadas.map((c) => ({
      chave: c.chave,
      titulo: c.titulo,
      descricao: c.descricao,
      desbloqueada: c,
      progresso: null as { atual: number; meta: number; metrica: string } | null,
    })),
    ...dinamicasBloqueadasComProgresso.map((c) => ({
      chave: c.chave,
      titulo: c.titulo,
      descricao: c.descricao,
      desbloqueada: undefined,
      progresso: { atual: c.atual, meta: c.meta, metrica: c.metrica },
    })),
  ];

  const unlocked = achievements.filter((a) => a.desbloqueada).length;
  const pct = achievements.length ? Math.round((unlocked / achievements.length) * 100) : 0;
  const carregandoTudo = isLoading || carregandoPreview;

  return (
    <AppShell>
      <PageHeader
        title="Conquistas"
        subtitle={
          carregandoTudo ? "Carregando…" : `${unlocked} de ${achievements.length} desbloqueadas.`
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
        {carregandoTudo ? <SkeletonCards count={6} /> : null}
        {!carregandoTudo &&
          achievements.map((a) => {
            const percentualProgresso = a.progresso
              ? Math.min(100, Math.round((a.progresso.atual / a.progresso.meta) * 100))
              : null;

            return (
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
                        : a.progresso
                          ? `${a.progresso.atual} / ${a.progresso.meta} ${NOME_METRICA[a.progresso.metrica] ?? ""}`
                          : "Bloqueada"}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{a.descricao}</p>
                {!a.desbloqueada && a.progresso ? (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${percentualProgresso}%`, background: "var(--gradient-brand)" }}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
      </div>
    </AppShell>
  );
}
