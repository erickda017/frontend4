import { Link, Navigate } from "@tanstack/react-router";
import {
  AudioLines,
  BarChart3,
  History,
  Layers,
  LogOut,
  Target,
  Trophy,
  User,
  WifiOff,
} from "lucide-react";
import type { ReactNode } from "react";

import { useAuth } from "@/lib/auth-context";
import { API_URL } from "@/lib/api";
import { useSaudeBackend } from "@/lib/queries";
import { SeletorTema } from "@/components/SeletorTema";

/** Avisa quando o backend Node não responde — evita telas vazias sem explicação. */
function BackendOfflineBanner() {
  const { isError } = useSaudeBackend();
  if (!isError) return null;
  return (
    <div className="mx-auto mt-3 flex max-w-6xl items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive">
      <WifiOff className="mt-0.5 size-4 shrink-0" />
      <p>
        Sem conexão com a API ({API_URL}). Suba o backend Node (<code>npm run dev</code> na pasta{" "}
        <code>backend/</code>) ou ajuste <code>VITE_API_URL</code>.
      </p>
    </div>
  );
}

const nav = [
  { to: "/", label: "Painel", icon: BarChart3 },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/plataformas", label: "Plataformas", icon: Layers },
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/conquistas", label: "Conquistas", icon: Trophy },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Carregando…</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <AudioLines className="size-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">Sonora</span>
          </Link>
          <div className="ml-auto flex items-center gap-1 md:hidden">
            <SeletorTema />
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </div>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:bg-secondary [&.active]:text-foreground"
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
            <SeletorTema />
            <button
              onClick={() => signOut()}
              className="ml-1 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </nav>
        </div>
      </header>

      <BackendOfflineBanner />

      <main className="mx-auto max-w-6xl px-4 pt-5 pb-28 md:pt-6 md:pb-16">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground transition-colors [&.active]:text-primary"
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5 md:mb-6">
      <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
