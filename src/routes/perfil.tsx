import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Check,
  Clock,
  Disc3,
  Download,
  Music4,
  Sparkles,
  Trophy,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/AppShell";
import { CampoImagem } from "@/components/CampoImagem";
import { EmptyState, SkeletonCards } from "@/components/States";
import { StatCard } from "@/components/StatCard";
import { TempoEscutaCard } from "@/components/TempoEscutaCard";
import {
  type PeriodoResumo,
  useAceitarAmigo,
  useAmigos,
  useConvidarAmigo,
  useExportarHistorico,
  useGeneros,
  useImportarHistoricoSpotify,
  usePerfil,
  usePorHora,
  usePreencherCapasFaltantes,
  useRankingAmigos,
  useRemoverAmigo,
  useSalvarPerfil,
} from "@/lib/queries";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Seu perfil sonoro — Sonora" },
      {
        name: "description",
        content:
          "Veja suas informações, importe o histórico do Spotify e compare seu gosto musical com amigos.",
      },
      { property: "og:title", content: "Seu perfil sonoro — Sonora" },
      {
        property: "og:description",
        content: "Perfil, importação de histórico e amigos em um só lugar.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerfilPage,
});

function formatarData(valor: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PerfilPage() {
  const { data: perfil, isLoading } = usePerfil();
  const exportar = useExportarHistorico();

  return (
    <AppShell>
      <PageHeader
        title="Perfil"
        subtitle="Suas informações, importação de histórico e amigos — tudo junto."
      />

      {isLoading ? <SkeletonCards /> : <CartaoPerfil />}

      <div className="surface-card mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="font-semibold">Seu Wrapped</p>
            <p className="text-xs text-muted-foreground">
              O resumo do seu ano musical: artista, faixa e gênero favoritos, e mais.
            </p>
          </div>
        </div>
        <Link
          to="/wrapped"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
        >
          Ver meu Wrapped
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <GenerosCard />
        <HorasCard />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ImportarSpotify />
        <Amigos />
      </div>

      <div className="surface-card mt-6 p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Download className="size-5" />
          </span>
          <div>
            <p className="font-semibold">Exportar histórico</p>
            <p className="text-xs text-muted-foreground">
              Baixe todas as suas reproduções registradas no Sonora.
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() =>
              exportar.mutate("csv", { onError: (e: Error) => toast.error(e.message) })
            }
            disabled={exportar.isPending}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium disabled:opacity-60"
          >
            Baixar .csv
          </button>
          <button
            onClick={() =>
              exportar.mutate("json", { onError: (e: Error) => toast.error(e.message) })
            }
            disabled={exportar.isPending}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium disabled:opacity-60"
          >
            Baixar .json
          </button>
        </div>
      </div>

      {perfil ? (
        <p className="mt-6 text-xs text-muted-foreground">
          Membro desde {formatarData(perfil.membro_desde)} · {perfil.email}
          {" · "}
          <BotaoPreencherCapas />
        </p>
      ) : null}
    </AppShell>
  );
}

/**
 * Backfill manual e discreto: preenche a capa de faixas importadas antes de
 * o import passar a buscar capa automaticamente (ver preencherCapasDoLote no
 * backend). Fica embutido no texto do rodapé de propósito — é uma ação de
 * manutenção pontual, não algo que precise de destaque na tela.
 */
function BotaoPreencherCapas() {
  const preencher = usePreencherCapasFaltantes();

  return (
    <button
      type="button"
      onClick={() =>
        preencher.mutate(undefined, {
          onSuccess: (r) => {
            toast.success(
              r.faixas_unicas_sem_capa === 0
                ? "Nenhuma capa faltando."
                : `${r.capas_atualizadas} de ${r.faixas_unicas_sem_capa} capas preenchidas.`
            );
          },
          onError: (e: Error) => toast.error(e.message),
        })
      }
      disabled={preencher.isPending}
      className="underline decoration-dotted underline-offset-2 hover:text-foreground disabled:opacity-60"
    >
      {preencher.isPending ? "buscando capas…" : "capas"}
    </button>
  );
}

