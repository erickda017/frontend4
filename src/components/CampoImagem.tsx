import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

// ----------------------------------------------------------------------------
// Campo de imagem para o perfil: aceita URL ou arquivo do dispositivo.
// Arquivos são redimensionados/compactados no navegador (canvas) e virados
// em data URL, para funcionar sem serviço de storage. Sempre mostra preview.
// ----------------------------------------------------------------------------

async function comprimir(arquivo: File, larguraMax: number, alturaMax: number): Promise<string> {
  const bitmapUrl = URL.createObjectURL(arquivo);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Não consegui ler essa imagem."));
      el.src = bitmapUrl;
    });

    const escala = Math.min(1, larguraMax / img.width, alturaMax / img.height);
    const largura = Math.max(1, Math.round(img.width * escala));
    const altura = Math.max(1, Math.round(img.height * escala));

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Seu navegador não suporta o preview da imagem.");
    ctx.drawImage(img, 0, 0, largura, altura);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

export function CampoImagem({
  titulo,
  descricao,
  valor,
  onChange,
  larguraMax,
  alturaMax,
  formato,
}: {
  titulo: string;
  descricao: string;
  valor: string;
  onChange: (valor: string) => void;
  larguraMax: number;
  alturaMax: number;
  formato: "avatar" | "banner";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function selecionar(arquivo: File | undefined) {
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      setErro("Escolha um arquivo de imagem.");
      return;
    }
    setErro(null);
    setProcessando(true);
    try {
      onChange(await comprimir(arquivo, larguraMax, alturaMax));
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-medium">{titulo}</p>
      <p className="mb-2 text-xs text-muted-foreground">{descricao}</p>

      <div
        className={`relative overflow-hidden border border-border bg-surface-2 ${
          formato === "avatar" ? "size-20 rounded-2xl" : "h-24 w-full rounded-xl"
        }`}
      >
        {valor ? (
          <img
            src={valor}
            alt={`Preview de ${titulo.toLowerCase()}`}
            className="size-full object-cover"
            onError={() => setErro("Não consegui carregar essa URL de imagem.")}
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <ImagePlus className="size-5" />
          </div>
        )}
        {processando ? (
          <div className="absolute inset-0 grid place-items-center bg-background/60">
            <Loader2 className="size-4 animate-spin text-primary" />
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:border-primary/60"
        >
          Escolher arquivo
        </button>
        {valor ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setErro(null);
            }}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="size-3.5" /> remover
          </button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => void selecionar(e.target.files?.[0])}
        />
      </div>

      <input
        value={valor.startsWith("data:") ? "" : valor}
        onChange={(e) => {
          setErro(null);
          onChange(e.target.value);
        }}
        placeholder={valor.startsWith("data:") ? "imagem do dispositivo selecionada" : "https://…"}
        className="mt-2 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs outline-none focus:border-primary"
      />

      {erro ? <p className="mt-1 text-xs text-destructive">{erro}</p> : null}
    </div>
  );
}
