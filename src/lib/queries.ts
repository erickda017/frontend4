import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, API_URL } from "./api";
import { useAuth } from "./auth-context";

// ----------------------------------------------------------------------------
// Todos os tipos abaixo espelham exatamente o que o backend (Projeto B)
// devolve. Nomes em snake_case/português foram mantidos de propósito para
// bater 1:1 com src/services/*.js e facilitar comparar os dois lados.
// ----------------------------------------------------------------------------

export type Resumo = {
  totalFaixas: number;
  totalMinutos: number;
  artistasUnicos: number;
  albunsUnicos: number;
};

export type ComparacaoPlataforma = {
  chave: string;
  nome_exibicao: string;
  cor_tema: string;
  total_faixas: number;
  total_minutos: number;
};

export type TopArtista = {
  nome_artista: string;
  total_reproducoes: number;
  total_minutos?: number;
  /** Capa mais frequente do artista no histórico — usada como "foto" no ranking. */
  imagem_url?: string | null;
};

export type HistoricoMensal = {
  mes: string; // "AAAA-MM"
  total_faixas: number;
  total_minutos: number;
  artista_top: string | null;
};

export type MetaProgresso = {
  id: string;
  titulo: string;
  tipo: "quantidade_faixas" | "minutos_ouvidos" | "artistas_diferentes";
  valor_alvo: number;
  periodo: "semana" | "mes" | "ano";
  criado_em: string;
  valor_atual: number;
  percentual: number;
};

export type Meta = {
  id: string;
  titulo: string;
  tipo: MetaProgresso["tipo"];
  valor_alvo: number;
  periodo: MetaProgresso["periodo"];
  criado_em: string;
};

export type ConquistaDesbloqueada = {
  id: string;
  chave: string;
  titulo: string;
  descricao: string | null;
  desbloqueada_em: string;
};

export type PlataformaPerfil = {
  id: number;
  chave: string;
  nome_exibicao: string;
  cor_tema: string | null;
  ativa: boolean;
  conectada: boolean;
};

export type FaixaRecente = {
  id: string;
  nome_faixa: string;
  nome_artista: string;
  nome_album: string | null;
  duracao_ms: number | null;
  tocado_em: string;
  imagem_capa_url: string | null;
  plataforma_chave: string;
  plataforma_nome: string;
  plataforma_cor: string;
};

// Só existe no backend enquanto lista fixa de regras (services/achievementsService.js).
// Não há endpoint "todas as conquistas possíveis", então espelhamos aqui para
// mostrar também as que ainda estão bloqueadas. Se a lista mudar no backend,
// atualize aqui também.
export const CATALOGO_CONQUISTAS = [
  { chave: "primeira_musica", titulo: "Primeiro Play", descricao: "Você conectou uma plataforma e sincronizou sua primeira música!" },
  { chave: "cem_faixas", titulo: "Maratonista Musical", descricao: "Você já ouviu 100 faixas registradas no Music Hub." },
  { chave: "mil_faixas", titulo: "Mil e Uma Músicas", descricao: "Uau! 1.000 faixas no seu histórico." },
  { chave: "dez_artistas", titulo: "Explorador Sonoro", descricao: "Você já ouviu pelo menos 10 artistas diferentes." },
  { chave: "cem_horas", titulo: "Cem Horas de Som", descricao: "Mais de 6.000 minutos (100 horas) de música ouvida." },
] as const;

// ----------------------------------------------------------------------------
// Hooks — cada um só roda quando há usuário logado (todas as rotas do
// backend exigem Authorization: Bearer <token>, ver middleware/auth.js)
// ----------------------------------------------------------------------------

export function useResumo() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["resumo"],
    queryFn: () => api.get<Resumo>("/api/stats/resumo"),
    enabled: !!user,
  });
}

export function useComparacaoPlataformas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["comparacao-plataformas"],
    queryFn: () => api.get<ComparacaoPlataforma[]>("/api/stats/comparacao-plataformas"),
    enabled: !!user,
  });
}

export function useTopArtistas(limite = 5) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["top-artistas", limite],
    queryFn: () => api.get<TopArtista[]>(`/api/stats/top-artistas?limite=${limite}`),
    enabled: !!user,
  });
}

export function useHistoricoMensal(meses = 8) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["historico-mensal", meses],
    queryFn: () => api.get<HistoricoMensal[]>(`/api/stats/historico-mensal?meses=${meses}`),
    enabled: !!user,
  });
}