function CartaoPerfil() {
  const { data: perfil } = usePerfil();
  const salvar = useSalvarPerfil();
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState("");
  const [avatar, setAvatar] = useState("");
  const [banner, setBanner] = useState("");

  if (!perfil) return null;

  const iniciais = (perfil.nome_exibicao || "S").slice(0, 2).toUpperCase();

  // Enquanto edita, o cartão mostra o preview do que foi escolhido.
  const avatarVisivel = editando ? avatar : (perfil.avatar_url ?? "");
  const bannerVisivel = editando ? banner : (perfil.banner_url ?? "");

  const dados = perfil;
  function abrirEdicao() {
    setNome(dados.nome_exibicao ?? "");
    setAvatar(dados.avatar_url ?? "");
    setBanner(dados.banner_url ?? "");
    setEditando(true);
  }

  return (
    <>
      <div className="surface-card overflow-hidden">
        {/* Banner grande e presente. Sem imagem, entra o gradiente animado do
            tema; com imagem/GIF, usamos <img> para o GIF continuar animando. */}
        <div className="banner-shine relative h-48 w-full sm:h-64">
          {bannerVisivel ? (
            <img
              src={bannerVisivel}
              alt={`Banner de ${perfil.nome_exibicao}`}
              className="size-full object-cover"
            />
          ) : (
            <div className="banner-animado size-full" role="img" aria-label="Banner do perfil" />
          )}
          {/* Degradê para o conteúdo do cartão nunca competir com a imagem. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:gap-5">
            <div className="relative shrink-0">
              <div className="grid size-24 place-items-center overflow-hidden rounded-3xl border-4 border-card bg-surface-2 font-display text-3xl font-bold shadow-xl sm:size-28">
                {avatarVisivel ? (
                  <img
                    src={avatarVisivel}
                    alt={perfil.nome_exibicao}
                    className="size-full object-cover"
                  />
                ) : (
                  iniciais
                )}
              </div>
              <span className="absolute -inset-1 -z-10 rounded-[1.75rem] opacity-70 blur-md [background:var(--gradient-brand)]" />
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <h2 className="truncate font-display text-3xl font-bold sm:text-4xl">
                {editando ? nome || perfil.nome_exibicao : perfil.nome_exibicao}
              </h2>
              <p className="truncate text-xs text-muted-foreground">
                Membro desde {formatarData(perfil.membro_desde)}
              </p>
            </div>

            {!editando ? (
              <button
                onClick={abrirEdicao}
                className="shrink-0 self-start rounded-lg border border-border bg-card/80 px-3 py-1.5 text-xs font-medium backdrop-blur hover:border-primary/60 sm:self-auto"
              >
                Editar perfil
              </button>
            ) : null}
          </div>
        </div>

        {editando ? (
          <form
            className="space-y-4 border-t border-border p-5"
            onSubmit={(e) => {
              e.preventDefault();
              salvar.mutate(
                { nome_exibicao: nome, avatar_url: avatar, banner_url: banner },
                {
                  onSuccess: () => {
                    toast.success("Perfil atualizado.");
                    setEditando(false);
                  },
                  onError: (err: Error) => toast.error(err.message),
                },
              );
            }}
          >
            <div>
              <p className="text-sm font-medium">Nome de exibição</p>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Como quer ser chamado?"
                className="mt-2 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <CampoImagem
                titulo="Foto de perfil"
                descricao="Quadrada fica melhor. Aceita GIF animado (até 3 MB), URL ou arquivo."
                valor={avatar}
                onChange={setAvatar}
                larguraMax={320}
                alturaMax={320}
                formato="avatar"
              />
              <CampoImagem
                titulo="Banner"
                descricao="Imagem larga (3:1). GIF animado também funciona (até 3 MB)."
                valor={banner}
                onChange={setBanner}
                larguraMax={1600}
                alturaMax={600}
                formato="banner"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={salvar.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {salvar.isPending ? "Salvando…" : "Salvar alterações"}
              </button>
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Faixas"
          value={(perfil.resumo?.totalFaixas ?? 0).toLocaleString("pt-BR")}
          icon={Music4}
        />
        <TempoEscutaCard totalMinutos={perfil.resumo?.totalMinutos} />
        <StatCard
          label="Artistas"
          value={String(perfil.resumo?.artistasUnicos ?? 0)}
          icon={Disc3}
        />
        <StatCard label="Conquistas" value={String(perfil.total_conquistas ?? 0)} icon={Trophy} />
      </div>
    </>
  );
}


function GenerosCard() {
  const { data = [], isLoading } = useGeneros(8);

  return (
    <div className="surface-card p-5">
      <h3 className="font-display text-lg font-bold">Gêneros que você ouve</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Classificados por faixa no backend, na hora da sincronização.
      </p>

      {isLoading ? (
        <SkeletonCards />
      ) : data.length === 0 ? (
        <EmptyState icon={Disc3} title="Sem dados ainda" description="Sincronize uma plataforma." />
      ) : (
        <ul className="space-y-3">
          {data.map((g) => (
            <li key={g.genero}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">{g.genero}</span>
                <span className="text-muted-foreground">{g.percentual}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${g.percentual}%`, background: "var(--gradient-brand)" }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HorasCard() {
  const { data = [], isLoading } = usePorHora();
  const maximo = Math.max(1, ...data.map((h) => h.total_faixas));

  return (
    <div className="surface-card p-5">
      <h3 className="font-display text-lg font-bold">Quando você ouve</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Reproduções agrupadas por hora do dia, no seu fuso.
      </p>

      {isLoading ? (
        <SkeletonCards />
      ) : data.every((h) => h.total_faixas === 0) ? (
        <EmptyState icon={Clock} title="Sem dados ainda" description="Sincronize uma plataforma." />
      ) : (
        <div className="flex h-40 items-end gap-[3px]">
          {data.map((h) => (
            <div
              key={h.hora}
              className="group relative flex-1"
              title={`${h.rotulo} — ${h.total_faixas} faixas`}
            >
              <div
                className="w-full rounded-t bg-primary/70 transition-all group-hover:bg-primary"
                style={{ height: `${Math.max(3, (h.total_faixas / maximo) * 140)}px` }}
              />
            </div>
          ))}
        </div>
      )}
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

function ImportarSpotify() {
  const importar = useImportarHistoricoSpotify();
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);

  function enviar(lista: FileList | null) {
    const arquivos = Array.from(lista ?? []).filter((f) => /\.(json|zip)$/i.test(f.name));
    if (arquivos.length === 0) {
      toast.error("Selecione o .zip do Spotify ou os arquivos .json do histórico.");
      return;
    }

    importar.mutate(arquivos, {
      onSuccess: (r) => {
        toast.success(`${r.faixas_novas.toLocaleString("pt-BR")} reproduções importadas.`);
        if (r.conquistas_desbloqueadas?.length) {
          toast.success(
            `Novas conquistas: ${r.conquistas_desbloqueadas.map((c) => c.titulo).join(", ")}`,
          );
        }
      },
      onError: (err: Error) => toast.error(err.message),
    });
  }

  return (
    <div className="surface-card p-5">
      <h3 className="font-display text-lg font-bold">Importar histórico do Spotify</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Peça o “Extended Streaming History” em spotify.com/account/privacy e solte aqui o{" "}
        <code>my_spotify_data.zip</code> inteiro (ou os <code>Streaming_History_Audio_*.json</code>{" "}
        de dentro dele). É o único jeito de trazer anos de histórico — e os gêneros são buscados na
        API do Spotify durante a importação.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          enviar(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`grid cursor-pointer place-items-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
          arrastando ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"
        }`}
      >
        <Upload className="size-6 text-primary" />
        <p className="text-sm font-medium">
          {importar.isPending
            ? "Enviando e processando…"
            : "Arraste o .zip (ou os .json) ou clique para escolher"}
        </p>
        <p className="text-xs text-muted-foreground">Até 40 arquivos, 60MB cada.</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json,application/zip,.zip"
          multiple
          hidden
          onChange={(e) => enviar(e.target.files)}
        />
      </div>
    </div>
  );
}

function Amigos() {
  const { data: amigos = [], isLoading } = useAmigos();
  const convidar = useConvidarAmigo();
  const aceitar = useAceitarAmigo();
  const remover = useRemoverAmigo();
  const [email, setEmail] = useState("");

  const aceitos = amigos.filter((a) => a.status === "aceita");
  const pendentes = amigos.filter((a) => a.status === "pendente");

  return (
    <>
      {aceitos.length > 0 ? <RankingAmigos /> : null}
      <div className="surface-card p-5">
        <h3 className="font-display text-lg font-bold">Amigos</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Adicione pelo e-mail da conta Sonora e compare gostos, histórico e tempo ouvido.
        </p>

        <form
          className="mb-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim()) return;
            convidar.mutate(email.trim(), {
              onSuccess: () => {
                toast.success("Convite enviado!");
                setEmail("");
              },
              onError: (err: Error) => toast.error(err.message),
            });
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@do.amigo"
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={convidar.isPending}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            <UserPlus className="size-4" />
            Convidar
          </button>
        </form>

        {isLoading ? (
          <SkeletonCards />
        ) : amigos.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum amigo ainda"
            description="Convide alguém pelo e-mail para comparar gostos musicais."
          />
        ) : (
          <div className="space-y-4">
            {pendentes.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Convites
                </p>
                <ul className="space-y-2">
                  {pendentes.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {a.amigo_nome}
                        <span className="ml-1 text-xs text-muted-foreground">
                          {a.eu_enviei ? "· aguardando resposta" : "· quer te adicionar"}
                        </span>
                      </span>
                      {!a.eu_enviei ? (
                        <button
                          onClick={() => aceitar.mutate(a.id)}
                          className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"
                          title="Aceitar"
                        >
                          <Check className="size-4" />
                        </button>
                      ) : null}
                      <button
                        onClick={() => remover.mutate(a.id)}
                        className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground hover:text-destructive"
                        title="Remover"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {aceitos.length > 0 ? (
              <ul className="space-y-2">
                {aceitos.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2 text-sm"
                  >
                    <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-xs font-bold">
                      {a.amigo_avatar_url ? (
                        <img
                          src={a.amigo_avatar_url}
                          alt={a.amigo_nome}
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      ) : (
                        a.amigo_nome.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{a.amigo_nome}</span>
                    <Link
                      to="/amigos/$amigoId"
                      params={{ amigoId: a.amigo_id }}
                      className="rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/25"
                    >
                      Comparar
                    </Link>
                    <button
                      onClick={() => remover.mutate(a.id)}
                      className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive"
                      title="Desfazer amizade"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

/** Ranking entre você e seus amigos aceitos, com o mesmo seletor de período
 *  (todo período / semana / mês) usado no card "Tempo ouvido". */
function RankingAmigos() {
  const [periodo, setPeriodo] = useState<PeriodoResumo>("total");
  const { data: ranking = [], isLoading } = useRankingAmigos(periodo);

  const rotuloPeriodo: Record<PeriodoResumo, string> = {
    total: "Todo período",
    semana: "Última semana",
    mes: "Mês",
  };

  return (
    <div className="surface-card mb-4 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">Ranking com amigos</h3>
        <div className="flex gap-1">
          {(["total", "semana", "mes"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodo(p)}
              className={`rounded-full border px-2 py-1 text-[10px] font-medium transition-colors ${
                periodo === p
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {rotuloPeriodo[p]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <SkeletonCards count={3} />
      ) : (
        <ol className="space-y-2">
          {ranking.map((r, i) => (
            <li
              key={r.usuario_id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                r.eu ? "bg-primary/10" : "bg-surface-2"
              }`}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {i + 1}
              </span>
              {r.avatar_url ? (
                <img
                  src={r.avatar_url}
                  alt={r.nome}
                  className="size-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                  {r.nome.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate font-medium">{r.eu ? "Você" : r.nome}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {r.total_minutos.toLocaleString("pt-BR")} min
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
