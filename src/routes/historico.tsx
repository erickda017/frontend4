import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Disc3, Music4, Search } from "lucide-react";

import { AppShell, PageHeader } from "@/components/AppShell";
import { EmptyState, ErrorState, SkeletonList } from "@/components/States";
import { useHistoricoPaginado, usePerfilPlataformas } from "@/lib/queries";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de audição — Sonora" },
      {
        name: "description",
        content:
          "Veja e filtre todas as faixas que você ouviu em Spotify, YouTube Music, Apple Music, Deezer e Tidal.",
      },
      { property: "og:title", content: "Histórico de audição — Sonora" },
      {
        property: "og:description",
        content: "Todas as suas reproduções, de todos os serviços, em uma linha do tempo única.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Historico,
});

const PAGINA = 50;

/** Atrasa o valor até o usuário parar de digitar (evita 1 chamada por tecla). */
function useDebounce<T>(valor: T, ms: number): T {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setAtrasado(valor), ms);
    return () => clearTimeout(id);
  }, [valor, ms]);
  return atrasado;
}

function Historico() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | "all">("all");
  const busca = useDebounce(query.trim(), 350);

  // PERFORMANCE: paginação, busca e filtro por plataforma acontecem NO SERVIDOR.
  // Antes a tela baixava o histórico inteiro (dezenas de milhares de linhas,
  // lidas 1.000 por vez) e ainda gravava tudo no localStorage — era isso que
  // fazia a página "não carregar". Agora só a página visível trafega.
  const {
    data,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useHistoricoPaginado({ busca, plataforma: filter }, PAGINA);
  const { data: platforms = [] } = usePerfilPlataformas();

  const pagina = useMemo(() => (data?.pages ?? []).flatMap((p) => p.itens), [data]);
  const total = data?.pages[0]?.total ?? null;
  const filtrando = busca !== "" || filter !== "all";
  const results = pagina;

  return (
    <AppShell>
      <PageHeader title="Histórico" subtitle="Linha do tempo unificada de tudo que você ouviu." />

      <div className="surface-card mb-4 flex flex-col gap-3 p-3 sm:p-4">
        <label className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por faixa, artista ou álbum"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            Todas
          </FilterChip>
          {platforms.map((p) => (
            <FilterChip
              key={p.chave}
              active={filter === p.chave}
              onClick={() => setFilter(p.chave)}
            >
              {p.nome_exibicao}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="surface-card divide-y divide-border">
        {isLoading ? (
          <div className="p-4">
            <SkeletonList rows={6} avatar />
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : results.length === 0 ? (
          <EmptyState
            icon={Music4}
            title={!filtrando ? "Nada por aqui ainda" : "Nenhum resultado"}
            description={
              !filtrando
                ? "Conecte uma plataforma e sincronize para ver suas reproduções."
                : "Tente outra busca ou remova os filtros."
            }
          />
        ) : (
          results.map((t) => {
            const durationSec = Math.round((t.duracao_ms ?? 0) / 1000);
            return (
              <div key={t.id} className="flex items-center gap-3 p-3 sm:p-4">
                <span
                  className="h-11 w-1.5 shrink-0 rounded-full"
                  style={{ background: t.plataforma_cor }}
                />
                <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  {t.imagem_capa_url ? (
                    <img
                      src={t.imagem_capa_url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width={88}
                      height={88}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="grid size-full place-items-center">
                      <Disc3 className="size-5 text-muted-foreground" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.nome_faixa}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.nome_artista} · {t.nome_album ?? "—"}
                  </p>
                  <p className="text-[11px] text-muted-foreground sm:hidden">
                    {t.plataforma_nome} ·{" "}
                    {new Date(t.tocado_em).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-medium">{t.plataforma_nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.tocado_em).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {Math.floor(durationSec / 60)}:{String(durationSec % 60).padStart(2, "0")}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {total !== null && results.length > 0 ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Mostrando {results.length.toLocaleString("pt-BR")}
          {total > results.length ? ` de ~${total.toLocaleString("pt-BR")}` : ""} reproduções
          {isFetching && !isFetchingNextPage ? " · atualizando…" : ""}
        </p>
      ) : null}

      {hasNextPage ? (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-full bg-secondary px-5 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
          </button>
        </div>
      ) : null}
    </AppShell>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
