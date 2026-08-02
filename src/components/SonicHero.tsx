import { useEffect, useMemo, useState } from "react";
import {
  Disc3,
  Headphones,
  Music2,
  Pause,
  Play,
  Radio,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

import { formatarTempo, useTocandoAgora } from "@/lib/now-playing";
import { useCoresDaCapa } from "@/lib/album-colors";

import { useResumo, useTopArtistas, useFaixasRecentes } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

type Modo = "tocando" | "capsula";

function Equalizer() {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="eq-bar" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

function HeroSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
      <Skeleton className="size-28 rounded-2xl sm:size-36 md:size-40" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-40 rounded-full" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-1.5 w-full max-w-lg rounded-full" />
      </div>
    </div>
  );
}

function NadaTocando({ offline }: { offline: boolean }) {
  return (
    <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="grid size-28 place-items-center rounded-2xl border border-border bg-surface-2 sm:size-36">
        {offline ? (
          <WifiOff className="size-10 text-muted-foreground" />
        ) : (
          <Disc3 className="size-12 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0">
        <span className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase">
          <Pause className="size-3" />
          {offline ? "Sem conexão com a API" : "Nada tocando"}
        </span>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl md:text-4xl">
          {offline ? (
            <>
              Não consegui falar com o <span className="text-gradient">servidor</span>
            </>
          ) : (
            <>
              Dê o <span className="text-gradient">play</span> em algum lugar
            </>
          )}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {offline
            ? "Verifique se o backend Node está rodando e se VITE_API_URL aponta para ele."
            : "Assim que você tocar uma música no Spotify conectado, ela aparece aqui em tempo real."}
        </p>
        <Link
          to="/plataformas"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Radio className="size-4" />
          Gerenciar plataformas
        </Link>
      </div>
    </div>
  );
}

function TocandoAgoraCard() {
  const { data: faixa, isLoading, isError } = useTocandoAgora();
  const cores = useCoresDaCapa(faixa?.imagem_capa_url);

  // Progresso otimista entre refetches, para a barra andar suavemente.
  const [progresso, setProgresso] = useState(0);
  useEffect(() => {
    setProgresso(faixa?.progresso_ms ?? 0);
  }, [faixa?.progresso_ms, faixa?.nome_faixa]);
  useEffect(() => {
    if (!faixa?.tocando) return;
    const id = setInterval(
      () => setProgresso((p) => Math.min(p + 1000, faixa.duracao_ms)),
      1000,
    );
    return () => clearInterval(id);
  }, [faixa?.tocando, faixa?.duracao_ms, faixa]);

  if (isLoading) return <HeroSkeleton />;
  if (isError) return <NadaTocando offline />;
  if (!faixa) return <NadaTocando offline={false} />;

  const pct = faixa.duracao_ms ? Math.min(100, (progresso / faixa.duracao_ms) * 100) : 0;

  // Cores do brilho: dominantes da capa quando dá pra ler a imagem; senão,
  // cai na cor da plataforma (sempre definida em now-playing.ts).
  const corA = cores?.primaria ?? faixa.plataforma_cor;
  const corB = cores?.secundaria ?? faixa.plataforma_cor;
  const tocando = faixa.tocando;

  // Pulsação "orgânica": um período estável, derivado da duração da faixa,
  // para cada música respirar num ritmo levemente diferente (1.6s – 2.4s).
  const duracaoPulso = `${(1.6 + ((faixa.duracao_ms || 0) % 800) / 1000).toFixed(2)}s`;
  const estiloPulso = { "--pulse-dur": duracaoPulso } as React.CSSProperties;

  return (
    <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-6">
      <div className="relative w-fit" style={estiloPulso}>
        {/* Brilho dinâmico sincronizado com as cores da capa */}
        <div
          className={`pointer-events-none absolute -inset-6 rounded-full ${tocando ? "art-glow" : "opacity-35 blur-2xl"}`}
          style={{
            ...(tocando
              ? ({ "--art-1": corA, "--art-2": corB } as React.CSSProperties)
              : { background: corA }),
          }}
          aria-hidden
        />
        {/* Onda que se expande a cada "batida" */}
        {tocando ? (
          <div
            className="art-ring pointer-events-none absolute -inset-1 rounded-3xl border-2"
            style={{ borderColor: corB }}
            aria-hidden
          />
        ) : null}
        <div
          className={`relative size-28 overflow-hidden rounded-2xl border border-border bg-surface-2 sm:size-36 md:size-40 ${tocando ? "art-pulse" : ""}`}
          style={{ boxShadow: `0 18px 50px -18px ${corA}` }}
        >
          {faixa.imagem_capa_url ? (
            <img
              src={faixa.imagem_capa_url}
              alt={`Capa de ${faixa.nome_faixa}`}
              className="size-full object-cover"
              loading="lazy"
              decoding="async"
              width={320}
              height={320}
            />
          ) : (
            <div className="grid size-full place-items-center">
              <Disc3
                className={`size-14 text-muted-foreground ${faixa.tocando ? "spin-slow" : ""}`}
              />
            </div>
          )}
        </div>
      </div>


      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase">
            {faixa.tocando ? <Equalizer /> : <Pause className="size-3" />}
            {faixa.tocando ? "Tocando agora" : "Pausado"}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
            style={{
              background: `color-mix(in oklab, ${faixa.plataforma_cor} 22%, transparent)`,
              color: faixa.plataforma_cor,
            }}
          >
            <Radio className="size-3" />
            {faixa.plataforma_nome}
          </span>
        </div>

        <h1 className="mt-3 truncate text-2xl font-bold sm:text-3xl md:text-4xl">
          {faixa.nome_faixa}
        </h1>
        <p className="mt-1 truncate text-sm text-muted-foreground md:text-base">
          {faixa.nome_artista}
          {faixa.nome_album ? ` · ${faixa.nome_album}` : ""}
        </p>

        <div className="mt-5 max-w-lg">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-linear"
              style={{ width: `${pct}%`, background: "var(--gradient-brand)" }}
            />
          </div>
          <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
            <span>{formatarTempo(progresso)}</span>
            <span>{formatarTempo(faixa.duracao_ms)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CapsulaSonoraCard() {
  const { data: resumo, isLoading } = useResumo();
  const { data: topArtistas = [] } = useTopArtistas(3);
  const { data: recentes = [] } = useFaixasRecentes(1);

  const horas = useMemo(
    () => Math.round((resumo?.totalMinutos ?? 0) / 60),
    [resumo?.totalMinutos],
  );

  const destaques = [
    {
      icone: Headphones,
      rotulo: "Horas ouvidas",
      valor: horas.toLocaleString("pt-BR"),
      sub: `${(resumo?.totalFaixas ?? 0).toLocaleString("pt-BR")} reproduções`,
    },
    {
      icone: Sparkles,
      rotulo: "Artista do momento",
      valor: topArtistas[0]?.nome_artista ?? "—",
      sub: topArtistas[0] ? `${topArtistas[0].total_reproducoes} plays` : "sem dados ainda",
    },
    {
      icone: Music2,
      rotulo: "Última faixa",
      valor: recentes[0]?.nome_faixa ?? "—",
      sub: recentes[0]?.nome_artista ?? "sincronize uma plataforma",
    },
  ];

  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase">
        <Sparkles className="size-3 text-primary" />
        Cápsula sonora
      </span>
      <h1 className="mt-3 max-w-2xl text-2xl leading-tight font-bold sm:text-3xl md:text-4xl">
        Seu <span className="text-gradient">retrato musical</span> da temporada.
      </h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {destaques.map((d) => (
          <div key={d.rotulo} className="rounded-2xl border border-border bg-surface-2/60 p-4">
            <d.icone className="size-4 text-primary" />
            <p className="mt-3 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              {d.rotulo}
            </p>
            {isLoading ? (
              <Skeleton className="mt-2 h-6 w-24" />
            ) : (
              <p className="mt-1 truncate text-xl font-bold">{d.valor}</p>
            )}
            <p className="truncate text-xs text-muted-foreground">{d.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SonicHero() {
  const [modo, setModo] = useState<Modo>("tocando");

  return (
    <section className="hero-glow surface-card glow-shadow relative mb-6 overflow-hidden p-5 sm:p-6 md:mb-8 md:p-10">
      <button
        type="button"
        onClick={() => setModo((m) => (m === "tocando" ? "capsula" : "tocando"))}
        aria-label={modo === "tocando" ? "Ver cápsula sonora" : "Ver o que está tocando agora"}
        className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/80 px-3 py-1.5 text-xs font-medium backdrop-blur transition-colors hover:bg-secondary md:top-4 md:right-4"
      >
        {modo === "tocando" ? (
          <>
            <Sparkles className="size-3.5 text-primary" />
            Cápsula
          </>
        ) : (
          <>
            <Play className="size-3.5 text-primary" />
            Tocando
          </>
        )}
      </button>

      <div key={modo} className="fade-swap pt-8 sm:pt-0">
        {modo === "tocando" ? <TocandoAgoraCard /> : <CapsulaSonoraCard />}
      </div>
    </section>
  );
}
