import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // gcTime longo: sem isso, uma query sem nenhum componente montado por
        // 5min (o padrão) é descartada da memória mesmo com o cache
        // persistido em localStorage (ver src/lib/query-persister.ts) - ao
        // remontar, apareceria vazia até o refetch terminar, em vez de vir
        // instantaneamente do que já foi restaurado.
        gcTime: 24 * 60 * 60 * 1000, // 1 dia (igual ao maxAge do cache persistido)
        // Padrões globais (cada hook ainda pode sobrescrever):
        // - staleTime 60s: navegar entre telas não refaz chamadas recém-feitas
        // - sem refetch ao voltar o foco da janela: o backend já sincroniza
        //   sozinho e as mutations invalidam o que muda
        // - 1 retry: uma falha de rede passageira não vira tela de erro, mas
        //   também não fica insistindo 3x num servidor lento/dormindo
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
