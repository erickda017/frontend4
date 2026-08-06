import { useEffect, useRef, useState } from "react";

/**
 * A API não expõe progresso real do processamento (é uma única resposta no
 * final), então isso simula "fases" com base no tempo decorrido — o
 * suficiente pra tirar a sensação de tela travada em "processando…" sem fim,
 * mostrando que o processo está avançando e dando uma ideia de quanto falta.
 *
 * Uso: const fase = useProgressoUpload(importar.isPending);
 */
const FASES = [
  { apos: 0, texto: "Enviando arquivo…" },
  { apos: 4_000, texto: "Lendo o histórico…" },
  { apos: 12_000, texto: "Buscando gêneros e capas no Spotify…" },
  { apos: 35_000, texto: "Quase lá, salvando as reproduções…" },
  { apos: 70_000, texto: "Ainda processando — históricos grandes podem levar alguns minutos…" },
  { apos: 130_000, texto: "Isso está demorando mais que o normal, mas ainda está rodando…" },
] as const;

export function useProgressoUpload(ativo: boolean) {
  const [faseAtual, setFaseAtual] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Limpa timers de uma rodada anterior sempre que o estado "ativo" muda.
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];

    if (!ativo) {
      setFaseAtual(0);
      return;
    }

    setFaseAtual(0);
    timersRef.current = FASES.slice(1).map((fase, i) =>
      setTimeout(() => setFaseAtual(i + 1), fase.apos),
    );

    return () => {
      for (const t of timersRef.current) clearTimeout(t);
    };
  }, [ativo]);

  return FASES[faseAtual]?.texto ?? FASES[0].texto;
}
