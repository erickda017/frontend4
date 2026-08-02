import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { Check, Loader2, Plus, RefreshCw, Unplug } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartFrame } from "@/components/ChartFrame";
import { AppShell, PageHeader } from "@/components/AppShell";
import { EmptyState, SkeletonCards } from "@/components/States";
import { useAuth } from "@/lib/auth-context";
import {
  iniciarConexaoOAuth,
  useComparacaoPlataformas,
  useDesconectarPlataforma,
  usePerfilPlataformas,
  useSincronizarPlataforma,
} from "@/lib/queries";

type BuscaPlataformas = { conectado?: string | undefined; erro?: string | undefined };

export const Route = createFileRoute("/plataformas")({
  validateSearch: (search: Record<string, unknown>): BuscaPlataformas => ({
    conectado: typeof search['conectado'] === "string" ? search['conectado'] : undefined,
    erro: typeof search['erro'] === "string" ? search['erro'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Plataformas conectadas — Sonora" },
      {
        name: "description",
        content:
          "Conecte e compare Spotify, YouTube Music, Apple Music, Deezer e Tidal lado a lado.",
      },
      { property: "og:title", content: "Plataformas conectadas — Sonora" },
      {
        property: "og:description",
        content: "Compare minutos, reproduções e participação de cada serviço de streaming.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Plataformas,
});

const MENSAGENS_ERRO: Record<string, string> = {
  spotify_negado: "Você cancelou a autorização no Spotify.",
  falha_conexao: "Não consegui salvar a conexão. Tente conectar de novo.",
};

function Plataformas() {
  const { user } = useAuth();
  const busca = useSearch({ from: "/plataformas" });
  const { data: platforms = [], isLoading } = usePerfilPlataformas();
  const { data: comparacao = [] } = useComparacaoPlataformas();
  const desconectar = useDesconectarPlataforma();
  const sincronizar = useSincronizarPlataforma();

  // Retorno do OAuth: o backend redireciona com ?conectado=spotify ou ?erro=...
  useEffect(() => {
    if (busca.conectado) toast.success(`Conta ${busca.conectado} conectada com sucesso!`);
    if (busca.erro) toast.error(MENSAGENS_ERRO[busca.erro] ?? "Não foi possível conectar.");
  }, [busca.conectado, busca.erro]);

  const usoPorChave = Object.fromEntries(comparacao.map((c) => [c.chave, c]));
  const chartData = comparacao.map((c) => ({
    nome: c.nome_exibicao,
    minutos: c.total_minutos,
    cor: c.cor_tema,
  }));

  function handleConnect(chave: string) {
    if (!user) return;
    // Fluxo OAuth: redirect de página inteira para o backend Node.
    iniciarConexaoOAuth(chave, user.id);
  }

  function handleSync(chave: string, nome: string) {
    sincronizar.mutate(chave, {
      onSuccess: (r) => {
        toast.success(
          r.faixas_novas > 0
            ? `${nome}: ${r.faixas_novas} nova(s) reprodução(ões) importada(s).`
            : `${nome} já estava em dia.`,
        );
        r.conquistas_desbloqueadas?.forEach((c) => toast(`🏆 Conquista: ${c.titulo}`));
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  function handleDisconnect(chave: string, nome: string) {
    desconectar.mutate(chave, {
      onSuccess: () => toast.success(`${nome} desconectado.`),
      onError: (e: Error) => toast.error(e.message),
    });
  }

  return (
    <AppShell>
      <PageHeader
        title="Plataformas"
        subtitle="Conecte seus serviços e compare o uso de cada um."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? <SkeletonCards count={3} /> : null}

        {platforms.map((p) => {
          const uso = usoPorChave[p.chave];
          const sincronizandoEssa = sincronizar.isPending && sincronizar.variables === p.chave;
          return (
            <div key={p.chave} className="surface-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="size-10 shrink-0 rounded-xl"
                    style={{ background: p.cor_tema ?? "#999" }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.nome_exibicao}</p>
                    <p className="text-xs text-muted-foreground">
                      {!p.ativa ? "Em breve" : p.conectada ? "Conectado" : "Não conectado"}
                    </p>
                  </div>
                </div>
                {p.conectada ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
                    <Check className="size-3" /> Ativo
                  </span>
                ) : (
                  <button
                    disabled={!p.ativa}
                    onClick={() => handleConnect(p.chave)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="size-3.5" /> Conectar
                  </button>
                )}
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-muted/60 py-2">
                  <dt className="text-[11px] text-muted-foreground">Minutos</dt>
                  <dd className="text-sm font-semibold">
                    {(uso?.total_minutos ?? 0).toLocaleString("pt-BR")}
                  </dd>
                </div>
                <div className="rounded-lg bg-muted/60 py-2">
                  <dt className="text-[11px] text-muted-foreground">Faixas</dt>
                  <dd className="text-sm font-semibold">
                    {(uso?.total_faixas ?? 0).toLocaleString("pt-BR")}
                  </dd>
                </div>
              </dl>

              {p.conectada ? (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleSync(p.chave, p.nome_exibicao)}
                    disabled={sincronizandoEssa}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground disabled:opacity-60"
                  >
                    {sincronizandoEssa ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                    Sincronizar
                  </button>
                  <button
                    onClick={() => handleDisconnect(p.chave, p.nome_exibicao)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Unplug className="size-3.5" />
                    Desconectar
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="surface-card mt-4 p-5">
        <h2 className="text-lg font-semibold">Minutos por plataforma</h2>
        <p className="mb-4 text-xs text-muted-foreground">Total acumulado</p>
        {chartData.length === 0 ? (
          <EmptyState
            icon={RefreshCw}
            title="Nenhum dado sincronizado"
            description="Conecte uma plataforma e toque em Sincronizar para trazer seu histórico."
          />
        ) : (
          <ChartFrame className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="nome"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  width={86}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="minutos" radius={[0, 8, 8, 0]} isAnimationActive={false}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        )}
      </div>
    </AppShell>
  );
}
