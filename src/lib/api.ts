import { supabase } from "./supabase";

// Aponta pro backend Node (Projeto B). Em dev, o Node roda em localhost:3000
// por padrão (ver PORT em projB/.env). Configure em .env do front:
//   VITE_API_URL=http://localhost:3000
export const API_URL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? "http://localhost:3000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
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
    throw new ApiError(res.status, message);
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
};

