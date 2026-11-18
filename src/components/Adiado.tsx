import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Só monta `children` quando o bloco está perto de aparecer na tela.
 *
 * Por quê: telas longas (Perfil, Painel) montavam TODOS os cards de uma vez e
 * cada card dispara sua própria chamada à API — dezenas de requisições
 * concorrentes competindo pela conexão antes do usuário sequer rolar a página.
 * Com `Adiado`, o que está acima da dobra carrega primeiro e o resto só
 * dispara perto do scroll (rootMargin antecipa um pouco para não "piscar").
 */
export function Adiado({
  children,
  minHeight = 180,
  rootMargin = "300px",
  className,
}: {
  children: ReactNode;
  minHeight?: number;
  rootMargin?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visivel, setVisivel] = useState(
    // Navegadores sem IntersectionObserver (muito antigos): carrega direto.
    typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    if (visivel) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisivel(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visivel, rootMargin]);

  return (
    <div ref={ref} className={className} style={visivel ? undefined : { minHeight }}>
      {visivel ? children : null}
    </div>
  );
}
