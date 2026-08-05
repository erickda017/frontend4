import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Lock, Trophy } from "lucide-react";

import { AppShell, PageHeader } from "@/components/AppShell";
import { SkeletonCards } from "@/components/States";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const RARIDADES = ["comum", "rara", "epica", "lendaria"] as const;
const RARIDADE_LABEL: Record<string, string> = {
  comum: "Comum",
  rara: "Rara",
  epica: "Épica",
  lendaria: "Lendária",
};
const RARIDADE_COR: Record<string, string> = {
  comum: "bg-muted text-muted-foreground",
  rara: "bg-blue-500/15 text-blue-500",
  epica: "bg-purple-500/15 text-purple-500",
  lendaria: "bg-amber-500/15 text-amber-500",
};

function Conquistas() {
  const [filtroRaridade, setFiltroRaridade] = useState<string | null>(null);
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
      raridade: def.raridade ?? "comum",
      desbloqueada: porChave.get(def.chave),
      progresso: null as { atual: number; meta: number; metrica: string } | null,
    })),
    ...dinamicasDesbloqueadas.map((c) => ({
      chave: c.chave,
      titulo: c.titulo,
      descricao: c.descricao,
      raridade: c.raridade ?? "comum",
      desbloqueada: c,
      progresso: null as { atual: number; meta: number; metrica: string } | null,
    })),
    ...dinamicasBloqueadasComProgresso.map((c) => ({
      chave: c.chave,
      titulo: c.titulo,
      descricao: c.descricao,
      raridade: c.raridade ?? "comum",
      desbloqueada: undefined,
      progresso: { atual: c.atual, meta: c.meta, metrica: c.metrica },
    })),
  ];

  const unlocked = achievements.filter((a) => a.desbloqueada).length;
  const pct = achievements.length ? Math.round((unlocked / achievements.length) * 100) : 0;
  const carregandoTudo = isLoading || carregandoPreview;

  const achievementsFiltrados = filtroRaridade
    ? achievements.filter((a) => a.raridade === filtroRaridade)
    : achievements;

  const conquistadas = achievementsFiltrados.filter((a) => a.desbloqueada);
  const bloqueadas = achievementsFiltrados.filter((a) => !a.desbloqueada);

  // Feed "recém desbloqueadas": as 5 mais recentes, direto do histórico real
  // (não depende do filtro de raridade acima — é sempre a visão geral).
  const recentes = [...desbloqueadas]
    .sort((a, b) => new Date(b.desbloqueada_em).getTime() - new Date(a.desbloqueada_em).getTime())
    .slice(0, 5);

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

      {!carregandoTudo && recentes.length > 0 ? (
        <div className="surface-card mb-4 p-5">
          <h2 className="mb-3 text-sm font-semibold">Últimas desbloqueadas</h2>
          <ul className="flex gap-3 overflow-x-auto pb-1">
            {recentes.map((c) => (
              <li
                key={c.chave}
                className="flex min-w-[10rem] shrink-0 items-center gap-2 rounded-xl bg-muted/60 px-3 py-2"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Trophy className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{c.titulo}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(c.desbloqueada_em).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!carregandoTudo ? (
        <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por raridade">
          <button
            type="button"
            onClick={() => setFiltroRaridade(null)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filtroRaridade === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Todas
          </button>
          {RARIDADES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFiltroRaridade(r)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filtroRaridade === r
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {RARIDADE_LABEL[r]}
            </button>
          ))}
        </div>
      ) : null}

      {carregandoTudo ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCards count={6} />
        </div>
      ) : (
        <Tabs defaultValue="conquistadas" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="conquistadas">Conquistadas ({conquistadas.length})</TabsTrigger>
            <TabsTrigger value="bloqueadas">Bloqueadas ({bloqueadas.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="conquistadas">
            {conquistadas.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma conquista desbloqueada ainda. Continue ouvindo!
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {conquistadas.map((a) => (
                  <CartaoConquista key={a.chave} a={a} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bloqueadas">
            {bloqueadas.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Uau, você desbloqueou tudo que já dá pra calcular! Continue ouvindo pra liberar
                mais.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {bloqueadas.map((a) => (
                  <CartaoConquista key={a.chave} a={a} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </AppShell>
  );
}

type AchievementItem = {
  chave: string;
  titulo: string;
  descricao: string | null;
  raridade: string;
  desbloqueada: unknown;
  progresso: { atual: number; meta: number; metrica: string } | null;
};

function CartaoConquista({ a }: { a: AchievementItem }) {
  const percentualProgresso = a.progresso
    ? Math.min(100, Math.round((a.progresso.atual / a.progresso.meta) * 100))
    : null;

  const desbloqueadaEm =
    a.desbloqueada && typeof a.desbloqueada === "object" && "desbloqueada_em" in a.desbloqueada
      ? (a.desbloqueada as { desbloqueada_em: string }).desbloqueada_em
      : null;

  return (
    <div
      className={`surface-card p-5 transition-transform hover:-translate-y-0.5 ${
        a.desbloqueada ? "glow-shadow" : "opacity-60"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-xl ${
            a.desbloqueada ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {a.desbloqueada ? <Trophy className="size-5" /> : <Lock className="size-5" />}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{a.titulo}</p>
          <p className="text-[11px] text-muted-foreground">
            {desbloqueadaEm
              ? `Desbloqueada em ${new Date(desbloqueadaEm).toLocaleDateString("pt-BR")}`
              : a.progresso
                ? `${a.progresso.atual} / ${a.progresso.meta} ${NOME_METRICA[a.progresso.metrica] ?? ""}`
                : "Bloqueada"}
          </p>
        </div>
        <span
          className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${RARIDADE_COR[a.raridade] ?? RARIDADE_COR["comum"]}`}
        >
          {RARIDADE_LABEL[a.raridade] ?? a.raridade}
        </span>
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
}
