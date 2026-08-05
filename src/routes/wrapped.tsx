import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Clock, Disc3, Music4, Sparkles } from "lucide-react";

import { AppShell, PageHeader } from "@/components/AppShell";
import { SkeletonCards } from "@/components/States";
import { useWrapped } from "@/lib/queries";

export const Route = createFileRoute("/wrapped")({
  head: () => ({
    meta: [
      { title: "Seu Wrapped — Sonora" },
      {
        name: "description",
        content: "O resumo do seu ano musical: artista, faixa e gênero favoritos, e mais.",
      },
    ],
  }),
  component: WrappedPage,
});

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
        <div className="space-y-4">
          <div
            className="surface-card p-6 text-center"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Sparkles className="mx-auto mb-2 size-6 text-white" />
            <p className="font-display text-3xl font-bold text-white">
              {(data.total_minutos ?? 0).toLocaleString("pt-BR")} min
            </p>
            <p className="text-sm text-white/80">
              {(data.total_faixas ?? 0).toLocaleString("pt-BR")} faixas ouvidas em {ano}
              {crescimentoPct !== null ? (
                <span className="ml-1">
                  · {crescimentoPct >= 0 ? "+" : ""}
                  {crescimentoPct}% vs {ano - 1}
                </span>
              ) : null}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-card p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Music4 className="size-4" /> Artistas do ano
              </h3>
              <ol className="space-y-2">
                {(data.top_artistas ?? []).map((a, i) => (
                  <li key={a.nome} className="flex items-center gap-3 text-sm">
                    <span className="w-4 shrink-0 text-muted-foreground">{i + 1}</span>
                    {a.imagem_url ? (
                      <img
                        src={a.imagem_url}
                        alt={a.nome}
                        className="size-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                        {a.nome.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate font-medium">{a.nome}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {a.total_faixas}x
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="surface-card p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Disc3 className="size-4" /> Faixas do ano
              </h3>
              <ol className="space-y-2">
                {(data.top_faixas ?? []).map((f, i) => (
                  <li
                    key={`${f.nome_faixa}-${f.nome_artista}`}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="w-4 shrink-0 text-muted-foreground">{i + 1}</span>
                    {f.imagem_url ? (
                      <img
                        src={f.imagem_url}
                        alt={f.nome_faixa}
                        className="size-8 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Music4 className="size-4" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      <span className="block truncate font-medium">{f.nome_faixa}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {f.nome_artista}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{f.total_plays}x</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="surface-card p-5">
            <h3 className="mb-3 text-sm font-semibold">Gêneros do ano</h3>
            <div className="flex flex-wrap gap-2">
              {(data.top_generos ?? []).map((g) => (
                <span
                  key={g.genero}
                  className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium"
                >
                  {g.genero} · {g.total_faixas}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-card flex items-center gap-3 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Clock className="size-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Hora favorita</p>
                <p className="font-display text-lg font-bold">{data.hora_favorita}</p>
              </div>
            </div>
            <div className="surface-card flex items-center gap-3 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="size-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Dia favorito</p>
                <p className="font-display text-lg font-bold">{data.dia_favorito}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
