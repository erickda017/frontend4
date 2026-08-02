import { useEffect, useState } from "react";

// ----------------------------------------------------------------------------
// Extrai duas cores dominantes da capa do álbum para o brilho dinâmico do
// card "Tocando agora". Tudo roda no cliente (canvas), com fallback total:
// se a imagem não permitir leitura (CORS), se não houver capa, ou se der
// qualquer erro, devolvemos null e o card usa a cor da plataforma.
// ----------------------------------------------------------------------------

export type CoresCapa = { primaria: string; secundaria: string };

const cache = new Map<string, CoresCapa | null>();

function extrair(img: HTMLImageElement): CoresCapa | null {
  const lado = 24;
  const canvas = document.createElement("canvas");
  canvas.width = lado;
  canvas.height = lado;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, lado, lado);
  const { data } = ctx.getImageData(0, 0, lado, lado);

  // Agrupa os pixels em "caixas" de cor e pega as duas mais frequentes,
  // ignorando pixels quase transparentes e cinzas muito escuros/claros.
  const caixas = new Map<string, { n: number; qtd: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const a = data[i + 3] ?? 0;
    if (a < 128) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 30 || min > 235) continue; // preto/branco puro não ajuda no brilho
    const chave = `${r >> 5}-${g >> 5}-${b >> 5}`;
    const atual = caixas.get(chave) ?? { n: 0, qtd: 0, r: 0, g: 0, b: 0 };
    atual.n += 1 + (max - min) / 255; // dá peso extra a cores saturadas
    atual.qtd += 1;
    atual.r += r;
    atual.g += g;
    atual.b += b;
    caixas.set(chave, atual);
  }

  const ordenadas = [...caixas.values()].sort((a, b) => b.n - a.n);
  if (ordenadas.length === 0) return null;

  const media = (c: { qtd: number; r: number; g: number; b: number }) =>
    `rgb(${Math.round(c.r / c.qtd)}, ${Math.round(c.g / c.qtd)}, ${Math.round(c.b / c.qtd)})`;

  const primeira = ordenadas[0]!;
  const segunda = ordenadas[1] ?? primeira;

  return {
    primaria: media(primeira),
    secundaria: media(segunda),
  };
}

/** Cores dominantes da capa, ou null enquanto carrega / em caso de falha. */
export function useCoresDaCapa(url: string | null | undefined): CoresCapa | null {
  const [cores, setCores] = useState<CoresCapa | null>(() => (url ? (cache.get(url) ?? null) : null));

  useEffect(() => {
    if (!url) {
      setCores(null);
      return;
    }
    if (cache.has(url)) {
      setCores(cache.get(url) ?? null);
      return;
    }

    let ativo = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      let resultado: CoresCapa | null = null;
      try {
        resultado = extrair(img);
      } catch {
        resultado = null; // canvas "tainted" por CORS — usa fallback
      }
      cache.set(url, resultado);
      if (ativo) setCores(resultado);
    };
    img.onerror = () => {
      cache.set(url, null);
      if (ativo) setCores(null);
    };
    img.src = url;

    return () => {
      ativo = false;
    };
  }, [url]);

  return cores;
}
