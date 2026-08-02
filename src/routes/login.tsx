import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AudioLines, Loader2 } from "lucide-react";

import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const { signInWithPassword, signUpWithPassword } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupOk, setSignupOk] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result =
      mode === "login" ? await signInWithPassword(email, password) : await signUpWithPassword(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === "signup") {
      setSignupOk(true);
      return;
    }

    navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="surface-card w-full max-w-sm p-6">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <AudioLines className="size-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">Sonora</span>
        </div>

        <h1 className="text-xl font-semibold">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login"
            ? "Entre para ver seu histórico musical."
            : "Crie sua conta para começar a sincronizar."}
        </p>

        {signupOk ? (
          <p className="mt-6 rounded-lg bg-muted p-3 text-sm text-foreground">
            Conta criada! Confira seu e-mail para confirmar o cadastro e depois faça login.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">E-mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Senha</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
        )}

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setSignupOk(false);
          }}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "login" ? "Não tem conta? Criar uma agora" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