export function useFaixasRecentes(limite = 8) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recentes", limite],
    // Endpoint novo (ver statsRoutes.js / statsService.js) — não existia antes.
    queryFn: () => api.get<FaixaRecente[]>(`/api/stats/recentes?limite=${limite}`),
    enabled: !!user,
  });
}

export function useMetasProgresso() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["metas-progresso"],
    queryFn: () => api.get<MetaProgresso[]>("/api/stats/metas"),
    enabled: !!user,
  });
}

export function useMetas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["metas"],
    queryFn: () => api.get<Meta[]>("/api/metas"),
    enabled: !!user,
  });
}

export function useCriarMeta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (novaMeta: Pick<Meta, "titulo" | "tipo" | "valor_alvo" | "periodo">) =>
      api.post<Meta>("/api/metas", novaMeta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas"] });
      queryClient.invalidateQueries({ queryKey: ["metas-progresso"] });
    },
  });
}

export function useApagarMeta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/metas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas"] });
      queryClient.invalidateQueries({ queryKey: ["metas-progresso"] });
    },
  });
}

export function usePerfilConquistas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conquistas"],
    queryFn: () => api.get<ConquistaDesbloqueada[]>("/api/perfil/conquistas"),
    enabled: !!user,
  });
}

/** Conquista dinâmica por artista/faixa/gênero, desbloqueada ou não, com
 * progresso (atual/meta) calculado a partir do histórico real do usuário. */
export type ConquistaDinamicaPreview = {
  chave: string;
  titulo: string;
  descricao: string;
  raridade: string;
  desbloqueada: boolean;
  atual: number;
  meta: number;
  metrica: "horas" | "plays" | "faixas";
};

export function useConquistasDinamicasPreview() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conquistas-dinamicas-preview"],
    queryFn: () =>
      api.get<ConquistaDinamicaPreview[]>("/api/perfil/conquistas-dinamicas-preview"),
    enabled: !!user,
  });
}

export function usePerfilPlataformas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["perfil-plataformas"],
    queryFn: () => api.get<PlataformaPerfil[]>("/api/perfil/plataformas"),
    enabled: !!user,
  });
}

