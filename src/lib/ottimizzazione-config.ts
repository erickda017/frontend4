// ============================================================================
// CONFIGURAÇÕES DE OTIMIZAÇÃO DO FRONTEND
// ============================================================================
// Estas constantes controlam o comportamento de cache e polling do frontend.
// São exportadas para que possam ser ajustadas via environment variables
// ou para fins de debug.

// ⭐ OTIMIZAÇÃO 1: staleTime para queries de estatísticas
// Dados de estatísticas (resumo, top artistas, etc.) mudam apenas quando
// uma sincronização ocorre. Como o auto-sync agora roda a cada 60min,
// podemos cachear esses dados por 5 minutos sem risco de estaleção.
//
// Isso evita que o frontend dispare múltiplas queries de leitura completa
// da tabelaa "plays" quando o usuário navega entre páginas ou quando
// multiple components usam a mesma query.
//
// Para dados que mudam com frequência (ex: "tocando agora"), usamos
// staleTime menor.

export const STATS_STALE_TIME_MS = 5 * 60 * 1000; // 5 minutos — dados de estatísticas
export const RECENTES_STALE_TIME_MS = 1 * 60 * 1000; // 1 minuto — faixas recentes
export const COMPARACAO_STALE_TIME_MS = 5 * 60 * 1000; // 5 minutos — comparação plataformas
export const METAS_STALE_TIME_MS = 1 * 60 * 1000; // 1 minuto — progresso de metas (pode mudar com sync)

// ⭐ OTIMIZAÇÃO 2: Intervalo de polling para "tocando agora"
// Aumentado de 15s para 60s para reduzir chamadas à API do Spotify.
// O widget "tocando agora" é only útil quando está visível na tela —
// se o usuário não está olhando, não precisa pollar.

export const TOCANDO_AGORA_INTERVALO_BASE_MS = 60_000; // 60 segundos (otimizado)
export const TOCANDO_AGORA_INTERVALO_MAXIMO_MS = 10 * 60_000; // nunca mais que 10min

// ⭐ OTIMIZAÇÃO 3: staleTime para queries que dependem de sincronização
// Como o auto-sync roda a cada 60min, dados derivados da sincronização
// (conquistas, perfil, plataformas) podem ser cacheados por até 5min.

export const PROFIL_STALE_TIME_MS = 5 * 60 * 1000; // 5 minutos
export const CONQUISTAS_STALE_TIME_MS = 5 * 60 * 1000; // 5 minutos
export const PLATAFORMAS_STALE_TIME_MS = 5 * 60 * 1000; // 5 minutos

// ⭐ OTIMIZAÇÃO 4: gargalo de concorrência para importações
// Durante uma importação de histórico, evita que outras queries de
// estatísticas sejam disparadas simultaneamente (pois a tabelaa está
// sendo modificada). Isso reduz load no banco durante importações.

export const EXCLUSAO_DURANTE_IMPORTACAO = true;
