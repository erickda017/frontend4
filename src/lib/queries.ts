// ============================================================================
// HOOKS DE QUERIES — OTIMIZADOS
// ============================================================================
// OTIMIZAÇÕES APLICADAS:
// 1. staleTime configurado para cada tipo de query (evita refetches desnecessários)
// 2. Queries de estatísticas com staleTime longo (5min) pois mudam só com sync
// 3. Interface de configuração centralizada em optimizacao-config.ts
// 4. Para queries que podem disparar em paralelo, configuração de gargalo

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, API_URL, ApiError } from "./api";
import { useAuth } from "./auth-context";
import {
  STATS_STALE_TIME_MS,
  RECENTES_STALE_TIME_MS,
  COMPARACAO_STALE_TIME_MS,
  METAS_STALE_TIME_MS,
  PROFIL_STALE_TIME_MS,
  CONQUISTAS_STALE_TIME_MS,
  PLATAFORMAS_STALE_TIME_MS,
  TOCANDO_AGORA_INTERVALO_BASE_MS,
  TOCANDO_AGORA_INTERVALO_MAXIMO_MS,
  EXCLUSAO_DURANTE_IMPORTACAO,
} from "./ottimizzazione-config";

// Tipos (mantidos iguais ao backend)
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
  imagem_url?: string | null;
};

export type HistoricoMensal = {
  mes: string;
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
  raridade?: string;
};

export type PlataformaPerfil = {
  id: number;
  chave: string;
  nome_exibicao: string;
  cor_tema: string | null;
  ativa: boolean;
  conectada: boolean;
  ultima_sincronizacao_em: string | null;
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

// Catálogo de conquistas (mantido no frontend para mostrar bloqueadas)
export const CATALOGO_CONQUISTAS = [
  { chave: "primeira_musica", titulo: "Primeiro Play", descricao: "Você conectou uma plataforma e sincronizou sua primeira música!", raridade: "comum" },
  { chave: "cem_faixas", titulo: "Maratonista Musical", descricao: "Você já ouviu 100 faixas registradas no Music Hub.", raridade: "comum" },
  { chave: "mil_faixas", titulo: "Mil e Uma Músicas", descricao: "Uau! 1.000 faixas no seu histórico.", raridade: "rara" },
  { chave: "dez_artistas", titulo: "Explorador Sonoro", descricao: "Você já ouviu pelo menos 10 artistas diferentes.", raridade: "comum" },
  { chave: "cem_horas", titulo: "Cem Horas de Som", descricao: "Mais de 6.000 minutos (100 horas) de música ouvida.", raridade: "epica" },
] as const;

export type PeriodoResumo = "total" | "semana" | "mes";

// ============================================================================
// OTIMIZAÇÃO 1: useResumo com staleTime longo (5min)
// ============================================================================
export function useResumo(periodo: PeriodoResumo = "total") {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["resumo", periodo],
    queryFn: () =>
      api.get<Resumo>(`/api/stats/resumo${periodo !== "total" ? `?periodo=${periodo}` : ""}`),
    enabled: !!user,
    staleTime: STATS_STALE_TIME_MS,
    // Não refetch em background enquanto o usuário não está interagindo
    refetchOnWindowFocus: false,
  });
}

// ============================================================================
// OTIMIZAÇÃO 2: useComparacaoPlataformas com staleTime longo
// ============================================================================
export function useComparacaoPlataformas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["comparacao-plataformas"],
    queryFn: () => api.get<ComparacaoPlataforma[]>("/api/stats/comparacao-plataformas"),
    enabled: !!user,
    staleTime: COMPARACAO_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}

// ============================================================================
// OTIMIZAÇÃO 3: useTopArtistas com staleTime longo
// ============================================================================
export function useTopArtistas(limite = 5) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["top-artistas", limite],
    queryFn: () => api.get<TopArtista[]>(`/api/stats/top-artistas?limite=${limite}`),
    enabled: !!user,
    staleTime: STATS_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}

// ============================================================================
// OTIMIZAÇÃO 4: useHistoricoMensal com staleTime longo
// ============================================================================
export function useHistoricoMensal(meses = 8) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["historico-mensal", meses],
    queryFn: () => api.get<HistoricoMensal[]>(`/api/stats/historico-mensal?meses=${meses}`),
    enabled: !!user,
    staleTime: STATS_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}

// ============================================================================
// OTIMIZAÇÃO 5: useFaixasRecentes com staleTime menor (1min)
// ============================================================================
export function useFaixasRecentes(limite = 8) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recentes", limite],
    queryFn: () => api.get<FaixaRecente[]>(`/api/stats/recentes?limite=${limite}`),
    enabled: !!user,
    staleTime: RECENTES_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}

// ============================================================================
// OTIMIZAÇÃO 6: useGeneros com staleTime longo
// ============================================================================
export function useGeneros(limite = 8) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["generos", limite],
    queryFn: () => api.get<GeneroStat[]>(`/api/stats/generos?limite=${limite}`),
    enabled: !!user,
    staleTime: STATS_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}

