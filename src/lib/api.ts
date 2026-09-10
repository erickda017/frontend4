import { supabase } from "./supabase";

// Aponta pro backend Node (Projeto B). Em dev, o Node roda em localhost:3000
// por padrão (ver PORT em projB/.env). Configure em .env do front:
//   VITE_API_URL=http://localhost:3000
const apiUrlConfigurada = import.meta.env["VITE_API_URL"] as string | undefined;

if (!apiUrlConfigurada) {
  // Sem isso, um VITE_API_URL ausente/errado no build da Vercel falha em
  // silêncio: o bundle de produção tenta falar com localhost:3000 (nada no
  // navegador de quem visita o site), toda chamada falha, e as páginas só
  // mostram estados vazios genéricos — sem nenhuma pista de que a causa é
  // uma env var esquecida no build.
  console.error(
    "[api] VITE_API_URL não configurada — usando http://localhost:3000 como fallback. " +
      "Isso só funciona em desenvolvimento local; em produção (Vercel), configure " +
      "VITE_API_URL apontando para o backend (Render) antes do build.",
  );
}

export const API_URL = apiUrlConfigurada ?? "http://localhost:3000";

export class ApiError extends Error {
  status: number;
  /** Segundos que a API pediu pra esperar antes de tentar de novo (header
   *  Retry-After, presente nos 429 de rate limit do Spotify). */
  retryAfter: number | null;
  constructor(status: number, message: string, retryAfter: number | null = null) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
    this.name = "ApiError";
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// O backend só devolve 401 quando exigirLogin() rejeita o token (ausente,
// expirado ou inválido) — nunca por outro motivo de negócio. Sem isso, uma
// sessão morta (ex: aba aberta por dias, refresh token revogado) fazia toda
// chamada falhar em silêncio: as páginas só checavam "carregando", nunca
// "erro", então o usuário via a conta como vazia sem nenhum caminho de volta
// pro login. Chamar signOut() aqui dispara o onAuthStateChange do
// AuthProvider, que zera a sessão — o AppShell já redireciona pra /login
// sozinho assim que `user` vira null (ver AppShell.tsx).
function tratarSessaoInvalidaSeNecessario(status: number) {
  if (status === 401) {
    void supabase.auth.signOut();
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeader()),
    ...(init?.headers ?? {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    tratarSessaoInvalidaSeNecessario(res.status);
    const message = body?.erro || `Erro ${res.status} ao chamar ${path}`;
    const retryAfterHeader = res.headers.get("Retry-After");
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : null;
    throw new ApiError(res.status, message, Number.isFinite(retryAfter) ? retryAfter : null);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : null }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: data !== undefined ? JSON.stringify(data) : null }),
  delete: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "DELETE", body: data !== undefined ? JSON.stringify(data) : null }),
  /**
   * Upload de arquivos (multipart/form-data). Usado na importação do JSON do
   * histórico estendido do Spotify — o backend espera o campo "arquivos"
   * (ver backend/src/routes/syncRoutes.js, upload.array('arquivos', 40)).
   * Não define Content-Type de propósito: o browser precisa montar o boundary.
   *
   * Tem um timeout (padrão 3min): sem ele, se o backend travar ou o host
   * grátis estiver "dormindo" (cold start), o fetch fica pendurado pra
   * sempre e a UI mostra "processando…" indefinidamente sem nunca dar
   * erro nem sucesso. Com o timeout, pelo menos avisamos o usuário.
   */
  upload: async <T>(path: string, arquivos: File[], timeoutMs = 180_000): Promise<T> => {
    const form = new FormData();
    for (const arquivo of arquivos) form.append("arquivos", arquivo);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: await authHeader(),
        body: form,
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new ApiError(
          0,
          "A importação demorou demais e foi cancelada. Se o arquivo for muito grande, tente dividir em partes menores ou tente de novo — o servidor pode estar iniciando (primeiro acesso após um tempo parado costuma ser mais lento).",
        );
      }
      throw new ApiError(0, "Não foi possível conectar ao servidor. Verifique sua conexão e tente de novo.");
    } finally {
      clearTimeout(timeoutId);
    }

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      tratarSessaoInvalidaSeNecessario(res.status);
      throw new ApiError(res.status, body?.erro || `Erro ${res.status} ao enviar arquivos`);
    }
    return body as T;
  },
  /**
   * Upload de UM único arquivo, campo "arquivo" (singular) — usado na
   * restauração do backup próprio (ver backend/src/routes/syncRoutes.js,
   * upload.single('arquivo')). Separado de `upload` porque aquele manda
   * vários arquivos no campo "arquivos" (plural).
   */
  uploadUnico: async <T>(path: string, arquivo: File): Promise<T> => {
    const form = new FormData();
    form.append("arquivo", arquivo);

    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: await authHeader(),
      body: form,
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      tratarSessaoInvalidaSeNecessario(res.status);
      throw new ApiError(res.status, body?.erro || `Erro ${res.status} ao enviar arquivo`);
    }
    return body as T;
  },
  /**
   * Baixa um arquivo (usado na exportação CSV/JSON do histórico). Precisa
   * ser um fetch separado do `get` porque a resposta não é JSON e o backend
   * manda o nome do arquivo via Content-Disposition — o browser só respeita
   * esse header dentro de um download disparado via <a download>, então
   * criamos o link temporário aqui.
   */
  download: async (path: string, nomeArquivoPadrao: string): Promise<void> => {
    const res = await fetch(`${API_URL}${path}`, { headers: await authHeader() });
    if (!res.ok) {
      tratarSessaoInvalidaSeNecessario(res.status);
      const body = await res.json().catch(() => null);
      throw new ApiError(res.status, body?.erro || `Erro ${res.status} ao baixar ${path}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivoPadrao;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
