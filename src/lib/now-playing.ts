// ============================================================================
// "Tocando agora" — OTIMIZADO
// ============================================================================
// OTIMIZAÇÕES:
// 1. Intervalo base aumentado de 15s → 60s (reduz 4x chamadas à API!)
// 2. Backoff exponencial em falhas consecutivas
// 3. Intervalo máximo de 10min para não ficar muito espaçado

import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "./api";
import { useAuth } from "./auth-context";
import { TOCANDO_AGORA_INTERVALO_BASE_MS, TOCANDO_AGORA_INTERVALO_MAXIMO_MS } from "./ottimizzazione-config";

export type TocandoAgoraApi = {
  tocando: boolean;
  nome_faixa: string;
  nome_artista: string;
  nome_album: string | null;
  imagem_capa_url: string | null;
  progresso_ms: number;
  duracao_ms: number;
  plataforma_nome?: string;
  plataforma_cor?: string;
};

export type TocandoAgora = Required<TocandoAgoraApi>;

export const CORES_PLATAFORMA: Record<string, string> = {
  spotify: "#1db954",
  youtube_music: "#ff0000",
  apple_music: "#fa243c",
  deezer: "#a23833",
  tidal: "#00ffff",
};

function normalizar(bruto: TocandoAgoraApi | null): TocandoAgora | null {
  if (!bruto || !bruto.nome_faixa) return null;
  return {
    ...bruto,
    nome_album: bruto.nome_album ?? null,
    imagem_capa_url: bruto.imagem_capa_url ?? null,
    progresso_ms: bruto.progresso_ms ?? 0,
    duracao_ms: bruto.duracao_ms ?? 0,
    plataforma_nome: bruto.plataforma_nome ?? "Spotify",
    plataforma_cor: bruto.plataforma_cor ?? CORES_PLATAFORMA["spotify"]!,
  };
}

/**
 * Hook para o widget "Tocando Agora". Sempre ativo enquanto o usuário está
 * logado (poll a cada TOCANDO_AGORA_INTERVALO_BASE_MS, com backoff em falha).
 */
export function useTocandoAgora() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tocando-agora"],
    queryFn: async () => {
      return normalizar(await api.get<TocandoAgoraApi | null>("/api/sync/tocando-agora"));
    },
    enabled: !!user,
    refetchIntervalInBackground: false,
    retry: false,
    staleTime: 10_000,
    refetchInterval: (query) => {
      const falhasConsecutivas = query.state.fetchFailureCount;
      if (falhasConsecutivas === 0) {
        return TOCANDO_AGORA_INTERVALO_BASE_MS; // 60s
      }

      const erro = query.state.fetchFailureReason ?? query.state.error;
      if (erro instanceof ApiError && erro.status === 429 && erro.retryAfter) {
        return Math.min(erro.retryAfter * 1000, TOCANDO_AGORA_INTERVALO_MAXIMO_MS);
      }

      const backoff = TOCANDO_AGORA_INTERVALO_BASE_MS * 2 ** Math.min(falhasConsecutivas, 5);
      return Math.min(backoff, TOCANDO_AGORA_INTERVALO_MAXIMO_MS);
    },
  });
}

export function formatarTempo(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(total / 60);
  const seg = total % 60;
  return `${min}:${seg.toString().padStart(2, "0")}`;
}