// ============================================================================
// OTIMIZAÇÃO 7: usePorHora com staleTime longo
// ============================================================================
export function usePorHora() {
  const { user } = useAuth();
  const fuso = -(new Date().getTimezoneOffset() / 60);
  return useQuery({
    queryKey: ["por-hora", fuso],
    queryFn: () => api.get<HoraStat[]>(`/api/stats/por-hora?fuso=${fuso}`),
    enabled: !!user,
    staleTime: STATS_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}

// ============================================================================
// OTIMIZAÇÃO 8: useMetasProgresso com staleTime intermediário
// ============================================================================
export function useMetasProgresso() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["metas-progresso"],
    queryFn: () => api.get<MetaProgresso[]>("/api/stats/metas"),
    enabled: !!user,
    staleTime: METAS_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}

export function useMetas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["metas"],
    queryFn: () => api.get<Meta[]>("/api/metas"),
    enabled: !!user,
    staleTime: METAS_STALE_TIME_MS,
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

// ============================================================================
// OTIMIZAÇÃO 9: usePerfilConquistas com staleTime longo
// ============================================================================
export function usePerfilConquistas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conquistas"],
    queryFn: () => api.get<ConquistaDesbloqueada[]>("/api/perfil/conquistas"),
    enabled: !!user,
    staleTime: CONQUISTAS_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}

export function usePerfilPlataformas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["perfil-plataformas"],
    queryFn: () => api.get<PlataformaPerfil[]>("/api/perfil/plataformas"),
    enabled: !!user,
    staleTime: PLATAFORMAS_STALE_TIME_MS,
    refetchOnWindowFocus: false,
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

export function iniciarConexaoOAuth(chave: string, usuarioId: string) {
  window.location.href = `${API_URL}/auth/${chave}?usuario_id=${encodeURIComponent(usuarioId)}`;
}

export function iniciarConexaoSpotify(usuarioId: string) {
  iniciarConexaoOAuth("spotify", usuarioId);
}

// ============================================================================
// Saúde do backend (mantida com refetch interval curto)
// ============================================================================
export type Saude = { status: string; hora: string };

export function useSaudeBackend() {
  return useQuery({
    queryKey: ["saude"],
    queryFn: () => api.get<Saude>("/api/saude"),
    retry: false,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

// ============================================================================
// Sincronização de plataforma (mutation)
// ============================================================================
export type ResultadoSync = {
  sucesso: boolean;
  faixas_novas: number;
  conquistas_desbloqueadas: { chave: string; titulo: string }[];
};

export function useSincronizarPlataforma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chave: string) => api.post<ResultadoSync>(`/api/sync/${chave}`),
    onSuccess: () => {
      // Invalidar somente as queries que mudam com sync
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
      ]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

// ============================================================================
// Tipos adicionais para perfil, comparação, etc.
// ============================================================================
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

export type FaixaComparada = {
  nome_faixa: string;
  nome_artista: string;
  imagem_url: string | null;
  minhas_reproducoes: number;
  reproducoes_amigo: number;
};

export type AlbumComparado = {
  nome_album: string;
  nome_artista: string;
  imagem_url: string | null;
  minhas_reproducoes: number;
  reproducoes_amigo: number;
};

export type LadoComparacao = {
  id: string;
  nome: string;
  avatar_url: string | null;
  banner_url: string | null;
  total_faixas: number;
  total_minutos: number;
  artistas_unicos: number;
  faixas_unicas: number;
  albuns_unicos: number;
  generos_unicos: number;
  dias_ativos: number;
  media_minutos_dia: number;
  hora_favorita: string | null;
  por_hora: number[];
  ultima_reproducao: string | null;
  top_artistas: { nome: string; total: number; imagem_url: string | null }[];
  top_generos: { nome: string; total: number }[];
  top_faixas: { nome_faixa: string; nome_artista: string; imagem_url: string | null; total: number }[];
  top_albuns: { nome_album: string; nome_artista: string; imagem_url: string | null; total: number }[];
};

export type Comparacao = {
  compatibilidade: number;
  compatibilidade_generos: number;
  artistas_em_comum: { nome: string; imagem_url: string | null; minhas_reproducoes: number; reproducoes_amigo: number }[];
  total_artistas_em_comum: number;
  faixas_em_comum: number;
  faixas_em_comum_detalhe: FaixaComparada[];
  albuns_em_comum: AlbumComparado[];
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
    staleTime: PROFIL_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}

export function useSalvarPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: { nome_exibicao?: string; avatar_url?: string; banner_url?: string }) =>
      api.put<unknown>("/api/perfil", dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["perfil"] }),
  });
}

export function useCatalogoConquistas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["catalogo-conquistas"],
    queryFn: () => api.get<ConquistaCatalogo[]>("/api/perfil/catalogo-conquistas"),
    enabled: !!user,
    staleTime: CONQUISTAS_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}

export type ResultadoImportacao = {
  sucesso: boolean;
  faixas_novas: number;
  arquivos_ignorados?: number;
  linhas_ignoradas?: number;
  conquistas_desbloqueadas: { chave: string; titulo: string }[];
};

