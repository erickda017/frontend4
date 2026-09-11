// ============================================================================
// CONFIGURAÇÕES DE OTIMIZAÇÃO DO FRONTEND
// ============================================================================
// Estas constantes controlam o comportamento de cache e polling do frontend.
// São exportadas para que possam ser ajustadas via environment variables
// ou para fins de debug.

// ⭐ OTIMIZAÇÃO 1: staleTime "infinito" para dados já baixados
// Dados de estatísticas (resumo, top artistas, histórico, metas,
// comparações etc.) só mudam quando uma sincronização/importação/ação do
// usuário realmente acontece — e toda mutation que muda esses dados já
// chama queryClient.invalidateQueries() na chave certa (ver queries.ts).
// Então, uma vez "baixados", não há motivo pra rebuscar sozinho: nem em
// background, nem ao voltar pra aba, nem ao remontar um componente. Isso,
// combinado com o cache persistido em localStorage (ver
// src/lib/query-persister.ts), significa que a API/banco só são chamados de
// novo quando uma ação explícita do usuário invalida o dado — nunca "por
// via das dúvidas".
//
// Dados que precisam refletir o momento AGORA (o widget "tocando agora", a
// checagem de saúde do backend) ficam de fora de propósito, com seu próprio
// staleTime/refetchInterval curto (ver now-playing.ts e useSaudeBackend).

export const STATS_STALE_TIME_MS = Infinity; // resumo, top artistas, histórico mensal etc.
export const RECENTES_STALE_TIME_MS = Infinity; // faixas recentes
export const COMPARACAO_STALE_TIME_MS = Infinity; // comparação entre plataformas
export const METAS_STALE_TIME_MS = Infinity; // metas e progresso

// ⭐ OTIMIZAÇÃO 2: Intervalo de polling para "tocando agora"
// Aumentado de 15s para 60s para reduzir chamadas à API do Spotify.
// O widget "tocando agora" é only útil quando está visível na tela —
// se o usuário não está olhando, não precisa pollar.

export const TOCANDO_AGORA_INTERVALO_BASE_MS = 60_000; // 60 segundos (otimizado)
export const TOCANDO_AGORA_INTERVALO_MAXIMO_MS = 10 * 60_000; // nunca mais que 10min

// ⭐ OTIMIZAÇÃO 3: idem acima, pra dados derivados de sincronização
// (conquistas, perfil, plataformas conectadas) - só mudam via mutation, que
// já invalida a query certa.

export const PROFIL_STALE_TIME_MS = Infinity;
export const CONQUISTAS_STALE_TIME_MS = Infinity;
export const PLATAFORMAS_STALE_TIME_MS = Infinity;

// ⭐ OTIMIZAÇÃO 4: gargalo de concorrência para importações
// Durante uma importação de histórico, evita que outras queries de
// estatísticas sejam disparadas simultaneamente (pois a tabelaa está
// sendo modificada). Isso reduz load no banco durante importações.

export const EXCLUSAO_DURANTE_IMPORTACAO = true;
