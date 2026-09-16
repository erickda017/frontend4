// ============================================================================
// CONFIGURAÇÕES DE OTIMIZAÇÃO DO FRONTEND
// ============================================================================
// Estas constantes controlam o comportamento de cache e polling do frontend.
// São exportadas para que possam ser ajustadas via environment variables
// ou para fins de debug.

// ⭐ OTIMIZAÇÃO 1: staleTime longo para dados já baixados
// Dados de estatísticas (resumo, top artistas, histórico, metas,
// comparações etc.) raramente mudam por ação direta do usuário no site — e
// toda mutation que muda isso via uma ação NO SITE (importar histórico,
// apagar histórico...) já chama queryClient.invalidateQueries() na chave
// certa (ver queries.ts). MAS boa parte do que afeta esses números acontece
// em segundo plano, fora de qualquer mutation do frontend: o app Android
// "Sonora Listener" grava plays direto no banco a qualquer hora, e o
// scheduler do backend sincroniza o Spotify periodicamente sozinho — nada
// disso passa por uma mutation daqui pra invalidar o cache.
//
// Por isso o staleTime NÃO pode ser Infinity (como estava antes): sem uma
// expiração de verdade, esses caches persistidos em localStorage (ver
// src/lib/query-persister.ts) ficavam congelados indefinidamente sempre que
// a atualização vinha de fora do site - o sintoma era o "tempo ouvido" da
// tela principal parecer "travado" enquanto o histórico real já tinha
// crescido. Um staleTime de alguns minutos garante que, ao reabrir/recarregar
// a página, o dado se autocorrige sozinho sem precisar ficar chamando a API
// toda hora enquanto a aba está aberta.

export const STATS_STALE_TIME_MS = 5 * 60 * 1000; // resumo, top artistas, histórico mensal etc.
export const RECENTES_STALE_TIME_MS = 3 * 60 * 1000; // faixas recentes (é o que mais muda em segundo plano)
export const COMPARACAO_STALE_TIME_MS = 5 * 60 * 1000; // comparação entre plataformas
export const METAS_STALE_TIME_MS = 5 * 60 * 1000; // metas e progresso

// ⭐ OTIMIZAÇÃO 2: Intervalo de polling para "tocando agora"
// Aumentado de 15s para 60s para reduzir chamadas à API do Spotify.
// O widget "tocando agora" é only útil quando está visível na tela —
// se o usuário não está olhando, não precisa pollar.

export const TOCANDO_AGORA_INTERVALO_BASE_MS = 60_000; // 60 segundos (otimizado)
export const TOCANDO_AGORA_INTERVALO_MAXIMO_MS = 10 * 60_000; // nunca mais que 10min

// ⭐ OTIMIZAÇÃO 3: idem ao bloco 1 acima. "Perfil" (total de conquistas) e
// "conquistas" sofrem do MESMO problema: uma conquista pode ser desbloqueada
// em segundo plano (o app Android roda achievementsService.verificarConquistas
// a cada evento "playing", ver syncRoutes.js) sem passar por nenhuma mutation
// do frontend - por isso também precisam de staleTime finito, não Infinity.
// "Plataformas conectadas" é diferente: só muda quando o próprio usuário
// conecta/desconecta algo AQUI no site, uma mutation que já invalida a query
// certa - continua Infinity de propósito.

export const PROFIL_STALE_TIME_MS = 5 * 60 * 1000;
export const CONQUISTAS_STALE_TIME_MS = 5 * 60 * 1000;
export const PLATAFORMAS_STALE_TIME_MS = Infinity;

// ⭐ OTIMIZAÇÃO 4: gargalo de concorrência para importações
// Durante uma importação de histórico, evita que outras queries de
// estatísticas sejam disparadas simultaneamente (pois a tabelaa está
// sendo modificada). Isso reduz load no banco durante importações.

export const EXCLUSAO_DURANTE_IMPORTACAO = true;