export function useImportarHistoricoSpotify() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (arquivos: File[]) => api.upload<ResultadoImportacao>("/api/sync/historico-completo", arquivos),
    onSuccess: () => {
      // Invalidar todas as queries de estatísticas após importação
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

export function useImportarHistoricoYoutubeMusic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (arquivos: File[]) =>
      api.upload<ResultadoImportacao>("/api/sync/historico-completo-youtube-music", arquivos),
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
      ]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export function usePreencherCapasFaltantes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ sucesso: boolean; capas_atualizadas: number; faixas_unicas_sem_capa: number }>("/api/sync/preencher-capas"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perfil"] });
    },
  });
}

export function useApagarHistorico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<{ plays_apagadas: number; conquistas_apagadas: number }>("/api/sync/historico", { body: { confirmar: true } }),
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

export function useImportarBackupProprio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (arquivo: File) => api.uploadUnico<ResultadoImportacao>("/api/sync/importar-backup", arquivo),
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
      ]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export function useExportarHistorico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formato: "csv" | "json") => api.download(`/api/stats/exportar?formato=${formato}`, `historico.${formato}`),
    onSuccess: () => {
      // Não invalida nada — exportação é apenas download
    },
  });
}

export function useAmigos() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["amigos"],
    queryFn: () => api.get<Amizade[]>("/api/amigos"),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}

export function useConvidarAmigo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => api.post<Amizade>("/api/amigos", { email }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["amigos"] }),
  });
}

export function useAceitarAmigo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Amizade>(`/api/amigos/${id}/aceitar`),
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

export function useRankingAmigos(periodo?: "semana" | "mes" | "total") {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ranking-amigos", periodo],
    queryFn: () => api.get<{ nome: string; total_minutos: number; total_faixas: number; eu: boolean }[]>(`/api/amigos/ranking${periodo ? `?periodo=${periodo}` : ""}`),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}

export function useComparacaoComAmigo(amigoId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["comparacao-amigo", amigoId],
    queryFn: () => api.get<Comparacao>(`/api/amigos/${amigoId}/comparacao`),
    enabled: !!user && !!amigoId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// ============================================================================
// Wrapped (resumo anual tipo "Spotify Wrapped")
// ============================================================================
export type WrappedAlbum = {
  nome_album: string;
  nome_artista: string;
  imagem_url: string | null;
  total_plays: number;
};

export type WrappedFaixa = {
  nome_faixa: string;
  nome_artista: string;
  imagem_url: string | null;
  total_plays: number;
};

export type WrappedArtista = {
  nome: string;
  total_faixas: number;
  imagem_url: string | null;
};

export type WrappedGenero = {
  genero: string;
  total_faixas: number;
};

export type WrappedPorMes = {
  mes: string;
  total_faixas: number;
};

export type Wrapped = {
  ano: number;
  tem_dados: boolean;
  total_faixas: number;
  total_minutos: number;
  artistas_unicos: number;
  albuns_unicos: number;
  dias_ativos: number;
  total_minutos_ano_anterior: number | null;
  hora_favorita: string | null;
  dia_favorito: string | null;
  mes_favorito: string | null;
  media_minutos_dia: number;
  top_albuns: WrappedAlbum[];
  top_faixas: WrappedFaixa[];
  top_artistas: WrappedArtista[];
  top_generos: WrappedGenero[];
  por_mes: WrappedPorMes[];
};

export function useWrapped(ano: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wrapped", ano],
    queryFn: () => api.get<Wrapped>(`/api/stats/wrapped?ano=${ano}`),
    enabled: !!user,
    staleTime: STATS_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}
// ============================================================================
export type WrappedAlbum = {
  nome_album: string;
  nome_artista: string;
  imagem_url: string | null;
  total_plays: number;
};

export type WrappedFaixa = {
  nome_faixa: string;
  nome_artista: string;
  imagem_url: string | null;
  total_plays: number;
};

export type WrappedArtista = {
  nome: string;
  total_faixas: number;
  imagem_url: string | null;
};

export type WrappedGenero = {
  genero: string;
  total_faixas: number;
};

export type WrappedPorMes = {
  mes: string;
  total_faixas: number;
};

export type Wrapped = {
  ano: number;
  tem_dados: boolean;
  total_faixas: number;
  total_minutos: number;
  artistas_unicos: number;
  albuns_unicos: number;
  dias_ativos: number;
  total_minutos_ano_anterior: number | null;
  hora_favorita: string | null;
  dia_favorito: string | null;
  mes_favorito: string | null;
  media_minutos_dia: number;
  top_albuns: WrappedAlbum[];
  top_faixas: WrappedFaixa[];
  top_artistas: WrappedArtista[];
  top_generos: WrappedGenero[];
  por_mes: WrappedPorMes[];
};

export function useWrapped(ano: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wrapped", ano],
    queryFn: () => api.get<Wrapped>(`/api/stats/wrapped?ano=${ano}`),
    enabled: !!user,
    staleTime: STATS_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}
