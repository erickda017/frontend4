import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Music4, Sparkles, Timer, Users } from "lucide-react";

import { AppShell, PageHeader } from "@/components/AppShell";
import { EmptyState, SkeletonCards } from "@/components/States";
import { useComparacaoAmigo, type LadoComparacao } from "@/lib/queries";

export const Route = createFileRoute("/amigos/$amigoId")({
  head: () => ({
    meta: [
      { title: "Comparar gosto musical — Sonora" },
      {
        name: "description",
        content: "Compare artistas, gêneros, histórico e tempo ouvido com um amigo no Sonora.",
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
function AnelCompatibilidade({ valor }: { valor: number }) {
  const alvo = Math.max(0, Math.min(100, num(valor)));
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setPct(alvo));
    return () => cancelAnimationFrame(id);
  }, [alvo]);

  return (
    <div className="relative grid size-36 shrink-0 place-items-center">
      <div
        className="absolute inset-0 rounded-full transition-all duration-1000 ease-out"
        style={{
          background: `conic-gradient(var(--color-primary) ${pct}%, color-mix(in oklch, var(--color-muted) 70%, transparent) 0)`,
        }}
        aria-hidden
      />
      <div className="absolute inset-[10px] rounded-full bg-card" aria-hidden />
      <div className="relative text-center">
        <p className="font-display text-3xl font-bold text-primary">{alvo}%</p>
        <p className="text-[10px] tracking-wide text-muted-foreground uppercase">compatível</p>
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

function Lado({ lado, destaque }: { lado: LadoComparacao | undefined; destaque?: boolean }) {
  const top = lado?.top_artistas ?? [];

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
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Faixas</dt>
          <dd className="font-medium">{fmt(lado?.total_faixas)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Minutos</dt>
          <dd className="font-medium">{fmt(lado?.total_minutos)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Artistas</dt>
          <dd className="font-medium">{fmt(lado?.artistas_unicos)}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Top artistas
      </p>
      <ul className="mt-1 space-y-1 text-sm">
        {top.length === 0 ? (
          <li className="text-muted-foreground">—</li>
        ) : (
          top.map((a) => (
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
  const emComum = data?.artistas_em_comum ?? [];

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
        subtitle="Artistas em comum, gêneros, histórico e tempo ouvido lado a lado."
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
          {/* Placar dinâmico: anel de compatibilidade + disputa por métrica */}
          <div className="surface-card mb-4 flex flex-col items-center gap-6 p-6 sm:flex-row">
            <AnelCompatibilidade valor={data.compatibilidade} />
            <div className="w-full min-w-0 flex-1 space-y-3">
              <p className="text-sm text-muted-foreground">
                {fmt(data.total_artistas_em_comum)} artistas e {fmt(data.faixas_em_comum)} faixas em
                comum com <span className="font-medium text-foreground">{nomeAmigo}</span>.
              </p>
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
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Lado lado={eu} destaque={num(eu?.total_minutos) >= num(amigo?.total_minutos)} />
            <Lado lado={amigo} destaque={num(amigo?.total_minutos) > num(eu?.total_minutos)} />
          </div>

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
            {emComum.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nenhum artista em comum ainda.</p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm">
                {emComum.map((a) => {
                  const meu = num(a?.minhas_reproducoes);
                  const dele = num(a?.reproducoes_amigo);
                  const total = Math.max(1, meu + dele);
                  return (
                    <li key={a?.nome ?? Math.random()}>
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="truncate font-medium">{a?.nome ?? "Desconhecido"}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          você {fmt(meu)} · {nomeAmigo} {fmt(dele)}
                        </span>
                      </div>
                      <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
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
        </>
      )}
    </AppShell>
  );
}
