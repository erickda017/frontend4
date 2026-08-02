# Sonora — guia completo de deploy (Git → Supabase → Render)

Feito para quem nunca publicou um projeto. Siga na ordem, sem pular passos.

---

## Parte 0 — O que você vai precisar

- Conta no **GitHub** (grátis) — https://github.com
- Conta no **Supabase** (grátis) — https://supabase.com
- Conta no **Render** (grátis) — https://render.com
- **Node.js 20+** instalado no computador (só se quiser rodar local) — https://nodejs.org

---

## Parte 1 — Colocar o código no GitHub

### Opção A (mais fácil): usar o botão do Lovable
1. No editor do Lovable, clique no **+** (canto inferior esquerdo do chat) → **GitHub** → **Connect project**.
2. Autorize o app do Lovable no GitHub.
3. Escolha a conta/organização e clique em **Create Repository**.
4. Pronto: o repositório já existe e sincroniza nos dois sentidos.

### Opção B: manualmente pelo terminal
1. Baixe o código (Code Editor → **Download codebase**) e descompacte.
2. No GitHub, clique em **New repository**, nome `sonora`, deixe **Public** ou **Private**, e **NÃO** marque "Add README". Clique em **Create repository**.
3. No terminal, dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/sonora.git
git push -u origin main
```

Se pedir senha, use um **Personal Access Token** (GitHub → Settings → Developer settings → Tokens).

---

## Parte 2 — Criar o banco no Supabase

1. Acesse https://supabase.com → **New project**.
2. Preencha:
   - **Name**: `sonora`
   - **Database password**: crie uma senha forte e **guarde** (você vai precisar).
   - **Region**: escolha a mais perto (ex.: `South America (São Paulo)`).
3. Espere ~2 minutos até o projeto ficar verde.
4. No menu lateral, abra **SQL Editor** → **New query**.
5. Abra o arquivo `supabase/schema.sql` deste projeto, copie **tudo**, cole no editor e clique em **Run**.
   - Ele cria as tabelas: `profiles`, `connections`, `plays`, `goals`, `achievements`, `user_achievements`, com segurança (RLS) já ativada.
6. Vá em **Project Settings → API** e anote:
   - **Project URL** → ex.: `https://abcdefgh.supabase.co`
   - **anon public key** (pode ficar no frontend)
   - **service_role key** (SECRETA — nunca no frontend)

---

## Parte 3 — Variáveis de ambiente

Crie um arquivo `.env` **local** (ele já está no `.gitignore`, não vai para o Git):

```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-anon-key
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_PUBLISHABLE_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

Rodar localmente:

```bash
npm install
npm run dev
```

Abra http://localhost:8080

---

## Parte 4 — Publicar no Render

1. Acesse https://render.com → **New +** → **Web Service**.
2. Clique em **Connect GitHub**, autorize e escolha o repositório `sonora`.
3. Configure exatamente assim:

| Campo | Valor |
|---|---|
| **Name** | `sonora` |
| **Region** | Ohio ou a mais próxima |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node .output/server/index.mjs` |
| **Instance Type** | `Free` |

4. Clique em **Advanced → Add Environment Variable** e adicione, uma por uma:

```
NODE_VERSION            = 20
NITRO_PRESET            = node-server
PORT                    = 10000
VITE_SUPABASE_URL       = https://abcdefgh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY = sua-anon-key
SUPABASE_URL            = https://abcdefgh.supabase.co
SUPABASE_PUBLISHABLE_KEY = sua-anon-key
SUPABASE_SERVICE_ROLE_KEY = sua-service-role-key
```

> `NITRO_PRESET=node-server` é o que faz o build gerar um servidor Node
> (`.output/server/index.mjs`) que o Render consegue iniciar.

5. Clique em **Create Web Service**. O primeiro deploy leva 3–6 minutos.
6. Quando aparecer **Live**, sua URL será algo como `https://sonora.onrender.com`.

### Deploys seguintes
Todo `git push` na branch `main` dispara um novo deploy automaticamente.

---

## Parte 5 — Ajustes finais no Supabase

1. **Authentication → URL Configuration**:
   - **Site URL**: `https://sonora.onrender.com`
   - **Redirect URLs**: adicione `https://sonora.onrender.com/**` e `http://localhost:8080/**`
2. **Authentication → Providers**: ative **Email** (e Google, se quiser login social).

---

## Parte 6 — Conectar os serviços de streaming (próximo passo)

Cada plataforma exige um app registrado no portal de desenvolvedores:

| Serviço | Onde registrar | Como importar |
|---|---|---|
| Spotify | developer.spotify.com | OAuth + endpoint `/me/player/recently-played` (últimas 50 faixas — sincronize a cada 30 min) |
| YouTube Music | console.cloud.google.com | OAuth Google + YouTube Data API / Google Takeout |
| Apple Music | developer.apple.com (conta paga) | MusicKit JS |
| Deezer | developers.deezer.com | OAuth + `/user/me/history` |
| Last.fm | last.fm/api | Chave simples, ótimo para histórico completo |

Guarde os `client_id`/`client_secret` como variáveis de ambiente no Render — nunca no código.

---

## Problemas comuns

| Erro | Solução |
|---|---|
| Render mostra "No open ports detected" | Confira `NITRO_PRESET=node-server` e o Start Command |
| Build falha por versão do Node | Adicione `NODE_VERSION=20` |
| App abre mas dá erro de Supabase | As variáveis `VITE_*` estão preenchidas? Refaça o deploy após adicioná-las |
| Site demora 50s para abrir | Normal no plano Free do Render (o serviço "dorme"). Plano pago resolve |
| Login redireciona errado | Ajuste Site URL / Redirect URLs no Supabase (Parte 5) |
