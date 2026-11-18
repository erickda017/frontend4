import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

// ============================================================================
// CACHE PERSISTENTE (localStorage)
// ============================================================================
// Persistir o cache do React Query faz o app abrir já com dados na tela (sem
// esperar a API) — mas localStorage é pequeno (~5MB) e SÍNCRONO. Dois
// problemas reais que isso causava:
//   1. O perfil e a lista de amigos carregam avatar/banner como data URL
//      base64 (até ~4MB por imagem). Isso estourava a cota: o setItem
//      lançava QuotaExceededError e o cache inteiro parava de ser salvo (e,
//      pior, cada tentativa travava a thread principal serializando MBs).
//   2. A tela de Histórico guardava dezenas de milhares de linhas.
// Soluções: (a) NUNCA persistir chaves pesadas (ver CHAVES_NAO_PERSISTIDAS);
// (b) storage "seguro": ignora erro de cota e recusa gravar blobs enormes.
// ============================================================================

const LIMITE_BYTES_PERSISTIDOS = 1_500_000; // ~1,5MB de JSON

const storageSeguro = {
  getItem: (chave: string) => {
    try {
      return window.localStorage.getItem(chave);
    } catch {
      return null;
    }
  },
  setItem: (chave: string, valor: string) => {
    if (valor.length > LIMITE_BYTES_PERSISTIDOS) {
      // Cache grande demais: melhor não persistir nada do que travar o
      // navegador (o app só abre sem "dados instantâneos" nessa visita).
      try {
        window.localStorage.removeItem(chave);
      } catch {
        /* ignora */
      }
      return;
    }
    try {
      window.localStorage.setItem(chave, valor);
    } catch {
      // QuotaExceededError / modo privado: segue sem persistir.
    }
  },
  removeItem: (chave: string) => {
    try {
      window.localStorage.removeItem(chave);
    } catch {
      /* ignora */
    }
  },
};

export const queryPersister = createSyncStoragePersister({
  storage: storageSeguro,
  key: "sonora:query-cache",
  // Agrupa várias atualizações num único setItem (padrão era 1s; 2s reduz
  // ainda mais o custo de serializar durante navegação intensa).
  throttleTime: 2000,
});

// Dados "ao vivo" ou PESADOS que nunca devem ir pro localStorage:
//  - tocando-agora / saude: precisam refletir o estado real ao abrir
//  - perfil / amigos / ranking-amigos / comparacao-amigo: carregam avatar e
//    banner em base64 (MBs)
//  - historico / recap-previa: listas grandes ou links temporários
const CHAVES_NAO_PERSISTIDAS = new Set([
  "tocando-agora",
  "saude",
  "perfil",
  "amigos",
  "ranking-amigos",
  "comparacao-amigo",
  "historico",
  "recap-previa",
]);

export function devePersistirQuery(queryKey: readonly unknown[]): boolean {
  const chave = queryKey[0];
  return typeof chave !== "string" || !CHAVES_NAO_PERSISTIDAS.has(chave);
}

// Bump quando o formato das respostas mudar ou um bug tiver deixado dados
// ruins salvos. v3: gêneros corrigidos (antes um 500 podia ficar salvo) e
// novas chaves de recap.
export const QUERY_CACHE_BUSTER = "v3";

// Quanto tempo um cache persistido continua válido sem visitar o site.
export const QUERY_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 dia