export function useDesconectarPlataforma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chave: string) => api.delete<void>(`/api/perfil/plataformas/${chave}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perfil-plataformas"] });
      queryClient.invalidateQueries({ queryKey: ["comparacao-plataformas"] });
    },
  });
}

// Conectar plataforma = redirect de página inteira (fluxo OAuth), não é fetch.
// Hoje só o Spotify tem OAuth implementado no backend (backend/src/routes/authRoutes.js),
// mas a função é genérica: quando /auth/youtube_music (ou apple_music/deezer)
// existir no Node, basta marcar a plataforma como `ativa` no catálogo.
export function iniciarConexaoOAuth(chave: string, usuarioId: string) {
  window.location.href = `${API_URL}/auth/${chave}?usuario_id=${encodeURIComponent(usuarioId)}`;
}

export function iniciarConexaoSpotify(usuarioId: string) {
  iniciarConexaoOAuth("spotify", usuarioId);
}

// ----------------------------------------------------------------------------
// Sincronização e saúde do backend
// ----------------------------------------------------------------------------

export type Saude = { status: string; hora: string };

/** Checa se o backend Node está no ar (GET /api/saude, sem autenticação). */
export function useSaudeBackend() {
  return useQuery({
    queryKey: ["saude"],
    queryFn: () => api.get<Saude>("/api/saude"),
    retry: false,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export type ResultadoSync = {
  sucesso: boolean;
  faixas_novas: number;
  conquistas_desbloqueadas: { chave: string; titulo: string }[];
};

/** POST /api/sync/:plataforma — puxa as reproduções recentes da plataforma. */
export function useSincronizarPlataforma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chave: string) => api.post<ResultadoSync>(`/api/sync/${chave}`),
    onSuccess: () => {
      for (const key of [
        "resumo",
        "recentes",
        "top-artistas",
        "historico-mensal",
        "comparacao-plataformas",
        "conquistas",
        "metas-progresso",
        "tocando-agora",
      ]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

// ----------------------------------------------------------------------------
// [NOVO] Perfil, gêneros, horários, importação de JSON e amigos
// ----------------------------------------------------------------------------

export type Perfil = {
  id: string;
  email: string | null;
  nome_exibicao: string;
  avatar_url: string | null;
  banner_url: string | null;
  membro_desde: string | null;
  resumo: Resumo;
  total_conquistas: number;
  total_plataformas: number;
};

export type ConquistaCatalogo = {
  chave: string;
  titulo: string;
  descricao: string;
  raridade?: string;
};

export type GeneroStat = {
  genero: string;
  total_faixas: number;
  total_minutos: number;
  percentual: number;
};

export type HoraStat = {
  hora: number;
  rotulo: string;
  total_faixas: number;
  total_minutos: number;
};

export type Amizade = {
  id: string;
  status: "pendente" | "aceita";
  criado_em: string;
  eu_enviei: boolean;
  amigo_id: string;
  amigo_nome: string;
  amigo_avatar_url: string | null;
};

export type LadoComparacao = {
  id: string;
  nome: string;
  avatar_url: string | null;
  total_faixas: number;
  total_minutos: number;
  artistas_unicos: number;
  ultima_reproducao: string | null;
  top_artistas: { nome: string; total: number }[];
  top_generos: { nome: string; total: number }[];
};

export type Comparacao = {
  compatibilidade: number;
  artistas_em_comum: { nome: string; minhas_reproducoes: number; reproducoes_amigo: number }[];
  total_artistas_em_comum: number;
  faixas_em_comum: number;
  generos: { genero: string; meu_total: number; total_amigo: number }[];
  eu: LadoComparacao;
  amigo: LadoComparacao;
};

export function usePerfil() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["perfil"],
    queryFn: () => api.get<Perfil>("/api/perfil"),
    enabled: !!user,
  });
}

export function useSalvarPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: {
      nome_exibicao?: string;
      avatar_url?: string;
      banner_url?: string;
    }) =>
      api.put<unknown>("/api/perfil", dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["perfil"] }),
  });
}

/** Catálogo completo de conquistas possíveis (para mostrar as bloqueadas). */
export function useCatalogoConquistas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["catalogo-conquistas"],
    queryFn: () => api.get<ConquistaCatalogo[]>("/api/perfil/catalogo-conquistas"),
    enabled: !!user,
    staleTime: 60 * 60_000,
  });
}

export function useGeneros(limite = 8) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["generos", limite],
    queryFn: () => api.get<GeneroStat[]>(`/api/stats/generos?limite=${limite}`),
    enabled: !!user,
  });
}

/** Reproduções por hora do dia. O fuso vem do próprio navegador. */
export function usePorHora() {
  const { user } = useAuth();
  const fuso = -(new Date().getTimezoneOffset() / 60);
  return useQuery({
    queryKey: ["por-hora", fuso],
    queryFn: () => api.get<HoraStat[]>(`/api/stats/por-hora?fuso=${fuso}`),
    enabled: !!user,
  });
}

export type ResultadoImportacao = {
  sucesso: boolean;
  faixas_novas: number;
  arquivos_ignorados?: number;
  conquistas_desbloqueadas: { chave: string; titulo: string }[];
};

/** Importa os JSONs do "Extended Streaming History" do Spotify. */
export function useImportarHistoricoSpotify() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (arquivos: File[]) =>
      api.upload<ResultadoImportacao>("/api/sync/historico-completo", arquivos),
    onSuccess: () => {
      for (const key of [
        "resumo",
        "recentes",
        "top-artistas",
        "historico-mensal",
        "comparacao-plataformas",
        "conquistas",
        "metas-progresso",
        "generos",
        "por-hora",
        "perfil",
      ]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export function useAmigos() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["amigos"],
    queryFn: () => api.get<Amizade[]>("/api/amigos"),
    enabled: !!user,
  });
}

export function useConvidarAmigo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => api.post<unknown>("/api/amigos", { email }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["amigos"] }),
  });
}

export function useAceitarAmigo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<unknown>(`/api/amigos/${id}/aceitar`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["amigos"] }),
  });
}

export function useRemoverAmigo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/amigos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["amigos"] }),
  });
}

export function useComparacaoAmigo(amigoId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["comparacao-amigo", amigoId],
    queryFn: () => api.get<Comparacao>(`/api/amigos/${amigoId}/comparacao`),
    enabled: !!user && !!amigoId,
  });
}
