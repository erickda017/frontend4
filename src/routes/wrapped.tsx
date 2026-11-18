import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Disc3,
  ExternalLink,
  Flame,
  Lock,
  Moon,
  Music4,
  Pause,
  Play,
  Repeat,
  Sparkles,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/AppShell";
import { ErrorState, SkeletonCards } from "@/components/States";
import {
  usePreviaFaixa,
  useRecapMensal,
  useRecapMeses,
  useWrapped,
  type Recap,
  type RecapMes,
} from "@/lib/queries";

export const Route = createFileRoute("/wrapped")({
  head: () => ({
    meta: [
      { title: "Seu Recap — Sonora" },
      {
        name: "description",
        content:
          "O recap do seu mês e do seu ano musical: música do mês, artistas, gêneros, hábitos e muito mais.",
      },
      { property: "og:title", content: "Seu Recap — Sonora" },
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

function formatarDia(dia: string) {
  const [a, m, d] = dia.split("-");
  return `${d}/${m}/${a}`;
}

function formatarDuracao(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}min` : `${m} min`;
}

/** Mosaico com as capas dos álbuns mais ouvidos, usado como fundo do herói. */
function MosaicoCapas({ capas }: { capas: string[] }) {
  if (capas.length === 0) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 grid grid-cols-4 opacity-40 sm:grid-cols-6"
    >
      {capas.map((url, i) => (
        <img
          key={`${url}-${i}`}
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      ))}
    </div>
  );
}

function CartaoAlbum({
  album,
  posicao,
}: {
  album: NonNullable<Recap["top_albuns"]>[number];
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
            decoding="async"
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

function Barras({
  titulo,
  subtitulo,
  itens,
}: {
  titulo: string;
  subtitulo: string;
  itens: { rotulo: string; valor: number }[];
}) {
  const maximo = Math.max(1, ...itens.map((m) => m.valor));
  return (
    <div className="surface-card p-5">
      <h3 className="font-display text-lg font-bold">{titulo}</h3>
      <p className="mb-4 text-xs text-muted-foreground">{subtitulo}</p>
      <div className="flex h-40 items-end gap-1.5">
        {itens.map((m) => (
          <div key={m.rotulo} className="group flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              {nf(m.valor)}
            </span>
            <div
              className="w-full rounded-t-md transition-all group-hover:opacity-100"
              style={{
                height: `${Math.max(4, (m.valor / maximo) * 120)}px`,
                background: "var(--gradient-brand)",
                opacity: 0.85,
              }}
            />
            <span className="text-[10px] text-muted-foreground">{m.rotulo}</span>
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
  detalhe,
}: {
  icone: typeof Clock;
  rotulo: string;
  valor: string;
  detalhe?: string | undefined;
}) {
  return (
    <div className="surface-card flex items-center gap-3 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Icone className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{rotulo}</p>
        <p className="truncate font-display text-lg font-bold">{valor}</p>
        {detalhe ? <p className="truncate text-[11px] text-muted-foreground">{detalhe}</p> : null}
      </div>
    </div>
  );
}

/** Calendário de atividade (estilo "heatmap"): uma célula por dia do período. */
function CalendarioAtividade({
  calendario,
  inicio,
  dias,
}: {
  calendario: NonNullable<Recap["calendario"]>;
  inicio: Date;
  dias: number;
}) {
  const porDia = useMemo(() => new Map(calendario.map((d) => [d.dia, d])), [calendario]);
  const maximo = Math.max(1, ...calendario.map((d) => d.total_minutos));
  const celulas = Array.from({ length: dias }, (_, i) => {
    const d = new Date(inicio.getTime() + i * 86400000);
    const chave = d.toISOString().slice(0, 10);
    return { chave, dado: porDia.get(chave) };
  });
  // Alinha a primeira célula no dia da semana certo (segunda = coluna 0).
  const deslocamento = (inicio.getUTCDay() + 6) % 7;

  return (
    <div className="surface-card p-5">
      <h3 className="font-display text-lg font-bold">Calendário de escuta</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Quanto mais forte a cor, mais música naquele dia.
      </p>
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1">
        {Array.from({ length: deslocamento }, (_, i) => (
          <span key={`v-${i}`} className="size-4" />
        ))}
        {celulas.map(({ chave, dado }) => (
          <span
            key={chave}
            title={`${formatarDia(chave)} — ${dado ? `${dado.total_minutos} min · ${dado.total_faixas} faixas` : "sem música"}`}
            className="size-4 rounded-[4px] bg-muted"
            style={
              dado
                ? {
                    background: "var(--chart-1)",
                    opacity: 0.2 + 0.8 * (dado.total_minutos / maximo),
                  }
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

/** Música do período, com prévia oficial de 30s (tocada direto da fonte, sem baixar). */
function MusicaDoPeriodo({
  musica,
  rotulo,
}: {
  musica: NonNullable<Recap["musica_do_periodo"]>;
  rotulo: string;
}) {
  const { data: previa, isLoading } = usePreviaFaixa(musica.nome_faixa, musica.nome_artista);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tocando, setTocando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const capa = musica.imagem_url ?? previa?.capa ?? null;

  useEffect(() => () => audioRef.current?.pause(), []);

  function alternar() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => toast.error("Não consegui tocar a prévia agora."));
    } else {
      audio.pause();
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-surface-2">
      {capa ? (
        <img
          src={capa}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full scale-125 object-cover opacity-25 blur-2xl"
        />
      ) : null}
      <div className="relative flex flex-col items-center gap-5 p-6 sm:flex-row sm:p-8">
        <div className="size-36 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-xl sm:size-44">
          {capa ? (
            <img
              src={capa}
              alt={`Capa de ${musica.nome_faixa}`}
              className="size-full object-cover"
            />
          ) : (
            <span className="grid size-full place-items-center text-muted-foreground">
              <Music4 className="size-10" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" /> Música {rotulo}
          </span>
          <h3 className="mt-3 truncate font-display text-2xl font-bold sm:text-3xl">
            {musica.nome_faixa}
          </h3>
          <p className="truncate text-sm text-muted-foreground">{musica.nome_artista}</p>
          <p className="mt-2 text-sm">
            <span className="font-semibold text-primary">{nf(musica.total_plays)}</span> plays ·{" "}
            {formatarDuracao(musica.total_minutos)}
            {musica.dia_de_pico ? ` · pico em ${formatarDia(musica.dia_de_pico)}` : ""}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            {previa?.preview_url ? (
              <>
                <button
                  onClick={alternar}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                  aria-label={tocando ? "Pausar prévia" : "Tocar prévia"}
                >
                  {tocando ? <Pause className="size-4" /> : <Play className="size-4" />}
                  {tocando ? "Pausar" : "Ouvir prévia"}
                </button>
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-[width]"
                    style={{ width: `${progresso}%` }}
                  />
                </div>
                <audio
                  ref={audioRef}
                  src={previa.preview_url}
                  preload="none"
                  onPlay={() => setTocando(true)}
                  onPause={() => setTocando(false)}
                  onEnded={() => {
                    setTocando(false);
                    setProgresso(0);
                  }}
                  onTimeUpdate={(e) =>
                    setProgresso(
                      (e.currentTarget.currentTime / (e.currentTarget.duration || 30)) * 100,
                    )
                  }
                />
                {previa.link ? (
                  <a
                    href={previa.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="size-3" /> Ouvir completa
                  </a>
                ) : null}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                {isLoading
                  ? "Procurando a prévia…"
                  : "Prévia oficial indisponível para esta faixa."}
              </p>
            )}
          </div>
          {previa?.fonte ? (
            <p className="mt-2 text-[10px] text-muted-foreground">{previa.fonte}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function PeriodosDoDia({ periodos }: { periodos: NonNullable<Recap["periodos_do_dia"]> }) {
  const itens = [
    { rotulo: "Madrugada", valor: periodos.madrugada, dica: "00h–05h" },
    { rotulo: "Manhã", valor: periodos.manha, dica: "05h–12h" },
    { rotulo: "Tarde", valor: periodos.tarde, dica: "12h–18h" },
    { rotulo: "Noite", valor: periodos.noite, dica: "18h–24h" },
  ];
  return (
    <div className="surface-card p-5">
      <h3 className="font-display text-lg font-bold">Seu relógio musical</h3>
      <p className="mb-4 text-xs text-muted-foreground">Em que parte do dia você mais ouve.</p>
      <ul className="space-y-3">
        {itens.map((i) => (
          <li key={i.rotulo}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium">
                {i.rotulo} <span className="text-xs text-muted-foreground">{i.dica}</span>
              </span>
              <span className="text-muted-foreground">{i.valor}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${i.valor}%`, background: "var(--gradient-brand)" }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function resumoEmTexto(recap: Recap, rotulo: string) {
  const linhas = [`Meu recap Sonora — ${rotulo}`];
  linhas.push(`${nf(recap.total_minutos ?? 0)} minutos · ${nf(recap.total_faixas ?? 0)} faixas`);
  if (recap.artista_do_periodo) linhas.push(`Artista: ${recap.artista_do_periodo.nome}`);
  if (recap.musica_do_periodo)
    linhas.push(
      `Música: ${recap.musica_do_periodo.nome_faixa} — ${recap.musica_do_periodo.nome_artista}`,
    );
  if (recap.top_generos?.[0]) linhas.push(`Gênero: ${recap.top_generos[0].genero}`);
  if (recap.personalidade) linhas.push(`Perfil: ${recap.personalidade.titulo}`);
  return linhas.join("\n");
}

/** Visão completa de um recap (serve para o mensal e para o anual). */
function RecapView({ recap, rotulo, ano }: { recap: Recap; rotulo: string; ano?: number }) {
  const albuns = recap.top_albuns ?? [];
  const capasMosaico = albuns
    .map((a) => a.imagem_url)
    .filter((u): u is string => !!u)
    .slice(0, 12);
  const variacao = recap.comparacao?.variacao_minutos_pct ?? null;
  const geneMax = Math.max(1, ...(recap.top_generos ?? []).map((x) => x.total_faixas));

  // Início do calendário: 1º dia do mês/ano em UTC (os dias já vêm em horário de Brasília).
  const inicioCalendario = (() => {
    if (recap.tipo === "mes" && recap.mes) {
      const [a, m] = recap.mes.split("-").map(Number);
      return new Date(Date.UTC(a!, m! - 1, 1));
    }
    return new Date(Date.UTC(ano ?? new Date().getFullYear(), 0, 1));
  })();

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-border">
        <MosaicoCapas capas={capasMosaico} />
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-brand)", opacity: 0.82 }}
        />
        <div className="relative p-7 text-center sm:p-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/25 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur">
            <Sparkles className="size-3.5" /> Recap {rotulo}
          </span>
          <p className="mt-4 font-display text-5xl font-bold text-primary-foreground sm:text-7xl">
            {nf(recap.total_minutos ?? 0)}
          </p>
          <p className="font-display text-sm uppercase tracking-[0.3em] text-primary-foreground/80">
            minutos ouvidos · {formatarDuracao(recap.total_minutos ?? 0)}
          </p>

          {recap.personalidade ? (
            <div className="mx-auto mt-5 max-w-md rounded-2xl bg-background/25 p-4 backdrop-blur">
              <p className="font-display text-lg font-bold text-primary-foreground">
                {recap.personalidade.titulo}
              </p>
              <p className="text-xs text-primary-foreground/80">{recap.personalidade.descricao}</p>
            </div>
          ) : null}

          <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { rotulo: "Faixas", valor: nf(recap.total_faixas ?? 0) },
              { rotulo: "Artistas", valor: nf(recap.artistas_unicos ?? 0) },
              { rotulo: "Álbuns", valor: nf(recap.albuns_unicos ?? 0) },
              {
                rotulo: "Dias ativos",
                valor: `${nf(recap.dias_ativos ?? 0)}/${nf(recap.dias_no_periodo ?? 0)}`,
              },
            ].map((item) => (
              <div key={item.rotulo} className="rounded-xl bg-background/20 p-3 backdrop-blur-sm">
                <p className="font-display text-xl font-bold text-primary-foreground">
                  {item.valor}
                </p>
                <p className="text-[11px] text-primary-foreground/75">{item.rotulo}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {variacao !== null ? (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-background/25 px-3 py-1 text-xs text-primary-foreground backdrop-blur">
                <TrendingUp className="size-3.5" />
                {variacao >= 0 ? "+" : ""}
                {variacao}% em minutos vs. período anterior
              </p>
            ) : null}
            <button
              onClick={() => {
                navigator.clipboard
                  ?.writeText(resumoEmTexto(recap, rotulo))
                  .then(() => toast.success("Resumo copiado!"))
                  .catch(() => toast.error("Não foi possível copiar."));
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-background/25 px-3 py-1 text-xs text-primary-foreground backdrop-blur"
            >
              <Copy className="size-3.5" /> Copiar resumo
            </button>
          </div>
        </div>
      </section>

      {recap.musica_do_periodo ? (
        <MusicaDoPeriodo
          musica={recap.musica_do_periodo}
          rotulo={recap.tipo === "mes" ? "do mês" : "do ano"}
        />
      ) : null}

      {(recap.destaques ?? []).length > 0 ? (
        <section>
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Zap className="size-5 text-primary" /> Destaques
          </h3>
          <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
            {(recap.destaques ?? []).map((d) => (
              <article key={d.chave} className="surface-card w-64 shrink-0 snap-start p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  {d.titulo}
                </p>
                <p className="mt-2 text-sm">{d.texto}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Destaque icone={Clock} rotulo="Hora favorita" valor={recap.hora_favorita ?? "—"} />
        <Destaque icone={Sparkles} rotulo="Dia favorito" valor={recap.dia_favorito ?? "—"} />
        <Destaque
          icone={Flame}
          rotulo="Maior sequência"
          valor={`${recap.maior_sequencia_dias ?? 0} dias`}
          detalhe="seguidos com música"
        />
        <Destaque
          icone={Timer}
          rotulo="Sessão mais longa"
          valor={recap.sessao_mais_longa ? formatarDuracao(recap.sessao_mais_longa.minutos) : "—"}
          detalhe={
            recap.sessao_mais_longa
              ? `${recap.sessao_mais_longa.total_faixas} faixas seguidas`
              : undefined
          }
        />
        <Destaque
          icone={CalendarDays}
          rotulo="Dia mais intenso"
          valor={recap.dia_mais_intenso ? formatarDia(recap.dia_mais_intenso.dia) : "—"}
          detalhe={
            recap.dia_mais_intenso ? `${recap.dia_mais_intenso.total_minutos} min` : undefined
          }
        />
        <Destaque
          icone={Repeat}
          rotulo="Taxa de repetição"
          valor={`${recap.taxa_repeticao ?? 0}x`}
          detalhe="plays por faixa única"
        />
        <Destaque
          icone={Moon}
          rotulo="Média por dia ativo"
          valor={`${nf(recap.media_minutos_dia ?? 0)} min`}
        />
        <Destaque
          icone={Disc3}
          rotulo="Gêneros diferentes"
          valor={nf(recap.generos_unicos ?? 0)}
          detalhe={`${nf(recap.faixas_unicas ?? 0)} faixas únicas`}
        />
      </div>

      {recap.obsessao ? (
        <div className="surface-card flex items-center gap-4 p-4">
          {recap.obsessao.imagem_url ? (
            <img
              src={recap.obsessao.imagem_url}
              alt=""
              loading="lazy"
              className="size-14 shrink-0 rounded-xl object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Obsessão do período
            </p>
            <p className="truncate font-medium">
              {recap.obsessao.nome_faixa} — {recap.obsessao.nome_artista}
            </p>
            <p className="text-xs text-muted-foreground">
              {recap.obsessao.vezes} vezes em {formatarDia(recap.obsessao.dia)}
            </p>
          </div>
        </div>
      ) : null}

      {(recap.descobertas ?? []).length > 0 ? (
        <div className="surface-card p-5">
          <h3 className="font-display text-lg font-bold">Descobertas</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Artistas do seu top que você ouviu pela primeira vez.
          </p>
          <div className="flex flex-wrap gap-2">
            {(recap.descobertas ?? []).map((nome) => (
              <span
                key={nome}
                className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary"
              >
                {nome}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {albuns.length > 0 ? (
        <section>
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Disc3 className="size-5 text-primary" /> Álbuns mais ouvidos
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {albuns.slice(0, 8).map((a, i) => (
              <CartaoAlbum key={`${a.nome_album}-${a.nome_artista}`} album={a} posicao={i + 1} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
            <Music4 className="size-5 text-primary" /> Faixas{" "}
            {recap.tipo === "mes" ? "do mês" : "do ano"}
          </h3>
          <ol className="space-y-2.5">
            {(recap.top_faixas ?? []).map((f, i) => (
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
                    decoding="async"
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
            <Flame className="size-5 text-primary" /> Artistas{" "}
            {recap.tipo === "mes" ? "do mês" : "do ano"}
          </h3>
          <ol className="space-y-2.5">
            {(recap.top_artistas ?? []).map((a, i) => (
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
                    decoding="async"
                    className="size-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                    {a.nome.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{a.nome}</span>
                  {a.percentual ? (
                    <span className="block text-[11px] text-muted-foreground">
                      {a.percentual}% do total
                    </span>
                  ) : null}
                </span>
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

      {recap.tipo === "ano" && recap.por_mes ? (
        <Barras
          titulo="Seu ano mês a mês"
          subtitulo="Reproduções registradas em cada mês."
          itens={recap.por_mes.map((m) => ({ rotulo: m.mes, valor: m.total_faixas }))}
        />
      ) : null}
      {recap.tipo === "mes" && recap.por_semana ? (
        <Barras
          titulo="Seu mês semana a semana"
          subtitulo="Minutos ouvidos em cada semana do mês."
          itens={recap.por_semana.map((s) => ({
            rotulo: `Sem ${s.semana}`,
            valor: s.total_minutos,
          }))}
        />
      ) : null}

      {recap.calendario && recap.calendario.length > 0 ? (
        <CalendarioAtividade
          calendario={recap.calendario}
          inicio={inicioCalendario}
          dias={recap.tipo === "mes" ? (recap.dias_no_periodo ?? 31) : 366}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {recap.periodos_do_dia ? <PeriodosDoDia periodos={recap.periodos_do_dia} /> : null}
        {recap.por_dia_semana ? (
          <Barras
            titulo="Seus dias da semana"
            subtitulo="Reproduções por dia da semana."
            itens={recap.por_dia_semana.map((d) => ({ rotulo: d.dia.slice(0, 3), valor: d.total }))}
          />
        ) : null}
      </div>

      <div className="surface-card p-5">
        <h3 className="mb-4 font-display text-lg font-bold">
          Gêneros {recap.tipo === "mes" ? "do mês" : "do ano"}
        </h3>
        <ul className="space-y-3">
          {(recap.top_generos ?? []).map((g, i) => (
            <li key={g.genero}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">
                  <span className="mr-2 text-muted-foreground">{i + 1}</span>
                  {g.genero}
                </span>
                <span className="text-muted-foreground">
                  {nf(g.total_faixas)}
                  {g.percentual ? ` · ${g.percentual}%` : ""}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{
                    width: `${(g.total_faixas / geneMax) * 100}%`,
                    background: "var(--gradient-brand)",
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SeletorMes({
  meses,
  selecionado,
  onSelecionar,
}: {
  meses: RecapMes[];
  selecionado: string | null;
  onSelecionar: (mes: string) => void;
}) {
  return (
    <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
      {meses.map((m) => {
        const ativo = m.mes === selecionado;
        return (
          <button
            key={m.mes}
            onClick={() => onSelecionar(m.mes)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              ativo
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {!m.disponivel ? <Lock className="size-3" /> : null}
            {m.rotulo}
          </button>
        );
      })}
    </div>
  );
}

function RecapMensal() {
  const { data: meses = [], isLoading: carregandoMeses } = useRecapMeses();
  const [escolhido, setEscolhido] = useState<string | null>(null);

  // Padrão: o mês disponível mais recente (a lista vem do mais novo pro mais velho).
  const padrao = meses.find((m) => m.disponivel && m.total_faixas > 0)?.mes ?? null;
  const mes = escolhido ?? padrao;
  const info = meses.find((m) => m.mes === mes);

  // Meses ainda bloqueados nem chamam a API de recap (o resultado seria vazio).
  const bloqueado = !!info && !info.disponivel;
  const { data, isLoading, isError, refetch } = useRecapMensal(bloqueado ? null : mes);

  if (carregandoMeses) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <SkeletonCards count={4} />
      </div>
    );
  }

  return (
    <>
      {meses.length > 0 ? (
        <SeletorMes meses={meses} selecionado={mes} onSelecionar={setEscolhido} />
      ) : null}

      {bloqueado && info ? (
        <div className="surface-card flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Lock className="size-7" />
          </span>
          <p className="font-display text-xl font-bold">Recap de {info.rotulo} em breve</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            O recap do mês é liberado no <strong>último dia do mês</strong> (
            {new Date(info.libera_em).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
            })}
            ). {info.dias_restantes === 1 ? "Falta 1 dia." : `Faltam ${info.dias_restantes} dias.`}
          </p>
          <p className="text-xs text-muted-foreground">
            Até lá você já soma {nf(info.total_minutos)} minutos em {nf(info.total_faixas)} faixas.
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <SkeletonCards count={4} />
        </div>
      ) : isError ? (
        <div className="surface-card">
          <ErrorState onRetry={() => refetch()} />
        </div>
      ) : !data?.tem_dados ? (
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          {meses.length === 0
            ? "Ainda não há histórico para montar um recap mensal. Sincronize uma plataforma!"
            : "Nenhuma reprodução registrada neste mês."}
        </div>
      ) : (
        <RecapView recap={data} rotulo={data.rotulo ?? ""} />
      )}
    </>
  );
}

function RecapAnual() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const { data, isLoading, isError, refetch } = useWrapped(ano);

  return (
    <>
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
      ) : isError ? (
        <div className="surface-card">
          <ErrorState onRetry={() => refetch()} />
        </div>
      ) : !data?.tem_dados ? (
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          Nenhuma reprodução registrada em {ano}. Que tal importar seu histórico desse ano?
        </div>
      ) : (
        <RecapView
          recap={{ ...(data as unknown as Recap), tipo: "ano" }}
          rotulo={String(ano)}
          ano={ano}
        />
      )}
    </>
  );
}

function WrappedPage() {
  const [aba, setAba] = useState<"mensal" | "anual">("mensal");

  return (
    <AppShell>
      <PageHeader
        title="Seu Recap"
        subtitle="Mensal (liberado no último dia do mês) e anual, com base no seu histórico real."
      />

      <div className="mb-4 inline-flex rounded-full border border-border p-1">
        {(["mensal", "anual"] as const).map((valor) => (
          <button
            key={valor}
            onClick={() => setAba(valor)}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
              aba === valor
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {valor === "mensal" ? "Mensal" : "Anual"}
          </button>
        ))}
      </div>

      {aba === "mensal" ? <RecapMensal /> : <RecapAnual />}
    </AppShell>
  );
}
