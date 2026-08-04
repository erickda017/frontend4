import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// ----------------------------------------------------------------------------
// Temas visuais. O tema é aplicado como data-theme no <html> e as variáveis
// ficam em styles.css. Persistido em localStorage (lido só no cliente, para
// não haver acesso a browser globals durante o render inicial).
// ----------------------------------------------------------------------------

export const TEMAS = [
  { id: "sonora", nome: "Sonora", descricao: "Verde neon sobre roxo profundo" },
  { id: "dark-neon", nome: "Dark Neon", descricao: "Preto absoluto com cyan e magenta" },
  { id: "violeta", nome: "Violeta", descricao: "Roxo-violeta vibrante, escuro do começo ao fim" },
] as const;

export type TemaId = (typeof TEMAS)[number]["id"];

const STORAGE_KEY = "sonora:tema";
const IDS = TEMAS.map((t) => t.id) as readonly string[];

function ehTema(valor: unknown): valor is TemaId {
  return typeof valor === "string" && IDS.includes(valor);
}

type ThemeContextValue = { tema: TemaId; setTema: (t: TemaId) => void };

const ThemeContext = createContext<ThemeContextValue>({
  tema: "sonora",
  setTema: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<TemaId>("sonora");

  // Lê a preferência salva só depois da hidratação.
  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(STORAGE_KEY);
      // O tema claro "minimalista" foi removido: quem tinha ele salvo passa
      // automaticamente para o novo tema roxo-violeta.
      if (salvo === "minimalista") {
        setTemaState("violeta");
        window.localStorage.setItem(STORAGE_KEY, "violeta");
        return;
      }
      if (ehTema(salvo)) setTemaState(salvo);
    } catch {
      /* localStorage indisponível (modo privado): segue com o tema padrão */
    }
  }, []);

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.dataset['theme'] = tema;
    // Todos os temas são escuros agora (não existe mais tema claro).
    raiz.classList.add("dark");
  }, [tema]);

  function setTema(novo: TemaId) {
    setTemaState(novo);
    try {
      window.localStorage.setItem(STORAGE_KEY, novo);
    } catch {
      /* ignora falha de persistência */
    }
  }

  return <ThemeContext.Provider value={{ tema, setTema }}>{children}</ThemeContext.Provider>;
}

export function useTema() {
  return useContext(ThemeContext);
}
