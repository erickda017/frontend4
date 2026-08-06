import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  Disc3,
  Heart,
  Layers,
  ListMusic,
  Music4,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";

import { AppShell, PageHeader } from "@/components/AppShell";
import { EmptyState, SkeletonCards } from "@/components/States";
import { useComparacaoAmigo, type LadoComparacao } from "@/lib/queries";

export const Route = createFileRoute("/amigos/$amigoId")({
  head: () => ({
    meta: [
      { title: "Comparar gosto musical — Sonora" },
      {
        name: "description",
        content:
          "Compare artistas, álbuns, faixas, gêneros, horários e tempo ouvido com um amigo no Sonora.",
      },
      { property: "og:title", content: "Comparar gosto musical — Sonora" },
      { property: "og:description", content: "Quem ouve mais? Quem tem o gosto mais parecido?" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparacaoPage,
});

// ---------------------------------------------------------------------------
// Helpers tolerantes a dados ausentes: a API pode devolver null/undefined em
// qualquer métrica (usuário sem histórico, gênero não classificado, etc).
// ---------------------------------------------------------------------------
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = (v: unknown) => num(v).toLocaleString("pt-BR");
const nomeCurto = (n: string | null | undefined) => (n || "Ouvinte").split(" ")[0] || "Ouvinte";

/** Anel de compatibilidade que anima do 0 até o valor real. */
function AnelCompatibilidade({
  valor,
  rotulo,
  tamanho = "grande",
}: {
  valor: number;
  rotulo: string;
  tamanho?: "grande" | "pequeno";
}) {
  const alvo = Math.max(0, Math.min(100, num(valor)));
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setPct(alvo));
    return () => cancelAnimationFrame(id);
  }, [alvo]);

  const grande = tamanho === "grande";

  return (
    <div
      className={`relative grid shrink-0 place-items-center ${grande ? "size-40" : "size-28"}`}
    >
      <div
        className="absolute inset-0 rounded-full transition-all duration-1000 ease-out"
        style={{
          background: `conic-gradient(var(--color-primary) ${pct}%, color-mix(in oklch, var(--color-muted) 70%, transparent) 0)`,
        }}
        aria-hidden
      />
      <div className={`absolute rounded-full bg-card ${grande ? "inset-[11px]" : "inset-[9px]"}`} aria-hidden />
      <div className="relative px-2 text-center">
        <p className={`font-display font-bold text-primary ${grande ? "text-4xl" : "text-2xl"}`}>
          {alvo}%
        </p>
        <p className="text-[10px] leading-tight tracking-wide text-muted-foreground uppercase">
          {rotulo}
        </p>
      </div>
    </div>
  );
}

/** Barra de disputa: divide 100% entre você e o amigo para uma métrica. */
function Disputa({
  rotulo,
  meu,
  doAmigo,
  nomeAmigo,
  sufixo = "",
  icone: Icone,
}: {
  rotulo: string;
  meu: number;
  doAmigo: number;
  nomeAmigo: string;
  sufixo?: string;
  icone: typeof Music4;
}) {
  const a = num(meu);
  const b = num(doAmigo);
  const total = a + b;
  const pct = total > 0 ? (a / total) * 100 : 50;
  const lider = total === 0 ? "empate" : a === b ? "empate" : a > b ? "você" : nomeAmigo;

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 text-sm">
        <Icone className="size-4 shrink-0 text-primary" />
        <span className="font-medium">{rotulo}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {lider === "empate" ? "empate" : `${lider} na frente`}
        </span>
      </div>
      <div className="flex h-7 overflow-hidden rounded-lg bg-muted text-[11px] font-medium">
        <div
          className="flex items-center justify-start bg-primary/85 px-2 text-primary-foreground transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        >
          <span className="truncate">
            {fmt(a)}
            {sufixo}
          </span>
        </div>
        <div
          className="flex items-center justify-end px-2 text-foreground/80 transition-[width] duration-700 ease-out"
          style={{ width: `${100 - pct}%`, background: "var(--color-accent)" }}
        >
          <span className="truncate">
            {fmt(b)}
            {sufixo}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Cabeçalho com os dois perfis (banner + avatar) frente a frente. */
function DuoPerfis({
  eu,
  amigo,
}: {
  eu: LadoComparacao | undefined;
  amigo: LadoComparacao | undefined;
}) {
  const cartao = (lado: LadoComparacao | undefined, etiqueta: string) => (
    <div className="relative flex-1 overflow-hidden">
      <div className="h-20 w-full sm:h-24">
        {lado?.banner_url ? (
          <img src={lado.banner_url} alt="" className="size-full object-cover" />
        ) : (
          <div className="banner-animado size-full" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-3">
        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-card bg-surface-2 text-xs font-bold">
          {lado?.avatar_url ? (
            <img src={lado.avatar_url} alt={lado.nome ?? etiqueta} className="size-full object-cover" />
          ) : (
            (lado?.nome || "S").slice(0, 2).toUpperCase()
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold">{lado?.nome ?? etiqueta}</p>
          <p className="text-[11px] text-muted-foreground">{etiqueta}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="surface-card mb-4 flex overflow-hidden">
      {cartao(eu, "você")}
      <div className="grid w-10 shrink-0 place-items-center border-x border-border bg-surface-2 font-display text-xs font-bold text-muted-foreground">
        VS
      </div>
      {cartao(amigo, "amigo")}
    </div>
  );
}

/** Sobreposição dos horários de escuta dos dois (perfil de 24h). */
function HorariosSobrepostos({
  meu,
  doAmigo,
  nomeAmigo,
}: {
  meu: number[];
  doAmigo: number[];
  nomeAmigo: string;
}) {
  const maximo = Math.max(1, ...meu, ...doAmigo);

  return (
    <div className="surface-card mt-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-lg font-bold">Horários de escuta</h3>
        <Clock className="size-4 text-primary" />
        <div className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" /> você
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-accent" /> {nomeAmigo}
          </span>
        </div>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Reproduções por hora do dia — dá pra ver quem é da madrugada e quem é da manhã.
      </p>
      <div className="flex h-32 items-end gap-[3px]">
        {Array.from({ length: 24 }, (_, h) => (
          <div
            key={h}
            className="flex flex-1 flex-col justify-end gap-[2px]"
            title={`${String(h).padStart(2, "0")}h — você ${fmt(meu[h])} · ${nomeAmigo} ${fmt(doAmigo[h])}`}
          >
            <div
              className="w-full rounded-t bg-primary/80"
              style={{ height: `${(num(meu[h]) / maximo) * 60}px` }}
            />
            <div
              className="w-full rounded-b bg-accent/80"
              style={{ height: `${(num(doAmigo[h]) / maximo) * 60}px` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>00h</span>
        <span>06h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>
    </div>
  );
}

/** Linha genérica "item em comum" com capa e divisão de plays. */
function ItemEmComum({
  titulo,
  subtitulo,
  imagem,
  meu,
  dele,
  nomeAmigo,
  redondo,
}: {
  titulo: string;
  subtitulo?: string;
  imagem: string | null;
  meu: number;
  dele: number;
  nomeAmigo: string;
  redondo?: boolean;
}) {
  const total = Math.max(1, meu + dele);
  return (
    <li className="flex items-center gap-3">
      {imagem ? (
        <img
          src={imagem}
          alt={titulo}
          loading="lazy"
          className={`size-11 shrink-0 object-cover ${redondo ? "rounded-full" : "rounded-lg"}`}
        />
      ) : (
        <span
          className={`grid size-11 shrink-0 place-items-center bg-muted text-muted-foreground ${
            redondo ? "rounded-full" : "rounded-lg"
          }`}
        >
          <Music4 className="size-4" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{titulo}</span>
            {subtitulo ? (
              <span className="block truncate text-xs text-muted-foreground">{subtitulo}</span>
            ) : null}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {fmt(meu)} · {fmt(dele)}
          </span>
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-700"
            style={{ width: `${(meu / total) * 100}%` }}
            title={`você: ${fmt(meu)}`}
          />
          <div
            className="h-full bg-accent transition-[width] duration-700"
            style={{ width: `${(dele / total) * 100}%` }}
            title={`${nomeAmigo}: ${fmt(dele)}`}
          />
        </div>
      </div>
    </li>
  );
}

function Lado({ lado, destaque }: { lado: LadoComparacao | undefined; destaque?: boolean }) {
  const metricas = [
    { rotulo: "Faixas", valor: fmt(lado?.total_faixas) },
    { rotulo: "Minutos", valor: fmt(lado?.total_minutos) },
    { rotulo: "Artistas", valor: fmt(lado?.artistas_unicos) },
    { rotulo: "Álbuns", valor: fmt(lado?.albuns_unicos) },
    { rotulo: "Dias ativos", valor: fmt(lado?.dias_ativos) },
    { rotulo: "Min/dia", valor: fmt(lado?.media_minutos_dia) },
  ];

  return (
    <div className={`surface-card p-5 ${destaque ? "ring-1 ring-primary/40" : ""}`}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2 text-xs font-bold">
          {lado?.avatar_url ? (
            <img
              src={lado.avatar_url}
              alt={lado.nome ?? "Amigo"}
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            (lado?.nome || "S").slice(0, 2).toUpperCase()
          )}
        </span>
        <h3 className="truncate font-display text-lg font-bold">{lado?.nome ?? "Ouvinte"}</h3>
        {lado?.hora_favorita ? (
          <span className="ml-auto shrink-0 rounded-full bg-surface-2 px-2 py-1 text-[11px] text-muted-foreground">
            pico {lado.hora_favorita}
          </span>
        ) : null}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        {metricas.map((m) => (
          <div key={m.rotulo} className="rounded-xl bg-surface-2 p-2.5 text-center">
            <dd className="font-display text-base font-bold">{m.valor}</dd>
            <dt className="text-[10px] text-muted-foreground">{m.rotulo}</dt>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Top álbuns
      </p>
      <ul className="mt-2 flex gap-2">
        {(lado?.top_albuns ?? []).length === 0 ? (
          <li className="text-sm text-muted-foreground">—</li>
        ) : (
          (lado?.top_albuns ?? []).slice(0, 4).map((a) => (
            <li key={`${a.nome_album}-${a.nome_artista}`} className="min-w-0 flex-1">
              {a.imagem_url ? (
                <img
                  src={a.imagem_url}
                  alt={`Capa de ${a.nome_album}`}
                  loading="lazy"
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ) : (
                <span className="grid aspect-square w-full place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Disc3 className="size-5" />
                </span>
              )}
              <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                {a.nome_album}
              </span>
            </li>
          ))
        )}
      </ul>

      <p className="mt-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Top artistas
      </p>
      <ul className="mt-1 space-y-1 text-sm">
        {(lado?.top_artistas ?? []).length === 0 ? (
          <li className="text-muted-foreground">—</li>
        ) : (
          (lado?.top_artistas ?? []).map((a) => (
            <li key={a?.nome ?? Math.random()} className="flex justify-between gap-2">
              <span className="truncate">{a?.nome ?? "Desconhecido"}</span>
              <span className="text-muted-foreground">{fmt(a?.total)}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function ComparacaoPage() {
  const { amigoId } = Route.useParams();
  const { data, isLoading, isError, error } = useComparacaoAmigo(amigoId);

  const eu = data?.eu;
  const amigo = data?.amigo;
  const nomeAmigo = nomeCurto(amigo?.nome);
  const generos = (data?.generos ?? []).filter((g) => g && (num(g.meu_total) || num(g.total_amigo)));
  const artistasEmComum = data?.artistas_em_comum ?? [];
  const faixasEmComum = data?.faixas_em_comum_detalhe ?? [];
  const albunsEmComum = data?.albuns_em_comum ?? [];

  return (
    <AppShell>
      <Link
        to="/perfil"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Voltar ao perfil
      </Link>

      <PageHeader
        title="Comparação de gosto"
        subtitle="Artistas, álbuns, faixas, gêneros e horários lado a lado."
      />

      {isLoading ? (
        <SkeletonCards />
      ) : isError || !data ? (
        <EmptyState
          icon={Heart}
          title="Não foi possível comparar"
          description={(error as Error)?.message ?? "Tente novamente mais tarde."}
        />
      ) : (
        <>
          <DuoPerfis eu={eu} amigo={amigo} />

          {/* Placar: anéis de compatibilidade + disputa por métrica */}
          <div className="surface-card mb-4 flex flex-col items-center gap-6 p-6 lg:flex-row">
            <div className="flex shrink-0 flex-col items-center gap-4 sm:flex-row">
              <AnelCompatibilidade valor={data.compatibilidade} rotulo="artistas" />
              <AnelCompatibilidade
                valor={data.compatibilidade_generos}
                rotulo="gêneros"
                tamanho="pequeno"
              />
            </div>

            <div className="w-full min-w-0 flex-1 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { rotulo: "Artistas em comum", valor: fmt(data.total_artistas_em_comum) },
                  { rotulo: "Faixas em comum", valor: fmt(data.faixas_em_comum) },
                  { rotulo: "Álbuns em comum", valor: fmt(albunsEmComum.length) },
                ].map((c) => (
                  <div key={c.rotulo} className="rounded-xl bg-surface-2 p-3 text-center">
                    <p className="font-display text-xl font-bold text-primary">{c.valor}</p>
                    <p className="text-[10px] text-muted-foreground">{c.rotulo}</p>
                  </div>
                ))}
              </div>
              <Disputa
                rotulo="Faixas ouvidas"
                meu={num(eu?.total_faixas)}
                doAmigo={num(amigo?.total_faixas)}
                nomeAmigo={nomeAmigo}
                icone={Music4}
              />
              <Disputa
                rotulo="Minutos ouvidos"
                meu={num(eu?.total_minutos)}
                doAmigo={num(amigo?.total_minutos)}
                nomeAmigo={nomeAmigo}
                icone={Timer}
              />
              <Disputa
                rotulo="Artistas diferentes"
                meu={num(eu?.artistas_unicos)}
                doAmigo={num(amigo?.artistas_unicos)}
                nomeAmigo={nomeAmigo}
                icone={Users}
              />
              <Disputa
                rotulo="Álbuns diferentes"
                meu={num(eu?.albuns_unicos)}
                doAmigo={num(amigo?.albuns_unicos)}
                nomeAmigo={nomeAmigo}
                icone={Layers}
              />
              <Disputa
                rotulo="Dias ativos"
                meu={num(eu?.dias_ativos)}
                doAmigo={num(amigo?.dias_ativos)}
                nomeAmigo={nomeAmigo}
                icone={CalendarClock}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Lado lado={eu} destaque={num(eu?.total_minutos) >= num(amigo?.total_minutos)} />
            <Lado lado={amigo} destaque={num(amigo?.total_minutos) > num(eu?.total_minutos)} />
          </div>

          <HorariosSobrepostos
            meu={eu?.por_hora ?? []}
            doAmigo={amigo?.por_hora ?? []}
            nomeAmigo={nomeAmigo}
          />

          {albunsEmComum.length > 0 ? (
            <div className="surface-card mt-4 p-5">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                <Disc3 className="size-4 text-primary" /> Álbuns em comum
              </h3>
              <p className="mb-4 text-xs text-muted-foreground">
                Barra da esquerda é você, da direita é {nomeAmigo}.
              </p>
              <ul className="space-y-3">
                {albunsEmComum.map((a) => (
                  <ItemEmComum
                    key={`${a.nome_album}-${a.nome_artista}`}
                    titulo={a.nome_album}
                    subtitulo={a.nome_artista}
                    imagem={a.imagem_url}
                    meu={num(a.minhas_reproducoes)}
                    dele={num(a.reproducoes_amigo)}
                    nomeAmigo={nomeAmigo}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {faixasEmComum.length > 0 ? (
            <div className="surface-card mt-4 p-5">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                <ListMusic className="size-4 text-primary" /> Faixas em comum
              </h3>
              <p className="mb-4 text-xs text-muted-foreground">
                As músicas que vocês dois mais repetiram.
              </p>
              <ul className="space-y-3">
                {faixasEmComum.map((f) => (
                  <ItemEmComum
                    key={`${f.nome_faixa}-${f.nome_artista}`}
                    titulo={f.nome_faixa}
                    subtitulo={f.nome_artista}
                    imagem={f.imagem_url}
                    meu={num(f.minhas_reproducoes)}
                    dele={num(f.reproducoes_amigo)}
                    nomeAmigo={nomeAmigo}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          <div className="surface-card mt-4 p-5">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-bold">Gêneros na balança</h3>
              <Sparkles className="size-4 text-primary" />
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Barra à esquerda é você, à direita é {nomeAmigo}. Sem gênero classificado, a faixa fica
              de fora.
            </p>

            {generos.length === 0 ? (
              <EmptyState
                icon={Music4}
                title="Sem gêneros para comparar"
                description="Assim que houver histórico classificado, a comparação aparece aqui."
              />
            ) : (
              <ul className="space-y-3">
                {generos.map((g) => {
                  const meu = num(g.meu_total);
                  const dele = num(g.total_amigo);
                  const total = Math.max(1, meu + dele);
                  const soMeu = dele === 0;
                  const soDele = meu === 0;
                  return (
                    <li key={g.genero ?? "sem-genero"}>
                      <div className="mb-1 flex justify-between gap-2 text-sm">
                        <span className="truncate font-medium">
                          {g.genero || "Sem gênero"}
                          {soMeu ? (
                            <span className="ml-1.5 text-xs text-primary">só você</span>
                          ) : soDele ? (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              só {nomeAmigo}
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {fmt(meu)} · {fmt(dele)}
                        </span>
                      </div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-[width] duration-700"
                          style={{ width: `${(meu / total) * 100}%` }}
                        />
                        <div
                          className="h-full bg-accent transition-[width] duration-700"
                          style={{ width: `${(dele / total) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="surface-card mt-4 p-5">
            <h3 className="font-display text-lg font-bold">Artistas em comum</h3>
            {artistasEmComum.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nenhum artista em comum ainda.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {artistasEmComum.map((a) => (
                  <ItemEmComum
                    key={a?.nome ?? Math.random()}
                    titulo={a?.nome ?? "Desconhecido"}
                    imagem={a?.imagem_url ?? null}
                    meu={num(a?.minhas_reproducoes)}
                    dele={num(a?.reproducoes_amigo)}
                    nomeAmigo={nomeAmigo}
                    redondo
                  />
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
