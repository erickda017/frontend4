import { Check, Palette } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TEMAS, useTema } from "@/lib/theme";

/** Seletor de tema visual (Sonora, Dark Neon, Minimalista). */
export function SeletorTema() {
  const { tema, setTema } = useTema();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Trocar tema"
        aria-label="Trocar tema"
      >
        <Palette className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Tema visual</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TEMAS.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onSelect={() => setTema(t.id)}
            className="flex items-start gap-2"
          >
            <span className="mt-0.5 size-4 shrink-0">
              {tema === t.id ? <Check className="size-4 text-primary" /> : null}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{t.nome}</span>
              <span className="block text-xs text-muted-foreground">{t.descricao}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
