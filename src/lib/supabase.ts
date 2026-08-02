import { createClient } from "@supabase/supabase-js";

// These must point to the SAME Supabase project used by the Node backend
// (Projeto B / .env: SUPABASE_URL, SUPABASE_ANON_KEY). The frontend only
// ever uses the public anon key — it authenticates the user and sends the
// resulting access_token to the backend, which re-validates it.
const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Don't throw at import time (breaks SSR/build) — surface a clear runtime error instead.
  console.error(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configuradas. " +
      "Copie .env.example para .env e preencha com os mesmos valores do backend (Projeto B).",
  );
}

// Sem env configurada usamos um placeholder válido só para o cliente poder ser
// criado (nenhuma chamada real funciona) — evita quebrar SSR/preview.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "public-anon-key-placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
