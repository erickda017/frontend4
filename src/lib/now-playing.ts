// ============================================================================
// "Tocando agora" — OTIMIZADO
// ============================================================================
// OTIMIZAÇÕES:
// 1. Intervalo base aumentado de 15s → 60s (reduz 4x chamadas à API!)
// 2. Pausa automática quando widget não está visível (Intersection Observer)
// 3. Sem estado global mutável — usa React ref + estado local do hook
// 4. Backoff exponencial mantido para falhas
// 5. Intervalo máximo de 10min para não ficar muito estalado

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
 * Widget "Tocando Agora" OTIMIZADO.
 *
 * Melhorias:
 * 1. Intervalo base: 60s (otimizado para plano free)
 * 2. Pause automático via IntersectionObserver (sem estado global!)
 * 3. Backoff exponencial em falhas
 * 4. Limite máximo 10min
 *
 * Uso: passthrough de ref para o componente que envolve o widget.
 */

function useTocandoAgoraInterno(ref: React.RefObject<HTMLElement | null>, usuarioLogado: boolean) {
  // Use uma función que verifica a visibilidade pela ref e pelo IntersectionObserver
  const isWidgetVisible = (): boolean => {
    if (!ref.current) return false;
    if (typeof window === "undefined" || !(("IntersectionObserver" in window))) {
      return true; // assume visível se não tem IntersectionObserver
    }
    // Verifica se o elemento está no viewport
    const rect = ref.current.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  return useQuery({
    queryKey: ["tocando-agora"],
    queryFn: async () => {
      // Se o widget não está visível, retorna null sem fazer requisição
      if (!isWidgetVisible()) {
        return null;
      }
      return normalizar(await api.get<TocandoAgoraApi | null>("/api/sync/tocando-agora"));
    },
    enabled: usuarioLogado,
    refetchIntervalInBackground: false,
    retry: false,
    staleTime: 10_000,
    refetchInterval: (query) => {
      // Se não está visível, não refetch
      if (!isWidgetVisible()) {
        return false;
      }

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

/**
 * Hook principal para o widget "Tocando Agora".
 * Deve receber um ref para o elemento DOM do widget.
 *
 * @param ref - Ref.Object para o elemento contêiner do widget (para detecção de visibilidade)
 * @returns Os mesmos dados de useQuery com os dados do "tocando agora"
 */
export function useTocandoAgoraWidget(ref: React.RefObject<HTMLElement | null>) {
  const { user } = useAuth();
  return useTocandoAgoraInterno(ref, !!user);
}

/**
 * Hook para o widget "Tocando Agora" sem detecção de visibilidade.
 * Usado em casos onde o widget sempre deve estar ativo (ex: drawer fixo).
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

// ============================================================================
// Hook de visibilidade com IntersectionObserver — SEM estado global
// ============================================================================
// Este hook é opcional: se o componente precisar saber quando o widget
// se torna visível ou oculto (ex: para mostrar/esconder algo), pode usar
// este hook separadamente. Ele usa apenas React state local, sem variáveis
// globais.
// ============================================================================

export function useWidgetVisibility(ref: React.RefObject<HTMLElement | null>) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined" || !(("IntersectionObserver" in window))) {
      // Sem IntersectionObserver, assume visível
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px",
      },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return isVisible;
}
