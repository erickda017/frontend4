// Entry point used ONLY for the static build (npm run build:static).
// It boots the exact same router/routes/components as the Render (SSR)
// build, but renders 100% on the client — no server, no server functions.
// This file is not used by `npm run build` (the Render/Node build), which
// keeps using TanStack Start's own SSR entry.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found in index.html");
}

createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
