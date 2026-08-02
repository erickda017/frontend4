# Sonora

Agregador de histórico musical: unifica Spotify, YouTube Music, Apple Music, Deezer e Tidal em um único painel, com "Tocando agora", Cápsula Sonora, metas, conquistas e comparativo entre plataformas.

## Estrutura do projeto

```
.
├── backend/            # API Node/Express + PostgreSQL (o mesmo do zip original)
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/     # auth, sync, stats, metas, perfil
│   │   └── services/   # integrações (spotifyService.js, ...)
│   └── package.json
├── src/                # frontend React (TanStack Start + Vite + Tailwind)
│   ├── components/     # AppShell, SonicHero, States, ChartFrame...
│   ├── lib/            # api.ts, queries.ts, now-playing.ts, auth-context.tsx
│   └── routes/         # /, /historico, /plataformas, /metas, /conquistas
└── README.md
```

> O frontend fica na raiz (exigência do ambiente Lovable) e o backend em `backend/`. Se você preferir a estrutura literal do zip, basta mover `src/`, `public/`, `index.html`, `vite.config.ts` e `package.json` para uma pasta `frontend/` depois de clonar — nenhum import usa caminho relativo para fora de `src/`.

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env    # se existir; senão crie o .env com as chaves abaixo
npm run dev             # http://localhost:3000
```

`.env` do backend:

```env
PORT=3000
DATABASE_URL=postgresql://usuario:senha@localhost:5432/sonora
JWT_SECRET=uma-string-longa-e-aleatoria
FRONTEND_URL=http://localhost:8080

# Spotify (já configurado)
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
```

## 2. Frontend

```bash
npm install
npm run dev             # http://localhost:8080
```

`.env` do frontend (raiz):

```env
VITE_API_URL=http://localhost:3000
```

Se a API estiver fora do ar, aparece um aviso no topo do app com a URL configurada.

## 3. Como conectar cada plataforma

O fluxo é sempre o mesmo:

1. O usuário clica em **Conectar** na página `/plataformas`.
2. O frontend redireciona para `GET {VITE_API_URL}/api/auth/{plataforma}/connect?usuario_id=...`.
3. O backend leva ao consentimento do provedor.
4. O provedor volta para o *redirect URI* do backend, que salva os tokens e redireciona para
   `{FRONTEND_URL}/plataformas?conectado={plataforma}` (ou `?erro=...`).

Ou seja: para habilitar uma nova plataforma basta criar as credenciais no provedor, colocá-las no `.env` do backend e implementar `connect`/`callback` em `backend/src/routes/authRoutes.js`. O frontend não precisa de nenhuma mudança.

### Spotify — já configurado ✅
- Painel: <https://developer.spotify.com/dashboard>
- Redirect URI: `http://localhost:3000/api/auth/spotify/callback`
- Escopos: `user-read-recently-played user-read-currently-playing user-top-read`

### YouTube Music (via Google)
- Console: <https://console.cloud.google.com/apis/credentials> → OAuth Client ID (Web)
- Ative a **YouTube Data API v3**
- Redirect URI: `http://localhost:3000/api/auth/youtube_music/callback`
- Escopo: `https://www.googleapis.com/auth/youtube.readonly`
- `.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

### Apple Music
- Requer conta paga no Apple Developer: <https://developer.apple.com/account>
- Crie uma **MusicKit identifier** e uma chave privada `.p8`
- Não é OAuth clássico: o backend gera um *developer token* (JWT ES256) e o navegador obtém o *music user token* via MusicKit JS
- `.env`: `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`

### Deezer
- Painel: <https://developers.deezer.com/myapps>
- Redirect URI: `http://localhost:3000/api/auth/deezer/callback`
- Permissões: `basic_access, listening_history`
- `.env`: `DEEZER_APP_ID`, `DEEZER_SECRET`

### Tidal
- Painel: <https://developer.tidal.com/dashboard>
- Redirect URI: `http://localhost:3000/api/auth/tidal/callback`
- OAuth 2.0 com PKCE
- `.env`: `TIDAL_CLIENT_ID`, `TIDAL_CLIENT_SECRET`

## 4. Endpoints usados pelo frontend

| Uso | Endpoint |
| --- | --- |
| Saúde da API | `GET /api/health` |
| Login / cadastro | `POST /api/auth/login`, `POST /api/auth/registrar` |
| Tocando agora | `GET /api/sync/tocando-agora` |
| Sincronizar plataforma | `POST /api/sync/{plataforma}` |
| Histórico | `GET /api/stats/recentes?limite=200` |
| Resumo / gráficos | `GET /api/stats/resumo`, `/api/stats/por-dia`, `/api/stats/comparacao` |
| Metas | `GET/POST/PATCH /api/metas` |
| Conquistas | `GET /api/perfil/conquistas` |
| Plataformas | `GET /api/perfil/plataformas`, `DELETE /api/perfil/plataformas/{chave}` |

Todos exigem `Authorization: Bearer {token}`, exceto health e auth.

## 5. Publicando no GitHub

```bash
git init
git add .
git commit -m "Sonora: frontend + backend"
git remote add origin git@github.com:usuario/sonora.git
git push -u origin main
```

Lembre de manter `.env`, `.env.local` e `node_modules/` no `.gitignore` — nenhuma credencial deve ir para o repositório.
