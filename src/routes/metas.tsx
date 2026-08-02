import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { AppShell, PageHeader } from "@/components/AppShell";
import { useApagarMeta, useCriarMeta, useMetasProgresso } from "@/lib/queries";

export const Route = createFileRoute("/metas")({
  head: () => ({
    meta: [
      { title: "Metas de audição — Sonora" },
      {
        name: "description",
        content:
          "Defina metas de minutos, artistas novos e diversidade musical e acompanhe seu progresso.",
      },
      { property: "og:title", content: "Metas de audição — Sonora" },
      {
        property: "og:description",
        content: "Acompanhe metas mensais de escuta em todas as suas plataformas de streaming.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Metas,
});

const TIPOS = [
  { value: "quantidade_faixas", label: "Quantidade de faixas" },
  { value: "minutos_ouvidos", label: "Minutos ouvidos" },
  { value: "artistas_diferentes", label: "Artistas diferentes" },
] as const;

const PERIODOS = [
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
  { value: "ano", label: "Ano" },
] as const;

function Metas() {
  const { data: metas = [], isLoading } = useMetasProgresso();
  const criarMeta = useCriarMeta();
  const apagarMeta = useApagarMeta();

  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]["value"]>("minutos_ouvidos");
  const [valorAlvo, setValorAlvo] = useState(1000);
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]["value"]>("mes");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    criarMeta.mutate(
      { titulo, tipo, valor_alvo: valorAlvo, periodo },
      {
        onSuccess: () => {
          setShowForm(false);
          setTitulo("");
          setValorAlvo(1000);
        },
      },
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-3">
        <PageHeader title="Metas" subtitle="Pequenos desafios para explorar mais música." />
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex h-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          <Plus className="size-3.5" /> Nova meta
        </button>
      </div>

      {showForm ? (
        <form onSubmit={handleCreate} className="surface-card mb-4 grid gap-3 p-5 md:grid-cols-4">
          <input
            required
            placeholder="Título (ex: 1.000 minutos no mês)"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="rounded-lg border border-border bg-muted px-3 py-2 text-sm outline-none md:col-span-2"
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
            className="rounded-lg border border-border bg-muted px-3 py-2 text-sm outline-none"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as typeof periodo)}
            className="rounded-lg border border-border bg-muted px-3 py-2 text-sm outline-none"
          >
            {PERIODOS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            min={1}
            value={valorAlvo}
            onChange={(e) => setValorAlvo(Number(e.target.value))}
            className="rounded-lg border border-border bg-muted px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={criarMeta.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60 md:col-span-4"
          >
            {criarMeta.isPending ? "Criando…" : "Criar meta"}
          </button>
        </form>
      ) : null}

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}

      <div className="grid gap-3 md:grid-cols-2">
        {metas.map((g) => (
          <div key={g.id} className="surface-card p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-semibold">{g.titulo}</h2>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold text-primary">{g.percentual}%</span>
                <button
                  onClick={() => apagarMeta.mutate(g.id)}
                  className="text-muted-foreground hover:text-destructive"
                  title="Apagar meta"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Período: {PERIODOS.find((p) => p.value === g.periodo)?.label ?? g.periodo}
            </p>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${g.percentual}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {g.valor_atual} de {g.valor_alvo}
            </p>
          </div>
        ))}
        {!isLoading && metas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma meta ainda — crie a primeira acima.</p>
        ) : null}
      </div>
    </AppShell>
  );
}
