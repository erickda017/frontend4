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
        gcTime: 7 * 24 * 60 * 60 * 1000, // 7 dias
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
