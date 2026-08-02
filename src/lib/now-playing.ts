import { useQuery } from "@tanstack/react-query";

import { api } from "./api";
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
    plataforma_cor: bruto.plataforma_cor ?? CORES_PLATAFORMA['spotify']!,
  };
}

export function useTocandoAgora() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tocando-agora"],
    queryFn: async () =>
      normalizar(await api.get<TocandoAgoraApi | null>("/api/sync/tocando-agora")),
    enabled: !!user,
    // Playback muda a todo momento: atualiza sozinho.
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: false,
    staleTime: 5_000,
  });
}

export function formatarTempo(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(total / 60);
  const seg = total % 60;
  return `${min}:${seg.toString().padStart(2, "0")}`;
}
