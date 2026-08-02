# Integração Sonora ↔ Music Hub — v2 (Perfil, Amigos, Gêneros, Importação)

Este zip já veio de um projeto que evoluiu bastante desde a primeira
integração (você mesmo/Lovable adicionaram Perfil, Amigos, gêneros musicais,
horários e importação do histórico do Spotify — nos dois lados, front e
back). Minha parte agora foi **revisar tudo de novo do zero** (não confiar no
que eu tinha feito antes) e consertar o que ficou pra trás.

## O que eu encontrei

A integração já estava **quase 100% completa e correta**: `src/lib/api.ts`,
`auth-context.tsx`, `queries.ts` já tinham hooks certos para cada rota nova
do backend (`/api/perfil`, `/api/perfil/catalogo-conquistas`,
`/api/stats/generos`, `/api/stats/por-hora`, `/api/amigos/*`, upload de
histórico). As páginas `perfil.tsx`, `amigos.$amigoId.tsx`, `conquistas.tsx`,
`historico.tsx` e `plataformas.tsx` já consumiam tudo isso certinho.

**O único ponto solto:** o Painel (`src/routes/index.tsx`) continuava com os
dois gráficos ("Divisão por gênero" e "Quando você ouve") usando o
`demo-data.ts` antigo, mesmo o backend já tendo os endpoints reais
(`GET /api/stats/generos` e `GET /api/stats/por-hora`) — provavelmente porque
essa página não fez parte da rodada que adicionou gêneros/horários. **Corrigi
isso**: agora os dois usam `useGeneros()` e `usePorHora()` de verdade.

Fora esse ponto, não precisei mexer em mais nada — nem no front nem no
back — porque já estava tudo consistente (verifiquei linha a linha os
endpoints novos: `amigosRoutes.js`/`amigosService.js`,
`statsRoutes.js`/`obterPorHoraDoDia`/`obterPorGenero`,
`perfilRoutes.js`/`GET,PUT /api/perfil`/`catalogo-conquistas`, e o schema
`amizades` + coluna `genero` em `plays`).

## Novidades desde a v1 (resumo)

| Área | O que tem agora |
|---|---|
| Backend | Rota `/api/amigos` (convite, aceitar, remover, comparação de gosto musical) |
| Backend | `/api/stats/generos` e `/api/stats/por-hora` — classificação automática de gênero (`generoService.js`) e agrupamento por hora |
| Backend | `/api/perfil` (GET/PUT) — nome de exibição, avatar, resumo | `/api/perfil/catalogo-conquistas` — lista completa das 33 conquistas possíveis, com raridade |
| Backend | `/api/sync/historico-completo` — importação em lote do "Extended Streaming History" do Spotify (multer, até 40 arquivos / 60MB cada) |
| Backend | Conquistas ganharam campo `raridade` (comum/rara/épica/lendária) e muito mais regras (horário, sequência de dias, amigos, etc.) |
| Frontend | Página `/perfil` nova: editar nome, importar histórico, gêneros, horários, lista de amigos |
| Frontend | Página `/amigos/$amigoId` nova: comparação de compatibilidade musical |
| Frontend | Banner de "backend offline" no `AppShell` (`useSaudeBackend`, `GET /api/saude`) |

## Ainda vale mencionar (herdado da v1)

- `frontend/supabase/schema.sql` continua sendo o scaffold antigo do Lovable
  Cloud (tabelas `profiles`, `connections`...) e **não tem nada a ver** com o
  schema real, que é `backend/supabase/schema.sql`. Pode apagar.
- O backend não tem mais o `.env` com valores reais dentro do zip desta vez
  (só `.env.example`) — o que é mais seguro. Preencha localmente com os
  mesmos valores de antes (Supabase URL/anon key/service role, credenciais
  do Spotify).

## Como rodar local

```bash
cd backend
npm install
cp .env.example .env   # preencha com seus valores reais
npm run dev             # http://localhost:3000
```

```bash
cd frontend
npm install
cp .env.example .env
# preencha VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (iguais ao backend)
# e VITE_API_URL=http://localhost:3000
npm run dev              # http://localhost:5173
```

Nada mudou em portas/CORS desde a v1 — continua tudo compatível.
