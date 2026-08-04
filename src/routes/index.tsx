import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Flame, Music4, Users } from "lucide-react";

import { ChartFrame } from "@/components/ChartFrame";
import { AppShell } from "@/components/AppShell";
import { SonicHero } from "@/components/SonicHero";
import { StatCard } from "@/components/StatCard";
import { TempoEscutaCard } from "@/components/TempoEscutaCard";
import {
  useComparacaoPlataformas,
  useFaixasRecentes,
  useGeneros,
  useHistoricoMensal,
  usePorHora,
  useResumo,
  useTopArtistas,
} from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sonora — Todo o seu histórico musical em um só lugar" },
      {
        name: "description",
        content:
          "Centralize Spotify, YouTube Music, Apple Music e Deezer: estatísticas, comparações, metas, conquistas e gráficos da sua vida musical.",
      },
      { property: "og:title", content: "Sonora — Sua vida musical unificada" },
      {
        property: "og:description",
        content:
          "Estatísticas completas e comparações entre plataformas de streaming de música em um painel único.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Painel,
});

const chartTooltip = {
  contentStyle: {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    color: "var(--foreground)",
    fontSize: "12px",
  },
} as const;

/** Data legível e tolerante a valores nulos/inválidos vindos da API. */
function formatarQuando(valor: string | null | undefined) {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Painel() {
  const { data: resumo, isLoading: carregandoResumo } = useResumo();
  const { data: historicoMensal = [] } = useHistoricoMensal(8);
  const { data: topArtistas = [] } = useTopArtistas(5);
  const { data: recentes = [] } = useFaixasRecentes(5);
  const { data: comparacao = [] } = useComparacaoPlataformas();
  const { data: generos = [] } = useGeneros(6);
  const { data: porHora = [] } = usePorHora();

  return (
    <AppShell>
      <SonicHero />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <TempoEscutaCard
          totalMinutos={resumo?.totalMinutos}
          carregando={carregandoResumo}
          label="Tempo ouvido"
        />
        <StatCard

          label="Reproduções"
          value={carregandoResumo ? "…" : (resumo?.totalFaixas ?? 0).toLocaleString("pt-BR")}
          hint="todas as plataformas"
          icon={Music4}
        />
        <StatCard
          label="Artistas únicos"
          value={carregandoResumo ? "…" : (resumo?.artistasUnicos ?? 0).toLocaleString("pt-BR")}
          hint="no seu histórico"
          icon={Users}
        />
        <StatCard
          label="Álbuns únicos"
          value={carregandoResumo ? "…" : (resumo?.albunsUnicos ?? 0).toLocaleString("pt-BR")}
          hint="ouvidos até agora"
          icon={Flame}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold">Minutos por mês</h2>
          <p className="mb-4 text-xs text-muted-foreground">Últimos 8 meses (total, todas as plataformas)</p>
          <ChartFrame className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicoMensal}>
                <defs>
                  <linearGradient id="chart-1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} width={40} />
                <Tooltip {...chartTooltip} />
                <Area
                  type="monotone"
                  dataKey="total_minutos"
                  isAnimationActive={false}
                  stroke="var(--chart-1)"
                  fill="url(#chart-1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartFrame>
          {historicoMensal.length === 0 ? (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Sem dados ainda — sincronize uma plataforma em "Plataformas".
            </p>
          ) : null}
        </div>

        <div className="surface-card p-5">
          <h2 className="text-lg font-semibold">Divisão por gênero</h2>
          <p className="mb-2 text-xs text-muted-foreground">Classificado automaticamente por faixa</p>
          <ChartFrame className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={generos}
                  dataKey="total_faixas"
                  nameKey="genero"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={3}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {generos.map((_, i) => (
                    <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </ChartFrame>
          <ul className="space-y-1.5 text-sm">
            {generos.map((g, i) => (
              <li key={g.genero ?? `g-${i}`} className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: `var(--chart-${(i % 5) + 1})` }}
                />
                <span className="flex-1 truncate text-muted-foreground">
                  {g.genero || "Sem gênero"}
                </span>
                <span className="font-medium">{Math.round(Number(g.percentual) || 0)}%</span>
              </li>
            ))}
            {generos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5">
          <h2 className="text-lg font-semibold">Quando você ouve</h2>
          <p className="mb-4 text-xs text-muted-foreground">Reproduções por hora do dia (fuso local)</p>
          <ChartFrame className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porHora}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="rotulo" stroke="var(--muted-foreground)" fontSize={10} interval={2} />
                <Tooltip {...chartTooltip} cursor={{ fill: "var(--muted)" }} />
                <Bar
                  dataKey="total_faixas"
                  fill="var(--chart-2)"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </div>

        <div className="surface-card p-5">
          <h2 className="text-lg font-semibold">Top artistas</h2>
          <p className="mb-3 text-xs text-muted-foreground">Somando todas as plataformas</p>
          <ol className="space-y-3">
            {topArtistas.map((a, i) => (
              <li key={a.nome_artista ?? `a-${i}`} className="flex items-center gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-secondary text-[11px] font-bold">
                  {i + 1}
                </span>
                <FotoArtista nome={a.nome_artista} url={a.imagem_url ?? null} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {a.nome_artista || "Artista desconhecido"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {Number(a.total_minutos) || 0} min
                  </span>
                </span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {Number(a.total_reproducoes) || 0} plays
                </span>
              </li>
            ))}
            {topArtistas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum artista ainda.</p>
            ) : null}
          </ol>

        </div>

        <div className="surface-card p-5">
          <h2 className="text-lg font-semibold">Tocadas recentemente</h2>
          <p className="mb-3 text-xs text-muted-foreground">Últimas faixas sincronizadas</p>
          <ul className="space-y-3">
            {recentes.map((t) => (
              <li key={t.id} className="flex items-center gap-3">
                <span
                  className="h-9 w-1 rounded-full"
                  style={{ background: t.plataforma_cor || "var(--color-primary)" }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {t.nome_faixa || "Faixa sem nome"}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {t.nome_artista || "Artista desconhecido"} · {t.plataforma_nome || "—"}
                  </span>
                </span>
                <span className="text-xs whitespace-nowrap text-muted-foreground">
                  {formatarQuando(t.tocado_em)}
                </span>
              </li>
            ))}
            {recentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma faixa sincronizada ainda.</p>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="surface-card mt-4 p-5">
        <h2 className="text-lg font-semibold">Comparação entre plataformas</h2>
        <p className="mb-4 text-xs text-muted-foreground">Participação no seu tempo de audição</p>
        <div className="space-y-3">
          {comparacao.map((p) => {
            const totalMinutos = Number(resumo?.totalMinutos) || 1;
            const minutos = Number(p.total_minutos) || 0;
            const share = Math.max(0, Math.min(100, Math.round((minutos / totalMinutos) * 100)));
            return (
              <div key={p.chave}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{p.nome_exibicao || p.chave}</span>
                  <span className="text-muted-foreground">
                    {minutos.toLocaleString("pt-BR")} min · {share}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${share}%`, background: p.cor_tema || "var(--color-primary)" }}
                  />
                </div>
              </div>
            );
          })}
          {comparacao.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

/** Foto (capa mais frequente) do artista no ranking, com fallback nas iniciais. */
function FotoArtista({ nome, url }: { nome: string | null; url: string | null }) {
  const iniciais = (nome || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  return (
    <span className="size-10 shrink-0 overflow-hidden rounded-full bg-secondary">
      {url ? (
        <img
          src={url}
          alt={nome ? `Foto de ${nome}` : "Artista"}
          loading="lazy"
          decoding="async"
          width={80}
          height={80}
          className="size-full object-cover"
        />
      ) : (
        <span className="grid size-full place-items-center text-xs font-bold text-muted-foreground">
          {iniciais}
        </span>
      )}
    </span>
  );
}
