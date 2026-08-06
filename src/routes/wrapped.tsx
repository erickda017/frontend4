import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Disc3,
  Flame,
  Music4,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { AppShell, PageHeader } from "@/components/AppShell";
import { SkeletonCards } from "@/components/States";
import { useWrapped, type Wrapped } from "@/lib/queries";

export const Route = createFileRoute("/wrapped")({
  head: () => ({
    meta: [
      { title: "Seu Wrapped — Sonora" },
      {
        name: "description",
        content:
          "O resumo do seu ano musical: álbuns e faixas mais ouvidos, artistas, gêneros e a curva mês a mês.",
      },
      { property: "og:title", content: "Seu Wrapped — Sonora" },
      {
        property: "og:description",
        content: "Álbuns, faixas e artistas que marcaram o seu ano no Sonora.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WrappedPage,
});

const nf = (n: number) => n.toLocaleString("pt-BR");

/** Mosaico com as capas dos álbuns mais ouvidos, usado como fundo do herói. */
function MosaicoCapas({ capas }: { capas: string[] }) {
  if (capas.length === 0) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 grid grid-cols-4 opacity-40 sm:grid-cols-6"
    >
      {capas.map((url, i) => (
        <img key={`${url}-${i}`} src={url} alt="" className="size-full object-cover" />
      ))}
    </div>
  );
}

function CartaoAlbum({
  album,
  posicao,
}: {
  album: NonNullable<Wrapped["top_albuns"]>[number];
  posicao: number;
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-surface-2">
      <div className="aspect-square w-full overflow-hidden">
        {album.imagem_url ? (
          <img
            src={album.imagem_url}
            alt={`Capa de ${album.nome_album}`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center bg-muted text-muted-foreground">
            <Disc3 className="size-8" />
          </div>
        )}
      </div>
      <span className="absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-background/80 font-display text-xs font-bold backdrop-blur">
        {posicao}
      </span>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/85 to-transparent p-3 pt-8">
        <p className="truncate text-sm font-semibold">{album.nome_album}</p>
        <p className="truncate text-xs text-muted-foreground">{album.nome_artista}</p>
        <p className="mt-1 text-[11px] text-primary">{nf(album.total_plays)} plays</p>
      </div>
    </article>
  );
}

function CurvaMensal({ meses }: { meses: NonNullable<Wrapped["por_mes"]> }) {
  const maximo = Math.max(1, ...meses.map((m) => m.total_faixas));
  return (
    <div className="surface-card p-5">
      <h3 className="font-display text-lg font-bold">Seu ano mês a mês</h3>
      <p className="mb-4 text-xs text-muted-foreground">Reproduções registradas em cada mês.</p>
      <div className="flex h-40 items-end gap-1.5">
        {meses.map((m) => (
          <div key={m.mes} className="group flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              {nf(m.total_faixas)}
            </span>
            <div
              className="w-full rounded-t-md transition-all group-hover:opacity-100"
              style={{
                height: `${Math.max(4, (m.total_faixas / maximo) * 120)}px`,
                background: "var(--gradient-brand)",
                opacity: 0.85,
              }}
            />
            <span className="text-[10px] text-muted-foreground">{m.mes}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Destaque({
  icone: Icone,
  rotulo,
  valor,
}: {
  icone: typeof Clock;
  rotulo: string;
  valor: string;
}) {
  return (
    <div className="surface-card flex items-center gap-3 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Icone className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{rotulo}</p>
        <p className="truncate font-display text-lg font-bold">{valor}</p>
      </div>
    </div>
  );
}

function WrappedPage() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const { data, isLoading } = useWrapped(ano);

  const crescimentoPct =
    data?.total_minutos != null &&
    data.total_minutos_ano_anterior != null &&
    data.total_minutos_ano_anterior > 0
      ? Math.round(
          ((data.total_minutos - data.total_minutos_ano_anterior) /
            data.total_minutos_ano_anterior) *
            100,
        )
      : null;

  const albuns = data?.top_albuns ?? [];
  const capasMosaico = albuns
    .map((a) => a.imagem_url)
    .filter((u): u is string => !!u)
    .slice(0, 12);

  return (
    <AppShell>
      <PageHeader
        title="Seu Wrapped"
        subtitle="O resumo do seu ano, com base no seu histórico real."
      />

      <div className="surface-card mb-4 flex items-center justify-between p-3">
        <button
          onClick={() => setAno((a) => a - 1)}
          className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
          aria-label="Ano anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="font-display text-lg font-bold">{ano}</span>
        <button
          onClick={() => setAno((a) => Math.min(a + 1, anoAtual))}
          disabled={ano >= anoAtual}
          className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label="Próximo ano"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <SkeletonCards count={4} />
        </div>
      ) : !data?.tem_dados ? (
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          Nenhuma reprodução registrada em {ano}. Que tal importar seu histórico desse ano?
        </div>
      ) : (
        <div className="space-y-5">
          {/* Herói: capas dos álbuns como pano de fundo + números do ano. */}
          <section className="relative overflow-hidden rounded-3xl border border-border">
            <MosaicoCapas capas={capasMosaico} />
            <div
              className="absolute inset-0"
              style={{ background: "var(--gradient-brand)", opacity: 0.82 }}
            />
            <div className="relative p-7 text-center sm:p-12">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background/25 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur">
                <Sparkles className="size-3.5" /> Wrapped {ano}
              </span>
              <p className="mt-4 font-display text-5xl font-bold text-primary-foreground sm:text-7xl">
                {nf(data.total_minutos ?? 0)}
              </p>
              <p className="font-display text-sm uppercase tracking-[0.3em] text-primary-foreground/80">
                minutos ouvidos
              </p>

              <div className="mx-auto mt-7 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { rotulo: "Faixas", valor: nf(data.total_faixas ?? 0) },
                  { rotulo: "Artistas", valor: nf(data.artistas_unicos ?? 0) },
                  { rotulo: "Álbuns", valor: nf(data.albuns_unicos ?? 0) },
                  { rotulo: "Dias ativos", valor: nf(data.dias_ativos ?? 0) },
                ].map((item) => (
                  <div
                    key={item.rotulo}
                    className="rounded-xl bg-background/20 p-3 backdrop-blur-sm"
                  >
                    <p className="font-display text-xl font-bold text-primary-foreground">
                      {item.valor}
                    </p>
                    <p className="text-[11px] text-primary-foreground/75">{item.rotulo}</p>
                  </div>
                ))}
              </div>

              {crescimentoPct !== null ? (
                <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-background/25 px-3 py-1 text-xs text-primary-foreground backdrop-blur">
                  <TrendingUp className="size-3.5" />
                  {crescimentoPct >= 0 ? "+" : ""}
                  {crescimentoPct}% em minutos vs {ano - 1}
                </p>
              ) : null}
            </div>
          </section>

          {albuns.length > 0 ? (
            <section>
              <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
                <Disc3 className="size-5 text-primary" /> Álbuns mais ouvidos
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {albuns.map((a, i) => (
                  <CartaoAlbum key={`${a.nome_album}-${a.nome_artista}`} album={a} posicao={i + 1} />
                ))}
              </div>
            </section>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="surface-card p-5">
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
                <Music4 className="size-5 text-primary" /> Faixas do ano
              </h3>
              <ol className="space-y-2.5">
                {(data.top_faixas ?? []).map((f, i) => (
                  <li
                    key={`${f.nome_faixa}-${f.nome_artista}`}
                    className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-surface-2"
                  >
                    <span className="w-5 shrink-0 text-center font-display text-sm font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    {f.imagem_url ? (
                      <img
                        src={f.imagem_url}
                        alt={`Capa de ${f.nome_faixa}`}
                        loading="lazy"
                        className="size-12 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Music4 className="size-5" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{f.nome_faixa}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {f.nome_artista}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold text-primary">
                        {nf(f.total_plays)}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">plays</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="surface-card p-5">
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
                <Flame className="size-5 text-primary" /> Artistas do ano
              </h3>
              <ol className="space-y-2.5">
                {(data.top_artistas ?? []).map((a, i) => (
                  <li
                    key={a.nome}
                    className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-surface-2"
                  >
                    <span className="w-5 shrink-0 text-center font-display text-sm font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    {a.imagem_url ? (
                      <img
                        src={a.imagem_url}
                        alt={a.nome}
                        loading="lazy"
                        className="size-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                        {a.nome.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.nome}</span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold text-primary">
                        {nf(a.total_faixas)}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">plays</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {data.por_mes ? <CurvaMensal meses={data.por_mes} /> : null}

          <div className="surface-card p-5">
            <h3 className="mb-4 font-display text-lg font-bold">Gêneros do ano</h3>
            <ul className="space-y-3">
              {(data.top_generos ?? []).map((g, i) => {
                const maximo = Math.max(1, ...(data.top_generos ?? []).map((x) => x.total_faixas));
                return (
                  <li key={g.genero}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">
                        <span className="mr-2 text-muted-foreground">{i + 1}</span>
                        {g.genero}
                      </span>
                      <span className="text-muted-foreground">{nf(g.total_faixas)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{
                          width: `${(g.total_faixas / maximo) * 100}%`,
                          background: "var(--gradient-brand)",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Destaque icone={Clock} rotulo="Hora favorita" valor={data.hora_favorita ?? "—"} />
            <Destaque icone={Sparkles} rotulo="Dia favorito" valor={data.dia_favorito ?? "—"} />
            <Destaque
              icone={CalendarDays}
              rotulo="Mês favorito"
              valor={data.mes_favorito ?? "—"}
            />
            <Destaque
              icone={TrendingUp}
              rotulo="Média por dia ativo"
              valor={`${nf(data.media_minutos_dia ?? 0)} min`}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}
