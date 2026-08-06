// Build 100% estático (SPA React + Vite puro) — sem SSR, sem TanStack Start,
// sem Nitro/servidor Node. `npm run build` gera apenas arquivos estáticos em
// `dist/`, prontos para o Cloudflare Pages (ou qualquer host de arquivos estáticos).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// Use "/" para domínio próprio / Cloudflare Pages. Para GitHub Pages de projeto,
// defina VITE_BASE_PATH=/nome-do-repo/ no ambiente do build.
const base = process.env['VITE_BASE_PATH'] || "/";

export default defineConfig({
  base,
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsConfigPaths(),
  ],
  server: {
    host: true,
    port: 8080,
    strictPort: true,
    allowedHosts: true,
  },
  preview: { host: true, port: 8080 },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
