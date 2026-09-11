import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

// ============================================================================
// CACHE PERSISTENTE (localStorage)
// ============================================================================
// Sem isso, cada vez que a página recarrega (F5, fechar/abrir aba, etc) o
// QueryClient nasce vazio e TODA query dispara de novo, não importa o
// staleTime configurado — staleTime só evita refetch de algo que JÁ está em
// cache, não evita a primeira busca depois de um cache vazio. Persistindo em
// localStorage, o cache sobrevive ao reload: histórico, metas, comparações
// etc. aparecem instantaneamente (sem chamar a API/banco de novo) até que
// uma ação explícita do usuário (sincronizar, importar, salvar perfil...)
// invalide a query certa — o que as mutations em queries.ts já fazem.
export const queryPersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "sonora:query-cache",
});

// Dados "ao vivo" (tocando agora, saúde do backend) NUNCA devem ser
// restaurados do localStorage — precisam refletir o estado real no momento
// em que a página abre, não o que foi salvo na última visita.
const CHAVES_NAO_PERSISTIDAS = new Set(["tocando-agora", "saude"]);

export function devePersistirQuery(queryKey: readonly unknown[]): boolean {
  const chave = queryKey[0];
  return typeof chave !== "string" || !CHAVES_NAO_PERSISTIDAS.has(chave);
}

// Bump quando uma mudança no formato das respostas da API tornar o cache
// salvo incompatível (evita que dados persistidos antigos quebrem a tela) —
// qualquer valor persistido com um "buster" diferente do atual é descartado.
export const QUERY_CACHE_BUSTER = "v1";

// Quanto tempo um cache persistido continua válido sem visitar o site
// (depois disso, é descartado e a primeira busca acontece normalmente).
export const QUERY_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
