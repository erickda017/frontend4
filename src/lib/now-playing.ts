import { useQuery } from "@tanstack/react-query";

import { api, ApiError } from "./api";
import { useAuth } from "./auth-context";

// ----------------------------------------------------------------------------
// "Tocando agora" — ligado ao backend real.
//
// Endpoint: GET /api/sync/tocando-agora  (backend/src/routes/syncRoutes.js)
// Resposta: null (nada tocando / plataforma não conectada) OU o objeto que o
// spotifyService.buscarTocandoAgora() devolve:
//   { tocando, nome_faixa, nome_artista, nome_album, imagem_capa_url,
//     progresso_ms, duracao_ms }
// Os campos de plataforma não vêm do backend hoje (só o Spotify tem OAuth),
// então são preenchidos aqui no front.
// ----------------------------------------------------------------------------

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
  deezer: "#a238ff",
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

const INTERVALO_BASE_MS = 15_000;
const INTERVALO_MAXIMO_MS = 10 * 60_000; // nunca espera mais que 10min entre tentativas

/**
 * Corrigido em 2026-08: o widget ficava perguntando "o que está tocando"
 * a cada 15s pra sempre, sem parar mesmo depois de um erro. Deixado aberto
 * a noite inteira (ex: música em repeat até de madrugada), isso soma
 * milhares de chamadas ao endpoint /me/player/currently-playing do Spotify
 * e estoura o rate limit da API (429) — e, como o polling continuava
 * batendo a cada 15s mesmo depois do 429, o bloqueio nunca tinha chance de
 * liberar (e o botão "Sincronizar" manual passava a falhar também, porque é
 * o mesmo token/rate limit).
 *
 * Agora: cada falha CONSECUTIVA dobra o intervalo até um teto de 10min, e se
 * o backend devolver um 429 com Retry-After, respeita esse tempo
 * explicitamente. Uma resposta bem-sucedida volta o intervalo pro normal
 * (15s) — por isso usamos `fetchFailureCount` (zera a cada sucesso) e não
 * `errorUpdateCount` (esse é cumulativo pra sempre e nunca reseta, o que
 * deixaria o polling lento pro resto da sessão depois de um único erro
 * pontual, mesmo já recuperado há horas).
 */
export function useTocandoAgora() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tocando-agora"],
    queryFn: async () =>
      normalizar(await api.get<TocandoAgoraApi | null>("/api/sync/tocando-agora")),
    enabled: !!user,
    refetchIntervalInBackground: false,
    retry: false,
    staleTime: 5_000,
    refetchInterval: (query) => {
      const falhasConsecutivas = query.state.fetchFailureCount;
      if (falhasConsecutivas === 0) return INTERVALO_BASE_MS;

      const erro = query.state.fetchFailureReason ?? query.state.error;
      if (erro instanceof ApiError && erro.status === 429 && erro.retryAfter) {
        return Math.min(erro.retryAfter * 1000, INTERVALO_MAXIMO_MS);
      }

      // Backoff exponencial pra qualquer outra falha (rede, 500, etc).
      const backoff = INTERVALO_BASE_MS * 2 ** Math.min(falhasConsecutivas, 5);
      return Math.min(backoff, INTERVALO_MAXIMO_MS);
    },
  });
}

export function formatarTempo(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(total / 60);
  const seg = total % 60;
  return `${min}:${seg.toString().padStart(2, "0")}`;
}
