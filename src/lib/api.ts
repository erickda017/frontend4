import { supabase } from "./supabase";

// Aponta pro backend Node (Projeto B). Em dev, o Node roda em localhost:3000
// por padrão (ver PORT em projB/.env). Configure em .env do front:
//   VITE_API_URL=http://localhost:3000
export const API_URL =
  (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:3000";

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
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  /**
   * Upload de arquivos (multipart/form-data). Usado na importação do JSON do
   * histórico estendido do Spotify — o backend espera o campo "arquivos"
   * (ver backend/src/routes/syncRoutes.js, upload.array('arquivos', 40)).
   * Não define Content-Type de propósito: o browser precisa montar o boundary.
   */
  upload: async <T>(path: string, arquivos: File[]): Promise<T> => {
    const form = new FormData();
    for (const arquivo of arquivos) form.append("arquivos", arquivo);

    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: await authHeader(),
      body: form,
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(res.status, body?.erro || `Erro ${res.status} ao enviar arquivos`);
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
